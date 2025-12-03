'use client'
// Chuyển đổi trạng thái
function getStatusLabel(status) {
    switch ((status || '').toLowerCase()) {
        case 'scheduled':
        case 'da len lich':
            return { label: 'Đã lên lịch', variant: 'info' };
        case 'completed':
        case 'hoan thanh':
            return { label: 'Đã hoàn thành', variant: 'success' };
        case 'cancelled':
        case 'huy':
            return { label: 'Đã hủy', variant: 'secondary' };
        case 'inprogress':
        case 'dang chay':
            return { label: 'Đang chạy', variant: 'primary' };
        default:
            return { label: status, variant: 'secondary' };
    }
}

import { useState, useEffect } from 'react';

import { Container, Card, Table, Button, Badge, Alert, Modal, Form } from 'react-bootstrap';
import Sidebar from '../components/sidebar';

import { adminAPI, assignmentAPI, driverAPI } from '../utils/api';
import '../styles/driver.css';



export default function DriverPage() {
    const [activeTab, setActiveTab] = useState('schedule');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(false);
    const [trips, setTrips] = useState([]);
    const [students, setStudents] = useState([]);
    const [assignments, setAssignments] = useState([]); // Lưu phân công tuyến đường
    const [routesMap, setRoutesMap] = useState({}); // Map RouteID -> Route
    const [busesMap, setBusesMap] = useState({}); // Map BusID -> Bus
    const [selectedTrip, setSelectedTrip] = useState(null);
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [alertContent, setAlertContent] = useState('');
    const [reportStatus, setReportStatus] = useState('');
    const [driverBusId, setDriverBusId] = useState(null);

    // Simulation states
    const [runningTrips, setRunningTrips] = useState({}); // { tripId: { intervalId, currentStopIndex, stops } }

    // Message states
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        if (activeTab === 'notifications') {
            loadMessages();
        }
    }, [activeTab]);

    const loadMessages = async () => {
        try {
            const res = await driverAPI.getMessages();
            if (res.success) setMessages(res.data);
        } catch (e) { console.error(e); }
    };


    useEffect(() => {
        const userRole = localStorage.getItem('userRole');
        if (userRole === 'driver') {
            setIsAuthenticated(true);
            loadTrips();
            loadAssignments();
        } else {
            window.location.href = '/login';
        }
    }, []);

    // Lấy danh sách phân công tuyến đường cho tài xế
    const loadAssignments = async () => {
        setLoading(true);
        try {
            const userId = localStorage.getItem('userId');
            // Lấy danh sách tài xế để tìm DriverID ứng với UserID
            const driversRes = await adminAPI.getDrivers();
            let driverId = null;
            if (driversRes.success) {
                const found = (driversRes.data || []).find(d => String(d.UserID) === String(userId));
                if (found) driverId = found.DriverID;
            }
            if (!driverId) {
                setAssignments([]);
                setLoading(false);
                return;
            }
            const res = await assignmentAPI.getAssignments();
            if (res.success) {
                // Lọc các phân công có DriverID trùng với tài xế
                const driverAssignments = (res.data || []).filter(a => String(a.DriverID) === String(driverId));
                setAssignments(driverAssignments);
                // Lưu BusID đầu tiên để dùng cho GPS Simulator
                if (driverAssignments.length > 0) {
                    setDriverBusId(driverAssignments[0].BusID);
                }
                // Lấy thông tin tuyến và xe cho các phân công này
                const routeIds = [...new Set(driverAssignments.map(a => a.RouteID))];
                const busIds = [...new Set(driverAssignments.map(a => a.BusID))];
                // Lấy routes
                const routesRes = await adminAPI.getRoutes();
                if (routesRes.success) {
                    const map = {};
                    (routesRes.data || []).forEach(r => { map[r.RouteID] = r; });
                    setRoutesMap(map);
                }
                // Lấy buses
                const busesRes = await adminAPI.getBuses();
                if (busesRes.success) {
                    const map = {};
                    (busesRes.data || []).forEach(b => { map[b.BusID] = b; });
                    setBusesMap(map);
                }
            }
        } catch (err) { }
        setLoading(false);
    };

    const loadTrips = async () => {
        setLoading(true);
        try {
            // Lấy userId và userName từ localStorage
            const userId = localStorage.getItem('userId');
            const userName = localStorage.getItem('userName');
            const res = await adminAPI.getTrips();
            if (res.success) {
                // Lọc các chuyến có DriverID hoặc DriverName trùng với tài xế đang đăng nhập
                const trips = (res.data || []).filter(trip => {
                    // Ưu tiên so sánh DriverID nếu có, nếu không thì so sánh DriverName
                    if (userId && trip.DriverID && String(trip.DriverID) === String(userId)) return true;
                    if (userName && trip.DriverName && trip.DriverName === userName) return true;
                    return false;
                });
                setTrips(trips);
            }
        } catch (err) { }
        setLoading(false);
    };

    const handleViewStudents = async (trip) => {
        setSelectedTrip(trip);
        setLoading(true);
        try {
            const res = await driverAPI.getTripStudents(trip.TripID);
            if (res.success) {
                setStudents(res.data);
            } else {
                setStudents([]);
            }
        } catch (err) {
            setStudents([]);
        }
        setLoading(false);
    };

    const handleReportPickup = async (studentId, status) => {
        setReportStatus('');
        try {
            await driverAPI.reportStudent(selectedTrip.TripID, studentId, status);
            // Reload students to get updated status
            const res = await driverAPI.getTripStudents(selectedTrip.TripID);
            if (res.success) {
                setStudents(res.data);
            }
            setReportStatus('Đã cập nhật trạng thái!');
        } catch (err) {
            setReportStatus('Lỗi cập nhật!');
        }
    };

    const handleSendAlert = async () => {
        setLoading(true);
        try {
            await driverAPI.sendAlert({ content: alertContent });
            setShowAlertModal(false);
            setAlertContent('');
        } catch (err) { }
        setLoading(false);
    };

    // Hàm tính khoảng cách giữa 2 điểm GPS (Haversine formula)
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3; // Bán kính Trái Đất (mét)
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Khoảng cách (mét)
    };

    // Helper to get route from OSRM
    const getOSRMRoute = async (start, end) => {
        try {
            const coords = `${start.lng},${start.lat};${end.lng},${end.lat}`;
            const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.code === 'Ok' && data.routes?.[0]) {
                return data.routes[0].geometry.coordinates.map(c => ({ lat: c[1], lng: c[0] }));
            }
        } catch (e) { console.error(e); }
        return null;
    };

    // Helper to resample path to have points ~50m apart
    const resamplePath = (points, intervalMeters = 50) => {
        if (!points || points.length < 2) return points;
        const result = [points[0]];
        let lastPoint = points[0];

        for (let i = 1; i < points.length; i++) {
            const dist = calculateDistance(lastPoint.lat, lastPoint.lng, points[i].lat, points[i].lng);
            if (dist >= intervalMeters) {
                result.push(points[i]);
                lastPoint = points[i];
            }
        }
        // Always include last point
        if (result[result.length - 1] !== points[points.length - 1]) {
            result.push(points[points.length - 1]);
        }
        return result;
    };

    // Tự động cập nhật trạng thái học sinh gần điểm hiện tại
    const autoUpdateNearbyStudents = async (tripId, currentLat, currentLng) => {
        const PROXIMITY_THRESHOLD = 50; // 50 mét

        try {
            console.log(`🔍 Checking students near (${currentLat}, ${currentLng})`);

            // Lấy danh sách học sinh
            const res = await driverAPI.getTripStudents(tripId);
            if (!res.success || !res.data) {
                console.log('❌ Failed to get students:', res);
                return;
            }

            const students = res.data;
            console.log(`📋 Total students on route: ${students.length}`);
            console.log('Student data:', students);

            // Kiểm tra từng học sinh
            for (const student of students) {
                console.log(`\n👤 Checking: ${student.FullName}`);
                console.log(`   Status: ${student.Status}`);
                console.log(`   PickupPoint: ${student.PickupPoint} (${student.PickupStopName})`);
                console.log(`   PickupLatitude: ${student.PickupLatitude}`);
                console.log(`   PickupLongitude: ${student.PickupLongitude}`);
                console.log(`   DropoffPoint: ${student.DropoffStopName}`);
                console.log(`   DropoffLatitude: ${student.DropoffLatitude}`);
                console.log(`   DropoffLongitude: ${student.DropoffLongitude}`);

                // === TỰ ĐỘNG ĐÓN HỌC SINH ===
                // Chỉ cập nhật nếu chưa đón (pending hoặc waiting)
                if (student.Status === 'pending' || student.Status === 'waiting') {
                    // Kiểm tra có tọa độ điểm đón không
                    if (!student.PickupLatitude || !student.PickupLongitude) {
                        console.log(`   ⏭️ Skipped pickup: No pickup coordinates`);
                    } else {
                        const distance = calculateDistance(
                            currentLat, currentLng,
                            parseFloat(student.PickupLatitude),
                            parseFloat(student.PickupLongitude)
                        );
                        console.log(`   📏 Distance to pickup point: ${distance.toFixed(1)}m (threshold: ${PROXIMITY_THRESHOLD}m)`);

                        // Nếu gần (< 50m), tự động đánh dấu đã đón
                        if (distance < PROXIMITY_THRESHOLD) {
                            console.log(`   ✅ AUTO-PICKING ${student.FullName}!`);
                            await driverAPI.reportStudent(tripId, student.StudentID, 'picked');
                            console.log(`   ✅ Auto-picked: ${student.FullName} (${distance.toFixed(1)}m)`);
                        } else {
                            console.log(`   ⏭️ Too far from pickup: ${distance.toFixed(1)}m > ${PROXIMITY_THRESHOLD}m`);
                        }
                    }
                }

                // === TỰ ĐỘNG TRẢ HỌC SINH ===
                // Nếu đã đón rồi (picked), kiểm tra xem đến điểm trả chưa
                else if (student.Status === 'picked') {
                    // Kiểm tra có tọa độ điểm trả không
                    if (!student.DropoffLatitude || !student.DropoffLongitude) {
                        console.log(`   ⏭️ Skipped dropoff: No dropoff coordinates`);
                    } else {
                        const distance = calculateDistance(
                            currentLat, currentLng,
                            parseFloat(student.DropoffLatitude),
                            parseFloat(student.DropoffLongitude)
                        );
                        console.log(`   📏 Distance to dropoff point: ${distance.toFixed(1)}m (threshold: ${PROXIMITY_THRESHOLD}m)`);

                        // Nếu gần (< 50m), tự động đánh dấu đã trả
                        if (distance < PROXIMITY_THRESHOLD) {
                            console.log(`   🎯 AUTO-DROPPING ${student.FullName}!`);
                            await driverAPI.reportStudent(tripId, student.StudentID, 'dropped');
                            console.log(`   ✅ Auto-dropped: ${student.FullName} (${distance.toFixed(1)}m)`);
                        } else {
                            console.log(`   ⏭️ Too far from dropoff: ${distance.toFixed(1)}m > ${PROXIMITY_THRESHOLD}m`);
                        }
                    }
                }

                // Bỏ qua nếu đã trả (dropped) hoặc vắng (absent)
                else {
                    console.log(`   ⏭️ Skipped: Status is ${student.Status} (already completed)`);
                }
            }
        } catch (error) {
            console.error('Error auto-updating students:', error);
        }
    };


    // Start auto simulation for a trip
    const handleStartTrip = async (trip) => {
        if (runningTrips[trip.TripID]) {
            alert('Chuyến này đang chạy!');
            return;
        }

        // Check if this bus is already running in another trip
        const isBusRunning = Object.values(runningTrips).some(t => t.busId === trip.BusID);
        if (isBusRunning) {
            alert(`Xe ${trip.PlateNumber} đang chạy ở một chuyến khác! Vui lòng dừng chuyến đó trước.`);
            return;
        }

        try {
            // Reset tất cả học sinh về trạng thái "waiting" khi bắt đầu chuyến
            console.log('🔄 Resetting all students to waiting status...');
            const studentsRes = await driverAPI.getTripStudents(trip.TripID);
            if (studentsRes.success && studentsRes.data) {
                for (const student of studentsRes.data) {
                    // Reset mỗi học sinh về waiting
                    await driverAPI.reportStudent(trip.TripID, student.StudentID, 'waiting');
                }
                console.log(`✅ Reset ${studentsRes.data.length} students to waiting status`);
            }

            // Get route stops
            const response = await fetch(`http://localhost/SmartSchoolBus-main/backend/public/api/route_stops.php?route_id=${trip.RouteID}`);
            const data = await response.json();

            if (!data.success || !data.data || data.data.length === 0) {
                alert('Không tìm thấy điểm dừng cho tuyến này!');
                return;
            }

            const stops = data.data.sort((a, b) => a.StopOrder - b.StopOrder);
            console.log('✅ Loaded stops:', stops.map(s => `${s.StopName} (${s.Latitude}, ${s.Longitude})`));

            // Calculate full path
            let fullPath = [];
            for (let i = 0; i < stops.length - 1; i++) {
                const start = { lat: parseFloat(stops[i].Latitude), lng: parseFloat(stops[i].Longitude) };
                const end = { lat: parseFloat(stops[i + 1].Latitude), lng: parseFloat(stops[i + 1].Longitude) };
                const segment = await getOSRMRoute(start, end);
                if (segment) {
                    fullPath.push(...segment);
                } else {
                    console.warn(`⚠️ OSRM failed for segment ${i}, using straight line.`);
                    fullPath.push(start, end); // Fallback to straight line
                }
            }

            // Resample path to ~20m intervals for smoother animation
            const simulationPoints = resamplePath(fullPath, 20);
            console.log(`✅ Generated ${simulationPoints.length} simulation points from ${fullPath.length} raw points.`);

            if (simulationPoints.length === 0) {
                alert('Không thể tạo lộ trình mô phỏng!');
                return;
            }

            let currentPointIndex = 0;

            // Start interval to update location
            const intervalId = setInterval(async () => {
                if (currentPointIndex >= simulationPoints.length) {
                    // Completed
                    clearInterval(intervalId);
                    setRunningTrips(prev => {
                        const newState = { ...prev };
                        delete newState[trip.TripID];
                        return newState;
                    });
                    alert(`Chuyến ${trip.RouteName} đã hoàn thành!`);
                    return;
                }

                const point = simulationPoints[currentPointIndex];

                // Send location to server
                await fetch('http://localhost/SmartSchoolBus-main/backend/public/api/bus_location.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        busId: trip.BusID,
                        tripId: trip.TripID,
                        latitude: point.lat,
                        longitude: point.lng,
                        speed: 36, // Simulated speed
                        heading: 0
                    })
                });

                console.log(`📍 Point ${currentPointIndex + 1}/${simulationPoints.length} - Lat: ${point.lat}, Lng: ${point.lng}`);

                // Check if passing a stop
                const nearbyStop = stops.find(s => calculateDistance(point.lat, point.lng, parseFloat(s.Latitude), parseFloat(s.Longitude)) < 60);
                if (nearbyStop) {
                    console.log(`🚏 Arrived at stop: ${nearbyStop.StopName}`);
                }

                // Tự động cập nhật học sinh gần điểm hiện tại
                await autoUpdateNearbyStudents(
                    trip.TripID,
                    point.lat,
                    point.lng
                );
                currentPointIndex++;
            }, 1000); // Every 1 second for faster simulation

            // Save running trip state
            setRunningTrips(prev => ({
                ...prev,
                [trip.TripID]: { intervalId, currentStopIndex: 0, stops, busId: trip.BusID }
            }));

            alert(`Bắt đầu chuyến ${trip.RouteName}!`);
        } catch (error) {
            console.error('Error starting trip:', error);
            alert('Lỗi khi bắt đầu chuyến!');
        }
    };

    // Stop auto simulation
    const handleStopTrip = (tripId) => {
        const runningTrip = runningTrips[tripId];
        if (!runningTrip) {
            alert('Chuyến này không chạy!');
            return;
        }

        clearInterval(runningTrip.intervalId);
        setRunningTrips(prev => {
            const newState = { ...prev };
            delete newState[tripId];
            return newState;
        });
        alert('Đã dừng chuyến!');
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            // Clear all intervals when component unmounts
            Object.values(runningTrips).forEach(trip => {
                clearInterval(trip.intervalId);
            });
        };
    }, [runningTrips]);

    if (!isAuthenticated) {
        return <div>Loading...</div>;
    }


    // Nội dung từng tab
    let content = null;
    if (activeTab === 'schedule') {
        content = (
            <>
                <h2>Lịch làm việc hôm nay</h2>
                {loading && <div>Đang tải dữ liệu...</div>}
                <Table hover bordered size="sm">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Tuyến đường</th>
                            <th>Xe buýt</th>
                            <th>Giờ xuất phát</th>
                            <th>Trạng thái</th>
                            <th>Học sinh</th>
                            <th>Điều khiển</th>
                        </tr >
                    </thead >
                    <tbody>
                        {trips.map((trip, idx) => (
                            <tr key={trip.TripID}>
                                <td>{idx + 1}</td>
                                <td>{trip.RouteName}</td>
                                <td>{trip.PlateNumber}</td>
                                <td>{trip.StartTime}</td>
                                <td>{(() => {
                                    const s = getStatusLabel(trip.Status);
                                    return <Badge bg={s.variant} style={{ fontSize: '1rem', padding: '0.5em 1em', minWidth: 90, display: 'inline-block' }}>{s.label}</Badge>;
                                })()}</td>
                                <td>
                                    <Button size="sm" onClick={() => handleViewStudents(trip)}>
                                        Xem danh sách
                                    </Button>
                                </td>
                                <td>
                                    {runningTrips[trip.TripID] ? (
                                        <>
                                            <Badge bg="success" className="me-2">Đang chạy...</Badge>
                                            <Button size="sm" variant="danger" onClick={() => handleStopTrip(trip.TripID)}>
                                                ⏸️ Dừng
                                            </Button>
                                        </>
                                    ) : (
                                        <Button size="sm" variant="success" onClick={() => handleStartTrip(trip)}>
                                            🚀 Bắt đầu
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table >
            </>
        );
    } else if (activeTab === 'students') {
        content = (
            <>
                <h2>Quản lý học sinh</h2>
                <div>Chọn lịch trình để xem danh sách học sinh.</div>
                <Table hover bordered size="sm">
                    <thead>
                        <tr>
                            <th>Tuyến đường</th>
                            <th>Xe buýt</th>
                            <th>Giờ xuất phát</th>
                            <th>Học sinh</th>
                        </tr>
                    </thead >
                    <tbody>
                        {trips.map(trip => (
                            <tr key={trip.TripID}>
                                <td>{trip.RouteName}</td>
                                <td>{trip.PlateNumber}</td>
                                <td>{trip.StartTime}</td>
                                <td>
                                    <Button size="sm" onClick={() => handleViewStudents(trip)}>
                                        Xem danh sách
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table >
            </>
        );
    } else if (activeTab === 'routes') {
        content = (
            <>
                <h2>Tuyến đường của tôi</h2>
                <div>Danh sách các tuyến đường bạn được phân công.</div>
                <Table hover bordered size="sm">
                    <thead>
                        <tr>
                            <th>Mã tuyến</th>
                            <th>Tên tuyến</th>
                            <th>Xe buýt</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assignments.map(a => {
                            const route = routesMap[a.RouteID] || {};
                            const bus = busesMap[a.BusID] || {};
                            return (
                                <tr key={a.AssignmentID}>
                                    <td>{route.RouteID || a.RouteID}</td>
                                    <td>{route.RouteName || ''}</td>
                                    <td>{bus.PlateNumber || ''}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table >
            </>
        );
    } else if (activeTab === 'alerts') {
        content = (
            <>
                <h2>Gửi cảnh báo khẩn cấp</h2>
                <Button variant="danger" onClick={() => setShowAlertModal(true)}>Gửi cảnh báo</Button>
            </>
        );
    } else if (activeTab === 'notifications') {
        content = (
            <>
                <div className="admin-header mb-4">
                    <h1 className="admin-title">Thông báo</h1>
                    <p className="admin-subtitle">Danh sách thông báo từ Quản trị viên</p>
                </div>
                <div className="row">
                    <div className="col-md-12">
                        <Card>
                            <Card.Header>Danh sách thông báo</Card.Header>
                            <Card.Body style={{ maxHeight: '600px', overflowY: 'auto' }}>
                                {messages.length === 0 ? (
                                    <p className="text-center text-muted my-4">Chưa có thông báo nào</p>
                                ) : (
                                    <div className="message-list">
                                        {messages.map(msg => (
                                            <div key={msg.MessageID} className="border-bottom p-3">
                                                <div className="d-flex justify-content-between">
                                                    <strong>{msg.FromName} <span className="text-muted" style={{ fontSize: '0.8em' }}>({msg.FromRole})</span></strong>
                                                    <small className="text-muted">{new Date(msg.SentAt).toLocaleString()}</small>
                                                </div>
                                                <p className="mb-0 mt-2">{msg.Content}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </div>
                </div>
            </>
        );
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                userRole="driver"
            />
            <div className="driver-content" style={{ flex: 1, background: '#f7f8fa', padding: 32 }}>
                <Container fluid>
                    {content}
                </Container>
            </div>

            {/* Modal danh sách học sinh */}
            <Modal show={!!selectedTrip} onHide={() => { setSelectedTrip(null); setStudents([]); }}>
                <Modal.Header closeButton>
                    <Modal.Title>Danh sách học sinh trên chuyến</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {loading ? <div>Đang tải...</div> : (
                        <Table size="sm" bordered>
                            <thead>
                                <tr>
                                    <th>Mã HS</th>
                                    <th>Họ tên</th>
                                    <th>Điểm đón</th>
                                    <th>Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map(stu => {
                                    let statusLabel = 'Chưa đón';
                                    let statusVariant = 'secondary';
                                    if (stu.Status === 'picked') { statusLabel = 'Đã đón'; statusVariant = 'primary'; }
                                    else if (stu.Status === 'dropped') { statusLabel = 'Đã trả'; statusVariant = 'success'; }
                                    else if (stu.Status === 'absent') { statusLabel = 'Vắng'; statusVariant = 'danger'; }

                                    return (
                                        <tr key={stu.StudentID}>
                                            <td>{stu.StudentID}</td>
                                            <td>{stu.FullName}</td>
                                            <td>{stu.PickupPoint}</td>
                                            <td><Badge bg={statusVariant}>{statusLabel}</Badge></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    )}
                    {reportStatus && <Alert variant="info" className="mt-2">{reportStatus}</Alert>}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => { setSelectedTrip(null); setStudents([]); }}>Đóng</Button>
                </Modal.Footer>
            </Modal>

            {/* Modal gửi cảnh báo */}
            <Modal show={showAlertModal} onHide={() => setShowAlertModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Gửi cảnh báo khẩn cấp</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group>
                            <Form.Label>Nội dung cảnh báo</Form.Label>
                            <Form.Control as="textarea" rows={3} value={alertContent} onChange={e => setAlertContent(e.target.value)} />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAlertModal(false)}>Hủy</Button>
                    <Button variant="danger" onClick={handleSendAlert}>Gửi cảnh báo</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
