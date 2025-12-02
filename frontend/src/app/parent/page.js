'use client'

import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, ListGroup, Modal } from 'react-bootstrap';
import Sidebar from '../components/sidebar';
import BusMap from '../components/BusMap';
import '../styles/parent.css';
import { parentAPI } from '../utils/api';

export default function ParentPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [activeTab, setActiveTab] = useState('tracking');
    const [studentName, setStudentName] = useState('');
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState(null);

    // Thông tin học sinh
    const [studentInfo, setStudentInfo] = useState({});

    // Xe buýt của con
    const [busInfo, setBusInfo] = useState({});

    // Tuyến đường
    const [routeId, setRouteId] = useState(null);
    const [routeStops, setRouteStops] = useState([]);

    // Thông báo & cảnh báo
    const [notifications, setNotifications] = useState([]);



    useEffect(() => {
        const userRole = localStorage.getItem('userRole');
        const userId = localStorage.getItem('userId');
        if (userRole === 'parent' && userId) {
            setIsAuthenticated(true);
            // Gọi API mới lấy thông tin theo userId
            fetch(`http://localhost/SmartSchoolBus-main/backend/public/api/studentinfo_userid.php?user_id=${userId}`)
                .then(res => res.json())
                .then(res => {
                    if (res.success && res.data) {
                        const { student, parent, parentUser, route, assignment, bus, driver } = res.data;
                        setStudentInfo(prev => ({
                            ...prev,
                            id: student.StudentID || '',
                            name: student.FullName || '',
                            class: student.ClassName || '',
                            school: student.SchoolName || '',
                            dateOfBirth: student.DateOfBirth || '',
                            address: parent.Address || '',
                            phone: (parentUser && parentUser.Phone) ? parentUser.Phone : (parent && parent.Phone ? parent.Phone : ''),
                            pickupPoint: student.PickupPoint || '',
                            dropoffPoint: student.DropoffPoint || '',
                            parentName: parent.FullName || '',
                            parentPhone: (parentUser && parentUser.Phone) ? parentUser.Phone : (parent && parent.Phone ? parent.Phone : ''),
                        }));
                        setBusInfo(prev => ({
                            ...prev,
                            busNumber: bus ? `Xe ${bus.BusID}` : '',
                            plateNumber: bus ? bus.PlateNumber : '',
                            driverName: driver ? driver.FullName : '',
                            driverPhone: driver ? driver.Phone : '',
                            route: route ? route.RouteName : '',
                        }));
                        // Lưu RouteID để fetch route stops
                        if (route && route.RouteID) {
                            setRouteId(route.RouteID);
                        }
                    }
                });
        } else {
            window.location.href = '/login';
        }
    }, []);

    // Fetch route stops khi có routeId
    useEffect(() => {
        if (!routeId) return;
        fetch(`http://localhost/SmartSchoolBus-main/backend/public/api/route_stops.php?route_id=${routeId}`)
            .then(res => res.json())
            .then(res => {
                if (res.success && res.data) {
                    // Thêm RouteID vào mỗi stop để BusMap có thể nhóm được
                    const stopsWithRouteId = res.data.map(stop => ({
                        ...stop,
                        RouteID: routeId
                    }));
                    setRouteStops(stopsWithRouteId);
                }
            })
            .catch(err => console.error('Error fetching route stops:', err));
    }, [routeId]);

    useEffect(() => {
        if (activeTab === 'notifications') {
            loadNotifications();
        }
    }, [activeTab]);

    const loadNotifications = async () => {
        try {
            const res = await parentAPI.getMessages();
            if (res.success) {
                const formattedNotifications = res.data.map(msg => ({
                    id: msg.MessageID,
                    title: `Thông báo từ ${msg.FromName} (${msg.FromRole})`,
                    message: msg.Content,
                    time: new Date(msg.SentAt).toLocaleString(),
                    read: false // Default to unread as DB doesn't track it yet
                }));
                setNotifications(formattedNotifications);
            }
        } catch (error) {
            console.error("Failed to load notifications", error);
        }
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            'on-route': { variant: 'primary' },
            'delayed': { variant: 'warning' },
            'arrived': { variant: 'success' },
            'completed': { variant: 'secondary' },
            'today': { variant: 'info' },
            'upcoming': { variant: 'light' },
        };
        return statusMap[status] || { variant: 'secondary', text: status, icon: '•' };
    };

    const handleNotificationClick = (notification) => {
        setSelectedNotification(notification);
        setShowNotificationModal(true);
        // Đánh dấu đã đọc
        setNotifications(notifications.map(n =>
            n.id === notification.id ? { ...n, read: true } : n
        ));
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    const renderContent = () => {
        switch (activeTab) {
            case 'tracking':
                return (
                    <>
                        <div className="parent-header mb-4">
                            <h1 className="parent-title"> Theo dõi xe buýt</h1>
                            <p className="parent-subtitle">Vị trí thời gian thực của xe đưa đón</p>
                        </div>

                        {/* Trạng thái xe hiện tại */}
                        <Row className="mb-4">
                            <Col lg={12}>
                                <Card className="bus-tracking-card shadow-sm">
                                    <Card.Body>
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <div>
                                                <h4 className="mb-2"> {busInfo.busNumber} - {busInfo.plateNumber}</h4>
                                                <p className="text-muted mb-1">Tài xế: {busInfo.driverName} - {busInfo.driverPhone}</p>
                                                <p className="text-muted mb-0">Tuyến: {busInfo.route}</p>
                                            </div>
                                        </div>

                                        {/* Bus Map (Leaflet + OpenStreetMap) */}
                                        <BusMap
                                            busId={busInfo.busNumber ? busInfo.busNumber.replace('Xe ', '') : null}
                                            busInfo={busInfo}
                                            studentPickupLocation={null}
                                            routeStops={routeStops}
                                        />
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </>
                );

            case 'notifications':
                return (
                    <>
                        <div className="parent-header mb-4">
                            <h1 className="parent-title"> Thông báo & Cảnh báo</h1>
                            <p className="parent-subtitle">Nhận cập nhật về xe buýt và lịch trình của {studentName}</p>

                        </div>

                        <Row>
                            <Col lg={10}>
                                <Card className="shadow-sm">
                                    <Card.Body>
                                        <ListGroup variant="flush">
                                            {notifications.map((notif) => (
                                                <ListGroup.Item
                                                    key={notif.id}
                                                    className={`notification-item ${!notif.read ? 'unread' : ''}`}
                                                    onClick={() => handleNotificationClick(notif)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <div className="d-flex align-items-start">
                                                        <span style={{ fontSize: '2rem' }} className="me-3">{notif.icon}</span>
                                                        <div className="flex-grow-1">
                                                            <div className="d-flex justify-content-between align-items-start">
                                                                <div>
                                                                    <h6 className="mb-1">{notif.title}</h6>
                                                                    <p className="mb-1 text-muted">{notif.message}</p>
                                                                    <small className="text-muted">{notif.time}</small>
                                                                </div>

                                                            </div>
                                                        </div>
                                                    </div>
                                                </ListGroup.Item>
                                            ))}
                                        </ListGroup>
                                    </Card.Body>
                                </Card>
                            </Col>


                        </Row>
                    </>
                );



            case 'student':
                return (
                    <>
                        <div className="parent-header mb-4">
                            <h1 className="parent-title"> Thông tin </h1>
                            <p className="parent-subtitle">Thông tin chi tiết </p>
                        </div>

                        <Row>
                            <Col lg={10}>
                                <Card className="shadow-sm mb-4">
                                    <Card.Header className="bg-white text-dark">
                                        <h5 className="mb-0"> Thông tin học sinh</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row className="mb-3">
                                            <Col md={6}>
                                                <p className="mb-2">
                                                    <strong>Mã học sinh:</strong> {studentInfo.id || 'Chưa cập nhật'}
                                                </p>
                                                <p className="mb-2">
                                                    <strong>Họ và tên:</strong> {studentInfo.name || 'Chưa cập nhật'}
                                                </p>
                                                <p className="mb-2">
                                                    <strong>Ngày sinh:</strong> {studentInfo.dateOfBirth || 'Chưa cập nhật'}
                                                </p>
                                                <p className="mb-0">
                                                    <strong>Số điện thoại:</strong> {studentInfo.phone || 'Chưa cập nhật'}
                                                </p>
                                            </Col>
                                            <Col md={6}>
                                                <p className="mb-2">
                                                    <strong>Lớp:</strong> {studentInfo.class || 'Chưa cập nhật'}
                                                </p>
                                                <p className="mb-2">
                                                    <strong>Trường:</strong> {studentInfo.school || 'Chưa cập nhật'}
                                                </p>
                                                <p className="mb-0">
                                                    <strong>Địa chỉ:</strong> {studentInfo.address || 'Chưa cập nhật'}
                                                </p>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>

                                <Card className="shadow-sm mb-4">
                                    <Card.Header className="bg-white text-dark">
                                        <h5 className="mb-0"> Thông tin đưa đón</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row>
                                            <Col md={6}>
                                                <p className="mb-2">
                                                    <strong>Điểm đón:</strong> {studentInfo.pickupPoint || 'Chưa cập nhật'}
                                                </p>
                                                <p className="mb-0">
                                                    <strong>Tuyến xe:</strong> {busInfo.route || 'Chưa cập nhật'}
                                                </p>
                                            </Col>
                                            <Col md={6}>
                                                <p className="mb-2">
                                                    <strong>Điểm trả:</strong> {studentInfo.dropoffPoint || 'Chưa cập nhật'}
                                                </p>
                                                <p className="mb-0">
                                                    <strong>Xe buýt:</strong> {busInfo.busNumber || 'Chưa cập nhật'} {busInfo.plateNumber ? `(${busInfo.plateNumber})` : ''}
                                                </p>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>

                                <Card className="shadow-sm">
                                    <Card.Header className="bg-white text-dark">
                                        <h5 className="mb-0"> Thông tin phụ huynh</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row>
                                            <Col md={6}>
                                                <p className="mb-2">
                                                    <strong>Họ tên phụ huynh:</strong> {studentInfo.parentName || 'Chưa cập nhật'}
                                                </p>
                                                <p className="mb-0">
                                                    <strong>Số điện thoại:</strong> {studentInfo.parentPhone || 'Chưa cập nhật'}
                                                </p>
                                            </Col>
                                            <Col md={6}>
                                                <p className="mb-0">
                                                    <strong>Địa chỉ:</strong> {studentInfo.address || 'Chưa cập nhật'}
                                                </p>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>
                            </Col>


                        </Row>
                    </>
                );

            default:
                return null;
        }
    };

    if (!isAuthenticated) {
        return <div>Loading...</div>;
    }

    return (
        <>
            <Sidebar activeTab={activeTab} onTabChange={setActiveTab} userRole="parent" />
            <div className="parent-content">
                <Container fluid>
                    {renderContent()}
                </Container>
            </div>


        </>
    );
}
