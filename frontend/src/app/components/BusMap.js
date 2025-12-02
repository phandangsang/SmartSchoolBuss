'use client'

import { useEffect, useState, useCallback, useRef } from 'react';

export default function BusMap({ busId, busInfo, studentPickupLocation, routeStops = [] }) {
    const [busLocation, setBusLocation] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [mapReady, setMapReady] = useState(false);
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const busMarkerRef = useRef(null);
    const studentMarkerRef = useRef(null);
    const stopMarkersRef = useRef([]);
    const routeLinesRef = useRef([]);

    const [animatedPosition, setAnimatedPosition] = useState(null);
    const animationRef = useRef(null);
    const lastPositionRef = useRef(null);
    const startTimeRef = useRef(null);
    const ANIMATION_DURATION = 5000;

    useEffect(() => {
        if (typeof window === 'undefined') return;

        import('leaflet').then((L) => {
            if (document.head && !document.querySelector('link[href*="leaflet.css"]')) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                document.head.appendChild(link);
            }

            if (L.Icon && L.Icon.Default && L.Icon.Default.prototype && L.Icon.Default.prototype._getIconUrl) {
                delete L.Icon.Default.prototype._getIconUrl;
            }
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            });

            if (mapRef.current && !mapInstanceRef.current) {
                const map = L.map(mapRef.current).setView([10.8231, 106.6297], 13);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }).addTo(map);

                mapInstanceRef.current = map;
                setMapReady(true);
            }
        }).catch(err => console.error('Failed to load Leaflet:', err));

        return () => {
            if (mapInstanceRef.current) {
                try { mapInstanceRef.current.remove(); } catch (e) { }
                mapInstanceRef.current = null;
            }
        };
    }, []);

    const fetchBusLocation = useCallback(async () => {
        if (!busId) return;
        try {
            const response = await fetch(`http://localhost/SmartSchoolBus-main/backend/public/api/bus_location.php?bus_id=${busId}`);
            const data = await response.json();
            if (data.success && data.data) {
                setBusLocation({
                    lat: parseFloat(data.data.Latitude),
                    lng: parseFloat(data.data.Longitude)
                });
                setLastUpdate(new Date(data.data.RecordedAt));
            }
        } catch (error) {
            console.error('Error fetching bus location:', error);
        }
    }, [busId]);

    useEffect(() => {
        fetchBusLocation();
        const interval = setInterval(fetchBusLocation, 5000);
        return () => clearInterval(interval);
    }, [fetchBusLocation]);

    // Set initial bus position to the first stop when route changes
    useEffect(() => {
        if (routeStops && routeStops.length > 0) {
            const sortedStops = [...routeStops].sort((a, b) => a.StopOrder - b.StopOrder);
            const firstStop = sortedStops[0];
            if (firstStop && firstStop.Latitude && firstStop.Longitude) {
                // Only set if we don't have a live location yet, OR if we want to reset view.
                // Since user asked to "stand at start point", we set it.
                // Live updates will overwrite this if available.
                setBusLocation({
                    lat: parseFloat(firstStop.Latitude),
                    lng: parseFloat(firstStop.Longitude)
                });
                // Also reset animated position to avoid flying in from previous location
                setAnimatedPosition({
                    lat: parseFloat(firstStop.Latitude),
                    lng: parseFloat(firstStop.Longitude)
                });
                lastPositionRef.current = {
                    lat: parseFloat(firstStop.Latitude),
                    lng: parseFloat(firstStop.Longitude)
                };
            }
        }
    }, [routeStops]);

    useEffect(() => {
        if (busLocation && !animatedPosition) {
            setAnimatedPosition(busLocation);
            lastPositionRef.current = busLocation;
        }
    }, [busLocation, animatedPosition]);

    useEffect(() => {
        if (!busLocation || !lastPositionRef.current) return;

        const dist = Math.sqrt(
            Math.pow(busLocation.lat - lastPositionRef.current.lat, 2) +
            Math.pow(busLocation.lng - lastPositionRef.current.lng, 2)
        );

        if (dist > 0.05) { // Increased threshold to avoid snapping on small jumps, but snap on huge ones
            setAnimatedPosition(busLocation);
            lastPositionRef.current = busLocation;
            return;
        }

        const startPos = lastPositionRef.current;
        const endPos = busLocation;
        startTimeRef.current = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTimeRef.current;
            const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
            // Linear easing for smooth continuous movement
            const easeProgress = progress;

            const newLat = startPos.lat + (endPos.lat - startPos.lat) * easeProgress;
            const newLng = startPos.lng + (endPos.lng - startPos.lng) * easeProgress;

            setAnimatedPosition({ lat: newLat, lng: newLng });

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                lastPositionRef.current = endPos;
            }
        };

        cancelAnimationFrame(animationRef.current);
        animationRef.current = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationRef.current);
    }, [busLocation]);

    const getOSRMRoute = async (startPoint, endPoint) => {
        try {
            const coords = `${startPoint.lng},${startPoint.lat};${endPoint.lng},${endPoint.lat}`;
            const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(url, {
                signal: controller.signal,
                method: 'GET',
                mode: 'cors'
            });

            clearTimeout(timeoutId);

            if (!response.ok) return null;

            const data = await response.json();

            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                return data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
            }

            return null;
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.warn('OSRM error:', error.message);
            }
            return null;
        }
    };

    useEffect(() => {
        if (!mapReady || !mapInstanceRef.current || typeof window === 'undefined') return;

        const updateRoutes = async () => {
            const L = (await import('leaflet')).default;
            const map = mapInstanceRef.current;
            if (!map) return;

            routeLinesRef.current.forEach(line => {
                try { line.remove(); } catch (e) { }
            });
            routeLinesRef.current = [];

            if (routeStops.length > 1) {
                const routeGroups = {};
                routeStops.forEach(stop => {
                    if (!routeGroups[stop.RouteID]) routeGroups[stop.RouteID] = [];
                    routeGroups[stop.RouteID].push(stop);
                });

                for (const [routeId, stops] of Object.entries(routeGroups)) {
                    if (stops.length >= 2) {
                        const sortedStops = stops.sort((a, b) => a.StopOrder - b.StopOrder);

                        const allCoordinates = [];
                        let hasOSRMRoute = true;

                        for (let i = 0; i < sortedStops.length - 1; i++) {
                            // Check if map is still valid before continuing
                            if (!mapInstanceRef.current) return;

                            const currentStop = sortedStops[i];
                            const nextStop = sortedStops[i + 1];

                            const segmentCoords = await getOSRMRoute(
                                { lat: parseFloat(currentStop.Latitude), lng: parseFloat(currentStop.Longitude) },
                                { lat: parseFloat(nextStop.Latitude), lng: parseFloat(nextStop.Longitude) }
                            );

                            if (segmentCoords && segmentCoords.length > 0) {
                                if (allCoordinates.length > 0) {
                                    allCoordinates.push(...segmentCoords.slice(1));
                                } else {
                                    allCoordinates.push(...segmentCoords);
                                }
                            } else {
                                hasOSRMRoute = false;
                                break;
                            }
                        }

                        // Check if map is still valid before adding layers
                        if (!mapInstanceRef.current) return;

                        if (hasOSRMRoute && allCoordinates.length > 0) {
                            const polyline = L.polyline(allCoordinates, {
                                color: '#2196F3',
                                weight: 4,
                                opacity: 0.8
                            }).addTo(map);
                            routeLinesRef.current.push(polyline);
                        } else {
                            const straightLine = L.polyline(
                                sortedStops.map(stop => [parseFloat(stop.Latitude), parseFloat(stop.Longitude)]),
                                {
                                    color: '#FF5722',
                                    weight: 4,
                                    opacity: 0.6,
                                    dashArray: '10, 10'
                                }
                            ).addTo(map);
                            routeLinesRef.current.push(straightLine);
                        }
                    }
                }
            }
        };

        updateRoutes();
    }, [mapReady, routeStops]);

    useEffect(() => {
        if (!mapReady || !mapInstanceRef.current || typeof window === 'undefined') return;

        const updateMarkers = async () => {
            const L = (await import('leaflet')).default;
            const map = mapInstanceRef.current;
            if (!map) return;

            if (busMarkerRef.current) {
                try { busMarkerRef.current.remove(); } catch (e) { }
            }
            if (studentMarkerRef.current) {
                try { studentMarkerRef.current.remove(); } catch (e) { }
            }
            stopMarkersRef.current.forEach(marker => {
                try { marker.remove(); } catch (e) { }
            });
            stopMarkersRef.current = [];

            if (animatedPosition) {
                const busIcon = L.icon({
                    iconUrl: 'https://maps.google.com/mapfiles/kml/shapes/bus.png',
                    iconSize: [32, 32],
                    iconAnchor: [16, 32],
                    popupAnchor: [0, -32]
                });

                busMarkerRef.current = L.marker([animatedPosition.lat, animatedPosition.lng], { icon: busIcon })
                    .addTo(map)
                    .bindPopup(`
                        <div style="padding: 4px;">
                            <h6 style="margin: 0 0 8px 0; font-weight: bold;">${busInfo?.busNumber || 'Xe buýt'}</h6>
                            <p style="margin: 4px 0; font-size: 14px;"><strong>Biển số:</strong> ${busInfo?.plateNumber || 'N/A'}</p>
                            <p style="margin: 4px 0; font-size: 14px;"><strong>Tài xế:</strong> ${busInfo?.driverName || 'N/A'}</p>
                            ${lastUpdate ? `<p style="margin: 4px 0; font-size: 12px; color: #666;">Cập nhật: ${lastUpdate.toLocaleTimeString('vi-VN')}</p>` : ''}
                        </div>
                    `);

                map.setView([animatedPosition.lat, animatedPosition.lng], map.getZoom());
            }

            if (studentPickupLocation) {
                const studentIcon = L.icon({
                    iconUrl: 'https://maps.google.com/mapfiles/kml/paddle/red-circle.png',
                    iconSize: [40, 40],
                    iconAnchor: [20, 40],
                    popupAnchor: [0, -40]
                });

                studentMarkerRef.current = L.marker([studentPickupLocation.lat, studentPickupLocation.lng], { icon: studentIcon })
                    .addTo(map)
                    .bindPopup('<div style="padding: 4px;"><strong>Điểm đón</strong></div>');
            }

            routeStops.forEach((stop) => {
                const stopIcon = L.icon({
                    iconUrl: 'https://maps.google.com/mapfiles/kml/paddle/blu-circle.png',
                    iconSize: [40, 40],
                    iconAnchor: [20, 40],
                    popupAnchor: [0, -40]
                });

                const stopMarker = L.marker([parseFloat(stop.Latitude), parseFloat(stop.Longitude)], { icon: stopIcon })
                    .addTo(map)
                    .bindPopup(`
                        <div style="padding: 4px;">
                            <h6 style="margin: 0 0 8px 0; color: #0066cc; font-weight: bold;">${stop.StopName}</h6>
                            <p style="margin: 4px 0; font-size: 14px;"><strong>Thứ tự:</strong> Điểm dừng ${stop.StopOrder}</p>
                            ${stop.ExpectedTime ? `<p style="margin: 4px 0; font-size: 12px; color: #666;">Giờ dự kiến: ${stop.ExpectedTime}</p>` : ''}
                        </div>
                    `);

                stopMarkersRef.current.push(stopMarker);
            });
        };

        updateMarkers();
    }, [mapReady, animatedPosition, studentPickupLocation, busInfo, lastUpdate, routeStops]);

    if (typeof window === 'undefined') {
        return <div style={{
            width: '100%',
            height: '700px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px'
        }}>
            <p>Đang tải bản đồ...</p>
        </div>;
    }

    return (
        <div>
            <div
                ref={mapRef}
                style={{
                    width: '100%',
                    height: '700px',
                    borderRadius: '8px',
                    backgroundColor: '#f5f5f5'
                }}
            />

            <div className="mt-3">
                {busLocation ? (
                    <div className="alert alert-success">
                        <strong>✓ Đang theo dõi xe buýt</strong>
                        {lastUpdate && (
                            <span className="ms-2">
                                - Cập nhật lần cuối: {lastUpdate.toLocaleString('vi-VN')}
                            </span>
                        )}
                    </div>
                ) : (
                    <div className="alert alert-warning">
                        <strong>⚠ Chưa có dữ liệu vị trí</strong>
                        <br />
                        <small>Xe buýt chưa bật GPS hoặc chưa có chuyến nào gần đây</small>
                    </div>
                )}
                <div className="alert alert-info mt-2">
                    <small>
                        <strong>📍 Chú thích:</strong> Đường màu xanh = Tuyến đường theo đường phố thực tế (qua tất cả điểm dừng) |
                        Đường đứt nét đỏ = Đường dự phòng
                    </small>
                </div>
            </div>
        </div>
    );
}
