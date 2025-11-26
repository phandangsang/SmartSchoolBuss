'use client'

import { useEffect, useState, useCallback } from 'react';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';

const containerStyle = {
    width: '100%',
    height: '500px',
    borderRadius: '8px'
};

const defaultCenter = {
    lat: 10.8231,
    lng: 106.6297
};

export default function BusMap({ busId, busInfo, studentPickupLocation }) {
    const [map, setMap] = useState(null);
    const [busLocation, setBusLocation] = useState(null);
    const [showInfo, setShowInfo] = useState(false);
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

    const onLoad = useCallback((map) => setMap(map), []);
    const onUnmount = useCallback(() => setMap(null), []);

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
                center={busLocation || defaultCenter}
                zoom={15}
                onLoad={onLoad}
                onUnmount={onUnmount}
            >
                {busLocation && (
                    <Marker
                        position={busLocation}
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
