'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { GoogleMap, Marker, InfoWindow, Polyline, useJsApiLoader } from '@react-google-maps/api';

const containerStyle = {
    width: '150%',
    height: '700px',
    borderRadius: '8px',
    marginLeft: '-10%'
};

const defaultCenter = {
    lat: 10.8231,
    lng: 106.6297
};

export default function BusMap({ busId, busInfo, studentPickupLocation, routeStops = [] }) {
    const [map, setMap] = useState(null);
    const [busLocation, setBusLocation] = useState(null);
    const [showInfo, setShowInfo] = useState(false);
    const [selectedStop, setSelectedStop] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(null);

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: apiKey || ''
    });

    const fetchBusLocation = useCallback(async () => {
        if (!busId) return;
        try {
            const response = await fetch(
                `http://localhost/SmartSchoolBus-main/backend/public/api/bus_location.php?bus_id=${busId}`
            );
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
        const interval = setInterval(fetchBusLocation, 10000);
        return () => clearInterval(interval);
    }, [fetchBusLocation]);

    useEffect(() => {
        if (map && busLocation) {
            map.panTo(busLocation);
        }
    }, [map, busLocation]);

    // Animation state
    const [animatedPosition, setAnimatedPosition] = useState(null);
    const animationRef = useRef(null);
    const lastPositionRef = useRef(null);
    const startTimeRef = useRef(null);
    const ANIMATION_DURATION = 2000; // 2 seconds for smooth transition

    // Initialize animated position when busLocation is first loaded
    useEffect(() => {
        if (busLocation && !animatedPosition) {
            setAnimatedPosition(busLocation);
            lastPositionRef.current = busLocation;
        }
    }, [busLocation]);

    // Handle animation when busLocation changes
    useEffect(() => {
        if (!busLocation || !lastPositionRef.current) return;

        // If distance is too large (e.g. first load or GPS jump), snap to new location
        const dist = Math.sqrt(
            Math.pow(busLocation.lat - lastPositionRef.current.lat, 2) +
            Math.pow(busLocation.lng - lastPositionRef.current.lng, 2)
        );

        if (dist > 0.01) { // ~1km
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

            // Ease out cubic function for smoother movement
            const easeProgress = 1 - Math.pow(1 - progress, 3);

            const newLat = startPos.lat + (endPos.lat - startPos.lat) * easeProgress;
            const newLng = startPos.lng + (endPos.lng - startPos.lng) * easeProgress;

            const newPos = { lat: newLat, lng: newLng };
            setAnimatedPosition(newPos);

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

    const onLoad = useCallback((map) => setMap(map), []);
    const onUnmount = useCallback(() => setMap(null), []);

    // Debug: Log routeStops khi thay đổi
    useEffect(() => {
        console.log('BusMap received routeStops:', routeStops);
        console.log('Number of stops:', routeStops.length);
        if (routeStops.length > 0) {
            const uniqueRoutes = [...new Set(routeStops.map(s => s.RouteID))];
            console.log('Unique RouteIDs in routeStops:', uniqueRoutes);
        }
    }, [routeStops]);

    if (!apiKey) {
        return (
            <div className="alert alert-danger">
                <strong>Lỗi:</strong> Chưa cấu hình Google Maps API key.
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="alert alert-danger">
                <strong>Lỗi:</strong> Không tải được Google Maps.
            </div>
        );
    }

    if (!isLoaded) {
        return <div>Đang tải bản đồ...</div>;
    }

    return (
        <div>
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={animatedPosition || defaultCenter}
                zoom={15}
                onLoad={onLoad}
                onUnmount={onUnmount}
            >
                {animatedPosition && (
                    <Marker
                        position={animatedPosition}
                        icon="https://maps.google.com/mapfiles/kml/shapes/bus.png"
                        onClick={() => setShowInfo(true)}
                    >
                        {showInfo && (
                            <InfoWindow onCloseClick={() => setShowInfo(false)}>
                                <div style={{ padding: '8px' }}>
                                    <h6 style={{ margin: '0 0 8px 0' }}>
                                        {busInfo?.busNumber || 'Xe buýt'}
                                    </h6>
                                    <p style={{ margin: '4px 0', fontSize: '14px' }}>
                                        <strong>Biển số:</strong> {busInfo?.plateNumber || 'N/A'}
                                    </p>
                                    <p style={{ margin: '4px 0', fontSize: '14px' }}>
                                        <strong>Tài xế:</strong> {busInfo?.driverName || 'N/A'}
                                    </p>
                                    {lastUpdate && (
                                        <p style={{ margin: '4px 0', fontSize: '12px', color: '#666' }}>
                                            Cập nhật: {lastUpdate.toLocaleTimeString('vi-VN')}
                                        </p>
                                    )}
                                </div>
                            </InfoWindow>
                        )}
                    </Marker>
                )}

                {studentPickupLocation && (
                    <Marker
                        position={studentPickupLocation}
                        icon="https://maps.google.com/mapfiles/kml/paddle/red-circle.png"
                        title="Điểm đón"
                    />
                )}

                {/* Hiển thị các điểm dừng trên tuyến */}
                {routeStops.map((stop, index) => (
                    <Marker
                        key={stop.StopID}
                        position={{
                            lat: parseFloat(stop.Latitude),
                            lng: parseFloat(stop.Longitude)
                        }}
                        icon={{
                            url: "https://maps.google.com/mapfiles/kml/paddle/blu-circle.png",
                            scaledSize: new window.google.maps.Size(40, 40)
                        }}
                        label={{
                            text: String(stop.StopOrder || index + 1),
                            color: "white",
                            fontSize: "14px",
                            fontWeight: "bold"
                        }}
                        onClick={() => setSelectedStop(stop)}
                    >
                        {selectedStop?.StopID === stop.StopID && (
                            <InfoWindow onCloseClick={() => setSelectedStop(null)}>
                                <div style={{ padding: '8px' }}>
                                    <h6 style={{ margin: '0 0 8px 0', color: '#0066cc' }}>
                                        {stop.StopName}
                                    </h6>
                                    <p style={{ margin: '4px 0', fontSize: '14px' }}>
                                        <strong>Thứ tự:</strong> Điểm dừng {stop.StopOrder}
                                    </p>
                                    {stop.ExpectedTime && (
                                        <p style={{ margin: '4px 0', fontSize: '12px', color: '#666' }}>
                                            Giờ dự kiến: {stop.ExpectedTime}
                                        </p>
                                    )}
                                </div>
                            </InfoWindow>
                        )}
                    </Marker>
                ))}

                {/* Vẽ tuyến đường nối các điểm dừng - nhóm theo RouteID */}
                {routeStops.length > 1 && (() => {
                    // Nhóm điểm dừng theo RouteID
                    const routeGroups = {};
                    routeStops.forEach(stop => {
                        if (!routeGroups[stop.RouteID]) {
                            routeGroups[stop.RouteID] = [];
                        }
                        routeGroups[stop.RouteID].push(stop);
                    });

                    // Vẽ polyline cho từng tuyến
                    return Object.values(routeGroups).map((stops, index) => {
                        if (stops.length < 2) return null;

                        return (
                            <Polyline
                                key={`route-${stops[0].RouteID}-${index}`}
                                path={stops
                                    .sort((a, b) => a.StopOrder - b.StopOrder)
                                    .map(stop => ({
                                        lat: parseFloat(stop.Latitude),
                                        lng: parseFloat(stop.Longitude)
                                    }))}
                                options={{
                                    strokeColor: '#2196F3',
                                    strokeOpacity: 0.8,
                                    strokeWeight: 4,
                                    geodesic: true
                                }}
                            />
                        );
                    });
                })()}
            </GoogleMap>

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
            </div>
        </div>
    );
}
