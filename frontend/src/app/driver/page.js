
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
                            <th>Báo cáo</th>
                        </tr>
                    </thead>
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
                                    <Button size="sm" variant="warning" onClick={() => setShowAlertModal(true)}>
                                        Gửi cảnh báo
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
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
                    </thead>
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
                </Table>
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
                </Table>
            </>
        );
    } else if (activeTab === 'alerts') {
        content = (
            <>
                <h2>Gửi cảnh báo khẩn cấp</h2>
                <Button variant="danger" onClick={() => setShowAlertModal(true)}>Gửi cảnh báo</Button>
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
                                    <th>Thao tác</th>
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
                                            <td>
                                                <Button size="sm" variant="outline-primary" className="me-1" onClick={() => handleReportPickup(stu.StudentID, 'picked')}>Đón</Button>
                                                <Button size="sm" variant="outline-success" className="me-1" onClick={() => handleReportPickup(stu.StudentID, 'dropped')}>Trả</Button>
                                                <Button size="sm" variant="outline-danger" onClick={() => handleReportPickup(stu.StudentID, 'absent')}>Vắng</Button>
                                            </td>
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
