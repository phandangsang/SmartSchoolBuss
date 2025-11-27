'use client'

import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Modal, Form } from 'react-bootstrap';
import Sidebar from '../components/sidebar';
import BusMap from '../components/BusMap';
import { adminAPI, assignmentAPI, routeStopsAPI } from '../utils/api';
import '../styles/admin.css';

export default function AdminPage() {
    // Authentication state
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [activeTab, setActiveTab] = useState('students');
    const [loading, setLoading] = useState(false);

    // Data states - will be loaded from backend
    const [students, setStudents] = useState([]);
    const [parents, setParents] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [buses, setBuses] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [routeStops, setRouteStops] = useState([]);
    const [selectedRouteId, setSelectedRouteId] = useState(null);

    // Sample data for schedules
    const [schedules, setSchedules] = useState([]);
    // Load schedules (trips) from backend
    const loadSchedules = async () => {
        try {
            const response = await adminAPI.getTrips();
            if (response.success) {
                setSchedules(response.data);
            }
        } catch (error) {
            console.error('Failed to load schedules:', error);
        }
    };


    // Modal states
    const [showStudentModal, setShowStudentModal] = useState(false);
    const [showParentModal, setShowParentModal] = useState(false);
    const [showDriverModal, setShowDriverModal] = useState(false);
    const [showBusModal, setShowBusModal] = useState(false);
    const [showRouteModal, setShowRouteModal] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);

    // Form data states
    const [studentForm, setStudentForm] = useState({ StudentID: '', FullName: '', ClassName: '', SchoolName: '', ParentID: '', RouteID: '', PickupStopID: '', DropoffStopID: '' });
    const [parentForm, setParentForm] = useState({ ParentID: '', FullName: '', Phone: '', Email: '', Address: '', UserID: '', Username: '', Password: '' });
    const [driverForm, setDriverForm] = useState({ DriverID: '', FullName: '', Phone: '', LicenseNumber: 'B2', Status: 'active', UserID: '', Username: '', Password: '' });
    const [busForm, setBusForm] = useState({ BusID: '', PlateNumber: '', Capacity: '', Status: 'running' });
    const [routeForm, setRouteForm] = useState({ RouteID: '', RouteName: '', Description: '', StartPointName: '', StartLatitude: '', StartLongitude: '', EndPointName: '', EndLatitude: '', EndLongitude: '' });
    const [scheduleForm, setScheduleForm] = useState({
        TripID: '',
        AssignmentID: '',
        StartTime: '',
        EndTime: '',
        Status: 'scheduled'
    });

    // Edit mode states
    const [editingStudent, setEditingStudent] = useState(null);
    const [editingParent, setEditingParent] = useState(null);
    const [editingDriver, setEditingDriver] = useState(null);
    const [editingBus, setEditingBus] = useState(null);
    const [editingRoute, setEditingRoute] = useState(null);
    const [editingSchedule, setEditingSchedule] = useState(null);

    // Message state
    const [messages, setMessages] = useState([]);
    const [messageForm, setMessageForm] = useState({ ToUserID: '', Content: '', MessageType: 'TEXT' });

    // Available stops for selected route (for student form)
    const [availableStops, setAvailableStops] = useState([]);

    // Kiểm tra đăng nhập và load data
    useEffect(() => {
        const userRole = localStorage.getItem('userRole');
        if ((userRole || '').toLowerCase() === 'admin') {
            setIsAuthenticated(true);
            loadStudents();
            loadParents();
            loadDrivers();
            loadBuses();
            loadRoutesAndAssignments();
            loadSchedules();
        } else {
            window.location.href = '/login';
        }
    }, []);

    // Fetch route stops when RouteID changes in student form
    useEffect(() => {
        if (!studentForm.RouteID) {
            setAvailableStops([]);
            return;
        }

        fetch(`http://localhost/SmartSchoolBus-main/backend/public/api/route_stops.php?route_id=${studentForm.RouteID}`)
            .then(res => res.json())
            .then(res => {
                if (res.success && res.data) {
                    // Filter out 'start' and 'end' pseudo stops, only keep real stops with numeric StopID
                    const realStops = res.data.filter(stop =>
                        stop.StopID !== 'start' &&
                        stop.StopID !== 'end' &&
                        typeof stop.StopID === 'number'
                    );
                    setAvailableStops(realStops);
                }
            })
            .catch(err => console.error('Error fetching route stops:', err));
    }, [studentForm.RouteID]);


    useEffect(() => {
        if (activeTab === 'contact') {
            loadMessages();
        }
        // Không auto-load routeStops khi vào tab tracking
        // User phải chọn tuyến từ dropdown
    }, [activeTab]);

    // Load route stops theo tuyến được chọn
    const loadAllRouteStops = async (routeId = null) => {
        try {
            // Clear state trước khi load
            setRouteStops([]);

            console.log('Loading stops for route:', routeId);
            let response;
            if (routeId) {
                response = await routeStopsAPI.getStopsByRoute(routeId);
            } else {
                response = await routeStopsAPI.getAllStops();
            }
            console.log('Route stops response:', response);
            if (response.success) {
                setRouteStops(response.data);
                console.log('Loaded stops:', response.data);
            }
        } catch (error) {
            console.error('Failed to load route stops:', error);
        }
    };

    // Handler khi chọn tuyến
    const handleRouteSelect = (routeId) => {
        const parsedRouteId = routeId ? parseInt(routeId) : null;
        console.log('Selected Route ID:', parsedRouteId);
        setSelectedRouteId(parsedRouteId);
        if (parsedRouteId) {
            loadAllRouteStops(parsedRouteId);
        } else {
            loadAllRouteStops();
        }
    };

    // Load routes và assignments, sau đó map assignment vào routes
    const loadRoutesAndAssignments = async () => {
        try {
            const [routesRes, assignmentsRes] = await Promise.all([
                adminAPI.getRoutes(),
                assignmentAPI.getAssignments()
            ]);
            if (routesRes.success && assignmentsRes.success) {
                setAssignments(assignmentsRes.data);
                // Map assignment vào routes
                const routesWithAssign = routesRes.data.map(route => {
                    const found = assignmentsRes.data.find(a => a.RouteID == route.RouteID);
                    return {
                        ...route,
                        assignedBus: found ? found.BusID : '',
                        assignedDriver: found ? found.DriverID : '',
                        assignmentId: found ? found.AssignmentID : null
                    };
                });
                setRoutes(routesWithAssign);
            }
        } catch (err) {
            console.error('Failed to load routes/assignments:', err);
        }
    };

    // Load students from backend
    const loadStudents = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getStudents();
            if (response.success) {
                // Transform data from backend to match frontend format
                setStudents(response.data);
            }
        } catch (error) {
            console.error('Failed to load students:', error);
        } finally {
            setLoading(false);
        }
    };

    // Load drivers from backend
    const loadDrivers = async () => {
        try {
            const response = await adminAPI.getDrivers();
            if (response.success) {
                setDrivers(response.data);
            }
        } catch (error) {
            console.error('Failed to load drivers:', error);
        }
    };

    // Load parents from backend
    const loadParents = async () => {
        try {
            const response = await adminAPI.getParents();
            if (response.success) {
                setParents(response.data);
            }
        } catch (error) {
            console.error('Failed to load parents:', error);
        }
    };

    // Load buses from backend
    const loadBuses = async () => {
        try {
            const response = await adminAPI.getBuses();
            if (response.success) {
                setBuses(response.data);
            }
        } catch (error) {
            console.error('Failed to load buses:', error);
        }
    };

    // Load routes from backend
    const loadRoutes = async () => {
        try {
            const response = await adminAPI.getRoutes();
            if (response.success) {
                setRoutes(response.data);
            }
        } catch (error) {
            console.error('Failed to load routes:', error);
        }
    };

    // Load messages
    const loadMessages = async () => {
        try {
            const response = await adminAPI.getMessages();
            if (response.success) {
                setMessages(response.data);
            }
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    };

    const handleSendMessage = async () => {
        if (messageForm.ToUserID && messageForm.Content) {
            try {
                setLoading(true);
                await adminAPI.sendMessage(messageForm);
                setMessageForm({ ...messageForm, Content: '' }); // Clear content but keep recipient
                await loadMessages();
                alert('Gửi tin nhắn thành công!');
            } catch (error) {
                console.error('Failed to send message:', error);
                alert('Lỗi gửi tin nhắn');
            } finally {
                setLoading(false);
            }
        } else {
            alert('Vui lòng chọn người nhận và nhập nội dung');
        }
    };


    // Add handlers
    const handleAddStudent = async () => {
        if (studentForm.FullName && studentForm.ClassName) {
            try {
                setLoading(true);
                if (!studentForm.ParentID) {
                    alert('Vui lòng chọn phụ huynh cho học sinh');
                    setLoading(false);
                    return;
                }
                if (editingStudent) {
                    //  existing student
                    const updateData = {
                        FullName: studentForm.FullName,
                        ClassName: studentForm.ClassName,
                        SchoolName: studentForm.SchoolName,
                        ParentID: parseInt(studentForm.ParentID),
                        RouteID: studentForm.RouteID,
                        PickupStopID: studentForm.PickupStopID || null,
                        DropoffStopID: studentForm.DropoffStopID || null
                    };
                    await adminAPI.updateStudent(editingStudent.StudentID, updateData);
                    setEditingStudent(null);
                } else {
                    // Add new student
                    const newStudentData = {
                        FullName: studentForm.FullName,
                        ClassName: studentForm.ClassName,
                        SchoolName: studentForm.SchoolName,
                        ParentID: parseInt(studentForm.ParentID),
                        RouteID: studentForm.RouteID,
                        PickupStopID: studentForm.PickupStopID || null,
                        DropoffStopID: studentForm.DropoffStopID || null
                    };
                    await adminAPI.createStudent(newStudentData);
                }
                await loadStudents(); // Reload students from backend
                setStudentForm({ StudentID: '', FullName: '', ClassName: '', SchoolName: '', ParentID: '', RouteID: '', PickupStopID: '', DropoffStopID: '' });
                setShowStudentModal(false);
            } catch (error) {
                console.error('Failed to save student:', error);
                const errorMessage = error.response?.data?.message || error.message || 'Không thể lưu học sinh';
                alert('Lỗi: ' + errorMessage);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleEditStudent = (student) => {
        setEditingStudent(student);
        setStudentForm({
            StudentID: student.StudentID,
            FullName: student.FullName,
            ClassName: student.ClassName,
            SchoolName: student.SchoolName,
            ParentID: student.ParentID,
            RouteID: student.RouteID || '',
            PickupStopID: student.PickupStopID || '',
            DropoffStopID: student.DropoffStopID || ''
        });
        setShowStudentModal(true);
    };

    const handleDeleteStudent = async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa học sinh này?')) {
            try {
                setLoading(true);
                await adminAPI.deleteStudent(id);
                await loadStudents(); // Reload students from backend
            } catch (error) {
                console.error('Failed to delete student:', error);
                alert('Lỗi: ' + (error.message || 'Không thể xóa học sinh'));
            } finally {
                setLoading(false);
            }
        }
    };

    const handleAddDriver = async () => {
        if (driverForm.FullName && driverForm.Phone) {
            try {
                setLoading(true);
                if (editingDriver) {
                    const updateData = {
                        FullName: driverForm.FullName,
                        Phone: driverForm.Phone,
                        LicenseNumber: driverForm.LicenseNumber,
                        Status: driverForm.Status?.toUpperCase() || 'ACTIVE',
                        UserID: driverForm.UserID
                    };
                    if (driverForm.Password) {
                        updateData.Password = driverForm.Password;
                    }
                    await adminAPI.updateDriver(editingDriver.DriverID, updateData);
                    setEditingDriver(null);
                } else {
                    if (!driverForm.Username || !driverForm.Password) {
                        alert('Vui lòng nhập tên đăng nhập và mật khẩu');
                        setLoading(false);
                        return;
                    }
                    // Đảm bảo truyền đúng trường cho backend
                    const newDriverData = {
                        FullName: driverForm.FullName,
                        Phone: driverForm.Phone,
                        LicenseNumber: driverForm.LicenseNumber,
                        Status: driverForm.Status?.toUpperCase() || 'ACTIVE',
                        Username: driverForm.Username,
                        Password: driverForm.Password,
                        UserID: driverForm.UserID
                    };
                    await adminAPI.createDriver(newDriverData);
                }
                await loadDrivers();
                setDriverForm({ DriverID: '', FullName: '', Phone: '', LicenseNumber: 'B2', Status: 'active', UserID: '', Username: '', Password: '' });
                setShowDriverModal(false);
            } catch (error) {
                console.error('Failed to save driver:', error);
                const errorMessage = error.response?.data?.message || error.message || 'Không thể lưu tài xế';
                alert('Lỗi: ' + errorMessage);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleEditDriver = (driver) => {
        setEditingDriver(driver);
        setDriverForm({
            ...driver,
            Username: driver.Username || '',
            Password: ''
        });
        setShowDriverModal(true);
    };

    const handleDeleteDriver = async (DriverID) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa tài xế này?')) {
            try {
                setLoading(true);
                await adminAPI.deleteDriver(DriverID);
                await loadDrivers();
            } catch (error) {
                console.error('Failed to delete driver:', error);
                alert('Lỗi: ' + (error.message || 'Không thể xóa tài xế'));
            } finally {
                setLoading(false);
            }
        }
    };

    // Parent handlers
    const handleAddParent = async () => {
        if (parentForm.FullName && parentForm.Phone) {
            try {
                setLoading(true);
                if (editingParent) {
                    const updateData = {
                        FullName: parentForm.FullName,
                        Phone: parentForm.Phone,
                        Email: parentForm.Email,
                        Address: parentForm.Address,
                        UserID: parentForm.UserID
                    };
                    if (parentForm.Password) {
                        updateData.Password = parentForm.Password;
                    }
                    await adminAPI.updateParent(editingParent.ParentID, updateData);
                    setEditingParent(null);
                } else {
                    if (!parentForm.Username || !parentForm.Password) {
                        alert('Vui lòng nhập tên đăng nhập và mật khẩu');
                        setLoading(false);
                        return;
                    }
                    const newParentData = {
                        Username: parentForm.Username,
                        Password: parentForm.Password,
                        FullName: parentForm.FullName,
                        Phone: parentForm.Phone,
                        Email: parentForm.Email,
                        Address: parentForm.Address,
                        UserID: parentForm.UserID
                    };
                    await adminAPI.createParent(newParentData);
                }
                await loadParents();
                setParentForm({ ParentID: '', FullName: '', Phone: '', Email: '', Address: '', UserID: '', Username: '', Password: '' });
                setShowParentModal(false);
            } catch (error) {
                console.error('Failed to save parent:', error);
                const errorMessage = error.response?.data?.message || error.message || 'Không thể lưu phụ huynh';
                alert('Lỗi: ' + errorMessage);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleEditParent = (parent) => {
        setEditingParent(parent);
        setParentForm({
            ...parent,
            Username: parent.Username || '',
            Password: ''
        });
        setShowParentModal(true);
    };

    const handleDeleteParent = async (ParentID) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa phụ huynh này?')) {
            try {
                setLoading(true);
                await adminAPI.deleteParent(ParentID);
                await loadParents();
            } catch (error) {
                console.error('Failed to delete parent:', error);
                alert('Lỗi: ' + (error.message || 'Không thể xóa phụ huynh'));
            } finally {
                setLoading(false);
            }
        }
    };

    const handleAddBus = async () => {
        if (busForm.PlateNumber && busForm.Capacity) {
            try {
                setLoading(true);
                if (editingBus) {
                    const updateData = {
                        PlateNumber: busForm.PlateNumber,
                        Capacity: parseInt(busForm.Capacity),
                        Status: busForm.Status
                    };
                    await adminAPI.updateBus(editingBus.BusID, updateData);
                    setEditingBus(null);
                } else {
                    const newBusData = {
                        PlateNumber: busForm.PlateNumber,
                        Capacity: parseInt(busForm.Capacity),
                        Status: busForm.Status
                    };
                    await adminAPI.createBus(newBusData);
                }
                await loadBuses();
                setBusForm({ BusID: '', PlateNumber: '', Capacity: '', Status: 'running' });
                setShowBusModal(false);
            } catch (error) {
                console.error('Failed to save bus:', error);
                alert('Lỗi: ' + (error.message || 'Không thể lưu xe buýt'));
            } finally {
                setLoading(false);
            }
        }
    };

    const handleEditBus = (bus) => {
        setEditingBus(bus);
        setBusForm(bus);
        setShowBusModal(true);
    };

    const handleDeleteBus = async (BusID) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa xe buýt này?')) {
            try {
                setLoading(true);
                await adminAPI.deleteBus(BusID);
                await loadBuses();
            } catch (error) {
                console.error('Failed to delete bus:', error);
                alert('Lỗi: ' + (error.message || 'Không thể xóa xe buýt'));
            } finally {
                setLoading(false);
            }
        }
    };

    const handleAddRoute = async () => {
        if (routeForm.RouteName) {
            try {
                setLoading(true);
                if (editingRoute) {
                    const updateData = {
                        RouteName: routeForm.RouteName,
                        Description: routeForm.Description,
                        Status: routeForm.Status
                    };
                    await adminAPI.updateRoute(editingRoute.RouteID, updateData);
                    setEditingRoute(null);
                } else {
                    const newRouteData = {
                        RouteName: routeForm.RouteName,
                        Description: routeForm.Description,
                        Status: routeForm.Status
                    };
                    await adminAPI.createRoute(newRouteData);
                }
                await loadRoutes();
                setRouteForm({ RouteID: '', RouteName: '', Description: '', Status: 'scheduled' });
                setShowRouteModal(false);
            } catch (error) {
                console.error('Failed to save route:', error);
                alert('Lỗi: ' + (error.message || 'Không thể lưu tuyến đường'));
            } finally {
                setLoading(false);
            }
        }
    };

    const handleEditRoute = (route) => {
        setEditingRoute(route);
        setRouteForm(route);
        setShowRouteModal(true);
    };

    const handleDeleteRoute = async (RouteID) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa tuyến đường này?')) {
            try {
                setLoading(true);
                await adminAPI.deleteRoute(RouteID);
                await loadRoutes();
            } catch (error) {
                console.error('Failed to delete route:', error);
                alert('Lỗi: ' + (error.message || 'Không thể xóa tuyến đường'));
            } finally {
                setLoading(false);
            }
        }
    };

    const handleAddSchedule = async () => {
        if (scheduleForm.AssignmentID && scheduleForm.StartTime) {
            try {
                setLoading(true);
                const payload = {
                    AssignmentID: scheduleForm.AssignmentID,
                    StartTime: scheduleForm.StartTime,
                    EndTime: scheduleForm.EndTime,
                    Status: scheduleForm.Status
                };
                if (editingSchedule) {
                    await adminAPI.updateTrip(editingSchedule.TripID, payload);
                    setEditingSchedule(null);
                } else {
                    await adminAPI.createTrip(payload);
                }
                await loadSchedules();
                setScheduleForm({ TripID: '', AssignmentID: '', StartTime: '', EndTime: '', Status: 'scheduled' });
                setShowScheduleModal(false);
            } catch (error) {
                alert('Lỗi lưu lịch trình!');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleEditSchedule = (schedule) => {
        setEditingSchedule(schedule);
        setScheduleForm(schedule);
        setShowScheduleModal(true);
    };

    const handleDeleteSchedule = (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa lịch trình này?')) {
            setSchedules(schedules.filter(s => s.TripID !== id));
        }
    };

    // Assignment handlers
    // Lưu phân công khi chọn xe buýt
    const handleAssignBusToRoute = async (routeId, busId) => {
        const route = routes.find(r => r.RouteID === routeId);
        const driverId = route.assignedDriver || '';
        try {
            let assignmentId = route.assignmentId;
            if (busId && driverId) {
                if (assignmentId) {
                    await assignmentAPI.updateAssignment(assignmentId, { RouteID: routeId, BusID: busId, DriverID: driverId });
                } else {
                    await assignmentAPI.createAssignment({ RouteID: routeId, BusID: busId, DriverID: driverId });
                }
                await loadRoutesAndAssignments();
            } else {
                // Chỉ cập nhật state tạm thời
                setRoutes(routes.map(r => r.RouteID === routeId ? { ...r, assignedBus: busId } : r));
            }
        } catch (err) {
            alert('Lỗi lưu phân công xe buýt!');
        }
    };

    const handleAssignDriverToRoute = async (routeId, driverId) => {
        const route = routes.find(r => r.RouteID === routeId);
        const busId = route.assignedBus || '';
        try {
            let assignmentId = route.assignmentId;
            if (busId && driverId) {
                if (assignmentId) {
                    await assignmentAPI.updateAssignment(assignmentId, { RouteID: routeId, BusID: busId, DriverID: driverId });
                } else {
                    await assignmentAPI.createAssignment({ RouteID: routeId, BusID: busId, DriverID: driverId });
                }
                await loadRoutesAndAssignments();
            } else {
                setRoutes(routes.map(r => r.RouteID === routeId ? { ...r, assignedDriver: driverId } : r));
            }
        } catch (err) {
            alert('Lỗi lưu phân công tài xế!');
        }
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            active: { variant: 'success', text: 'Hoạt động' },
            inactive: { variant: 'secondary', text: 'Không hoạt động' },
            running: { variant: 'success', text: 'Đang chạy' },
            stopped: { variant: 'warning', text: 'Dừng' },
            maintenance: { variant: 'danger', text: 'Bảo trì' },
            off: { variant: 'secondary', text: 'Nghỉ' },
            completed: { variant: 'success', text: 'Hoàn thành' },
            scheduled: { variant: 'info', text: 'Đã lên lịch' },
        };
        return statusMap[status] || { variant: 'secondary', text: status };
    };

    const renderContent = () => {
        switch (activeTab) {

            case 'students':
                return (
                    <>
                        <div className="admin-header mb-4">
                            <h1 className="admin-title">Quản lý học sinh</h1>
                            <p className="admin-subtitle">Danh sách học sinh trong hệ thống</p>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="mb-0"> Danh sách học sinh</h5>
                            <Button variant="primary" size="sm" onClick={() => setShowStudentModal(true)}>+ Thêm học sinh</Button>
                        </div>
                        <Card>
                            <Card.Body>
                                <Table hover className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Mã HS</th>
                                            <th>Họ tên</th>
                                            <th>Lớp</th>
                                            <th>Tuyến xe</th>
                                            <th>Điểm đón</th>
                                            <th>Điểm trả</th>
                                            <th>Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map((student) => (
                                            <tr key={student.StudentID}>
                                                <td>{student.StudentID}</td>
                                                <td>{student.FullName}</td>
                                                <td>{student.ClassName}</td>
                                                <td>{student.RouteName || <span className="text-muted">Chưa gán</span>}</td>
                                                <td>{student.PickupStopName || <span className="text-muted">Chưa gán</span>}</td>
                                                <td>{student.DropoffStopName || <span className="text-muted">Chưa gán</span>}</td>
                                                <td>
                                                    <Button variant="link" size="sm" className="p-0 me-2 text-primary" onClick={() => handleEditStudent(student)}>
                                                        Sửa
                                                    </Button>
                                                    <Button variant="link" size="sm" className="p-0 text-danger" onClick={() => handleDeleteStudent(student.StudentID)}>
                                                        Xóa
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    </>
                );

            case 'parents':
                return (
                    <>
                        <div className="admin-header mb-4">
                            <h1 className="admin-title">Quản lý phụ huynh</h1>
                            <p className="admin-subtitle">Danh sách phụ huynh trong hệ thống</p>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="mb-0">Danh sách phụ huynh</h5>
                            <Button variant="primary" size="sm" onClick={() => setShowParentModal(true)}>+ Thêm phụ huynh</Button>
                        </div>
                        <Card>
                            <Card.Body>
                                <Table hover className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Mã PH</th>
                                            <th>Họ tên</th>
                                            <th>SĐT</th>
                                            <th>Email</th>
                                            <th>Địa chỉ</th>
                                            <th>Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {parents.map((parent) => (
                                            <tr key={parent.ParentID}>
                                                <td>{parent.ParentID}</td>
                                                <td>{parent.FullName}</td>
                                                <td>{parent.Phone}</td>
                                                <td>{parent.Email}</td>
                                                <td>{parent.Address}</td>
                                                <td>
                                                    <Button variant="link" size="sm" className="p-0 me-2 text-primary" onClick={() => handleEditParent(parent)}>
                                                        Sửa
                                                    </Button>
                                                    <Button variant="link" size="sm" className="p-0 text-danger" onClick={() => handleDeleteParent(parent.ParentID)}>
                                                        Xóa
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    </>
                );

            case 'drivers':
                return (
                    <>
                        <div className="admin-header mb-4">
                            <h1 className="admin-title">Quản lý tài xế</h1>
                            <p className="admin-subtitle">Danh sách tài xế trong hệ thống</p>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="mb-0"> Danh sách tài xế</h5>
                            <Button variant="primary" size="sm" onClick={() => setShowDriverModal(true)}>+ Thêm tài xế</Button>
                        </div>
                        <Card>
                            <Card.Body>
                                <Table hover className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Mã TX</th>
                                            <th>Họ tên</th>
                                            <th>SĐT</th>
                                            <th>Bằng lái</th>
                                            <th>Trạng thái</th>
                                            <th>Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {drivers.map((driver) => (
                                            <tr key={driver.DriverID}>
                                                <td>{driver.DriverID}</td>
                                                <td>{driver.FullName}</td>
                                                <td>{driver.Phone}</td>
                                                <td>{driver.LicenseNumber}</td>
                                                <td>
                                                    <Badge bg={getStatusBadge(driver.Status?.toLowerCase()).variant}>
                                                        {getStatusBadge(driver.Status?.toLowerCase()).text}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <Button variant="link" size="sm" className="p-0 me-2 text-primary" onClick={() => handleEditDriver(driver)}>
                                                        Sửa
                                                    </Button>
                                                    <Button variant="link" size="sm" className="p-0 text-danger" onClick={() => handleDeleteDriver(driver.DriverID)}>
                                                        Xóa
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    </>
                );

            case 'buses':
                return (
                    <>
                        <div className="admin-header mb-4">
                            <h1 className="admin-title">Quản lý xe buýt</h1>
                            <p className="admin-subtitle">Danh sách xe buýt và trạng thái hoạt động</p>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="mb-0"> Danh sách xe buýt</h5>
                            <Button variant="primary" size="sm" onClick={() => setShowBusModal(true)}>+ Thêm xe mới</Button>
                        </div>
                        <Card>
                            <Card.Body>
                                <Table hover className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Mã xe</th>
                                            <th>Biển số</th>
                                            <th>Số ghế</th>
                                            <th>Trạng thái</th>
                                            <th>Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {buses.map((bus) => (
                                            <tr key={bus.BusID}>
                                                <td>{bus.BusID}</td>
                                                <td><strong>{bus.PlateNumber}</strong></td>
                                                <td>{bus.Capacity}</td>
                                                <td>
                                                    <Badge bg={getStatusBadge(bus.Status?.toLowerCase()).variant}>
                                                        {getStatusBadge(bus.Status?.toLowerCase()).text}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <Button variant="link" size="sm" className="p-0 me-2 text-primary" onClick={() => handleEditBus(bus)}>
                                                        Sửa
                                                    </Button>
                                                    <Button variant="link" size="sm" className="p-0 text-danger" onClick={() => handleDeleteBus(bus.BusID)}>
                                                        Xóa
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    </>
                );

            case 'routes':
                return (
                    <>
                        <div className="admin-header mb-4">
                            <h1 className="admin-title">Quản lý tuyến đường</h1>
                            <p className="admin-subtitle">Danh sách các tuyến đường xe buýt</p>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="mb-0"> Tuyến đường</h5>
                            <Button variant="primary" size="sm" onClick={() => setShowRouteModal(true)}>+ Thêm tuyến</Button>
                        </div>
                        <Card>
                            <Card.Body>
                                <Table hover className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Mã tuyến</th>
                                            <th>Tên tuyến</th>
                                            <th>Khoảng cách</th>
                                            <th>Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {routes.map((route) => (
                                            <tr key={route.RouteID}>
                                                <td><strong>{route.RouteID}</strong></td>
                                                <td>{route.RouteName}</td>
                                                <td>{route.Description}</td>
                                                <td>
                                                    <Button variant="link" size="sm" className="p-0 me-2 text-primary" onClick={() => handleEditRoute(route)}>
                                                        Sửa
                                                    </Button>
                                                    <Button variant="link" size="sm" className="p-0 text-danger" onClick={() => handleDeleteRoute(route.RouteID)}>
                                                        Xóa
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    </>
                );

            case 'assignments':
                return (
                    <>
                        <div className="admin-header mb-4">
                            <h1 className="admin-title">Phân công tài xế và xe buýt</h1>
                            <p className="admin-subtitle">Phân công xe buýt và tài xế cho từng tuyến đường</p>
                        </div>
                        <Card>
                            <Card.Body>
                                <Table hover className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Mã tuyến</th>
                                            <th>Tuyến đường</th>
                                            <th>Khoảng cách</th>
                                            <th>Xe được phân công</th>
                                            <th>Tài xế được phân công</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {routes.map((route) => {
                                            // Sử dụng đúng trường RouteID, RouteName, Description
                                            const assignedBusInfo = buses.find(b => b.BusID === route.assignedBus);
                                            const assignedDriverInfo = drivers.find(d => d.DriverID === route.assignedDriver);
                                            return (
                                                <tr key={route.RouteID}>
                                                    <td><strong>{route.RouteID}</strong></td>
                                                    <td>{route.RouteName}</td>
                                                    <td>{route.Description}</td>
                                                    <td>
                                                        <Form.Select
                                                            size="sm"
                                                            value={route.assignedBus || ''}
                                                            onChange={(e) => handleAssignBusToRoute(route.RouteID, e.target.value)}
                                                            style={{ minWidth: '200px' }}
                                                        >
                                                            <option value="">-- Chọn xe buýt --</option>
                                                            {(() => {
                                                                const runningBuses = buses.filter(b => (b.Status || '').toLowerCase() === 'running');
                                                                const list = runningBuses.length > 0 ? runningBuses : buses;
                                                                if (list.length === 0) return <option disabled>Không có xe buýt</option>;
                                                                return list.map((bus) => (
                                                                    <option key={bus.BusID} value={bus.BusID}>
                                                                        {bus.PlateNumber} ({bus.Capacity} chỗ)
                                                                    </option>
                                                                ));
                                                            })()}
                                                        </Form.Select>
                                                        {assignedBusInfo && (
                                                            <div className="mt-1">
                                                                <Badge bg="success">✓ {assignedBusInfo.PlateNumber}</Badge>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <Form.Select
                                                            size="sm"
                                                            value={route.assignedDriver || ''}
                                                            onChange={(e) => handleAssignDriverToRoute(route.RouteID, e.target.value)}
                                                            style={{ minWidth: '200px' }}
                                                        >
                                                            <option value="">-- Chọn tài xế --</option>
                                                            {(() => {
                                                                const activeDrivers = drivers.filter(d => (d.Status || '').toLowerCase() === 'active');
                                                                const list = activeDrivers.length > 0 ? activeDrivers : drivers;
                                                                if (list.length === 0) return <option disabled>Không có tài xế</option>;
                                                                return list.map((driver) => (
                                                                    <option key={driver.DriverID} value={driver.DriverID}>
                                                                        {driver.FullName} - {driver.Phone}
                                                                    </option>
                                                                ));
                                                            })()}
                                                        </Form.Select>
                                                        {assignedDriverInfo && (
                                                            <div className="mt-1">
                                                                <Badge bg="success">✓ {assignedDriverInfo.FullName}</Badge>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    </>
                );

            case 'schedule':
                return (
                    <>
                        <div className="admin-header mb-4">
                            <h1 className="admin-title">Lịch trình</h1>
                            <p className="admin-subtitle">Quản lý lịch trình xe buýt</p>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="mb-0"> Lịch trình tuần/tháng</h5>
                            <Button variant="primary" size="sm" onClick={() => setShowScheduleModal(true)}>+ Tạo lịch trình mới</Button>
                        </div>
                        <Card>
                            <Card.Body>
                                <Table hover className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Tuyến đường</th>
                                            <th>Xe buýt</th>
                                            <th>Tài xế</th>
                                            <th>Giờ xuất phát</th>
                                            <th>Giờ đến dự kiến</th>
                                            <th>Trạng thái</th>
                                            <th>Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {schedules.map((schedule) => (
                                            <tr key={schedule.TripID}>
                                                <td>#{schedule.TripID}</td>
                                                <td>{schedule.RouteName || schedule.RouteID}</td>
                                                <td>{schedule.PlateNumber || schedule.BusID}</td>
                                                <td>{schedule.DriverName || schedule.DriverID}</td>
                                                <td>{schedule.StartTime}</td>
                                                <td>{schedule.EndTime}</td>
                                                <td>
                                                    <Badge bg={getStatusBadge(schedule.Status).variant}>
                                                        {getStatusBadge(schedule.Status).text}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <Button variant="link" size="sm" className="p-0 me-2" onClick={() => handleEditSchedule(schedule)}>Sửa</Button>
                                                    <Button variant="link" size="sm" className="p-0 text-danger" onClick={() => handleDeleteSchedule(schedule.TripID)}>Xóa</Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    </>
                );

            case 'contact':
                return (
                    <>
                        <div className="admin-header mb-4">
                            <h1 className="admin-title">Liên hệ</h1>
                            <p className="admin-subtitle">Gửi tin nhắn cho tài xế và phụ huynh</p>
                        </div>
                        <Row>
                            <Col md={4}>
                                <Card className="mb-4">
                                    <Card.Header>Gửi tin nhắn mới</Card.Header>
                                    <Card.Body>
                                        <Form>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Người nhận</Form.Label>
                                                <Form.Select
                                                    value={messageForm.ToUserID}
                                                    onChange={(e) => setMessageForm({ ...messageForm, ToUserID: e.target.value })}
                                                >
                                                    <option value="">-- Chọn người nhận --</option>
                                                    <optgroup label="Tài xế">
                                                        {drivers.map(d => (
                                                            <option key={`d-${d.UserID}`} value={d.UserID}>{d.FullName} (Tài xế)</option>
                                                        ))}
                                                    </optgroup>
                                                    <optgroup label="Phụ huynh">
                                                        {parents.map(p => (
                                                            <option key={`p-${p.UserID}`} value={p.UserID}>{p.FullName} (Phụ huynh)</option>
                                                        ))}
                                                    </optgroup>
                                                </Form.Select>
                                            </Form.Group>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Nội dung</Form.Label>
                                                <Form.Control
                                                    as="textarea"
                                                    rows={4}
                                                    value={messageForm.Content}
                                                    onChange={(e) => setMessageForm({ ...messageForm, Content: e.target.value })}
                                                />
                                            </Form.Group>
                                            <Button variant="primary" onClick={handleSendMessage} disabled={loading}>
                                                {loading ? 'Đang gửi...' : 'Gửi tin nhắn'}
                                            </Button>
                                        </Form>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={8}>
                                <Card>
                                    <Card.Header>Lịch sử tin nhắn</Card.Header>
                                    <Card.Body style={{ maxHeight: '600px', overflowY: 'auto' }}>
                                        {messages.length === 0 ? (
                                            <p className="text-center text-muted my-4">Chưa có tin nhắn nào</p>
                                        ) : (
                                            <div className="message-list">
                                                {messages.map(msg => (
                                                    <div key={msg.MessageID} className="border-bottom p-3">
                                                        <div className="d-flex justify-content-between">
                                                            <strong>{msg.FromName} <span className="text-muted" style={{ fontSize: '0.8em' }}>({msg.FromRole})</span> -&gt; {msg.ToName} <span className="text-muted" style={{ fontSize: '0.8em' }}>({msg.ToRole})</span></strong>
                                                            <small className="text-muted">{new Date(msg.SentAt).toLocaleString()}</small>
                                                        </div>
                                                        <p className="mb-0 mt-2">{msg.Content}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </>
                );


            case 'tracking':
                return (
                    <>
                        <div className="admin-header mb-4">
                            <h1 className="admin-title">Theo dõi</h1>
                            <p className="admin-subtitle">Vị trí xe buýt và tuyến đường</p>
                        </div>

                        {/* Dropdown chọn tuyến */}
                        <Card className="mb-3">
                            <Card.Body>
                                <Row>
                                    <Col md={4}>
                                        <Form.Group>
                                            <Form.Label><strong>Chọn tuyến đường:</strong></Form.Label>
                                            <Form.Select
                                                value={selectedRouteId || ''}
                                                onChange={(e) => handleRouteSelect(e.target.value || null)}
                                            >
                                                <option value="">-- Tất cả tuyến --</option>
                                                {routes.map(route => (
                                                    <option key={route.RouteID} value={route.RouteID}>
                                                        {route.RouteName}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={8} className="d-flex align-items-end">
                                        <div className="text-muted">
                                            {selectedRouteId ? (
                                                <span>Hiển thị {routeStops.length} điểm dừng của tuyến được chọn</span>
                                            ) : (
                                                <span>Hiển thị tất cả {routeStops.length} điểm dừng</span>
                                            )}
                                        </div>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        <Card>
                            <Card.Body>
                                <BusMap
                                    key={selectedRouteId || 'all-routes'}
                                    busId={selectedRouteId ? (routes.find(r => r.RouteID === selectedRouteId)?.assignedBus || null) : null}
                                    busInfo={null}
                                    routeStops={routeStops}
                                />
                            </Card.Body>
                        </Card>

                        { }
                    </>
                );

            default:
                return null;
        }
    };

    return (
        <>
            <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
            <div className="admin-content">
                <Container fluid>
                    {renderContent()}
                </Container>
            </div>

            {/* Modal Thêm Học sinh */}
            <Modal show={showStudentModal} onHide={() => { setShowStudentModal(false); setEditingStudent(null); setStudentForm({ StudentID: '', FullName: '', ClassName: '', SchoolName: '', ParentID: '', RouteID: '', PickupStopID: '', DropoffStopID: '' }); setAvailableStops([]); }}>
                <Modal.Header closeButton>
                    <Modal.Title>{editingStudent ? 'Sửa thông tin học sinh' : 'Thêm học sinh mới'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Họ và tên </Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Nhập họ tên học sinh"
                                value={studentForm.FullName || ''}
                                onChange={(e) => setStudentForm({ ...studentForm, FullName: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Lớp </Form.Label>
                            <Form.Control
                                type="text"
                                value={studentForm.ClassName || ''}
                                onChange={(e) => setStudentForm({ ...studentForm, ClassName: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Trường</Form.Label>
                            <Form.Control
                                type="text"
                                value={studentForm.SchoolName || ''}
                                onChange={(e) => setStudentForm({ ...studentForm, SchoolName: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Phụ huynh </Form.Label>
                            <Form.Select
                                value={studentForm.ParentID || ''}
                                onChange={(e) => setStudentForm({ ...studentForm, ParentID: e.target.value })}
                            >
                                <option value="">Chọn phụ huynh</option>
                                {parents.map((parent) => (
                                    <option key={parent.ParentID} value={parent.ParentID}>
                                        {parent.FullName} - {parent.Phone}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Tuyến xe (Tùy chọn)</Form.Label>
                            <Form.Select
                                value={studentForm.RouteID || ''}
                                onChange={(e) => setStudentForm({ ...studentForm, RouteID: e.target.value, PickupStopID: '', DropoffStopID: '' })}
                            >
                                <option value="">-- Chưa gán tuyến --</option>
                                {routes.map(r => (
                                    <option key={r.RouteID} value={r.RouteID}>{r.RouteName}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Điểm đón</Form.Label>
                            <Form.Select
                                value={studentForm.PickupStopID || ''}
                                onChange={(e) => setStudentForm({ ...studentForm, PickupStopID: e.target.value })}
                                disabled={!studentForm.RouteID}
                            >
                                <option value="">-- Chọn điểm đón --</option>
                                {availableStops.map(stop => (
                                    <option key={stop.StopID} value={stop.StopID}>
                                        {stop.StopName}
                                    </option>
                                ))}
                            </Form.Select>
                            {!studentForm.RouteID && (
                                <Form.Text className="text-muted">Vui lòng chọn tuyến xe trước</Form.Text>
                            )}
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Điểm trả</Form.Label>
                            <Form.Select
                                value={studentForm.DropoffStopID || ''}
                                onChange={(e) => setStudentForm({ ...studentForm, DropoffStopID: e.target.value })}
                                disabled={!studentForm.RouteID}
                            >
                                <option value="">-- Chọn điểm trả --</option>
                                {availableStops.map(stop => (
                                    <option key={stop.StopID} value={stop.StopID}>
                                        {stop.StopName}
                                    </option>
                                ))}
                            </Form.Select>
                            {!studentForm.RouteID && (
                                <Form.Text className="text-muted">Vui lòng chọn tuyến xe trước</Form.Text>
                            )}
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowStudentModal(false)}>
                        Hủy
                    </Button>
                    <Button variant="primary" onClick={handleAddStudent}>
                        {editingStudent ? 'Cập nhật' : 'Thêm học sinh'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal Thêm Tài xế */}
            <Modal show={showDriverModal} onHide={() => { setShowDriverModal(false); setEditingDriver(null); setDriverForm({ DriverID: '', FullName: '', Phone: '', LicenseNumber: 'B2', Status: 'active', UserID: '', Username: '', Password: '' }); }}>
                <Modal.Header closeButton>
                    <Modal.Title>{editingDriver ? 'Sửa thông tin tài xế' : 'Thêm tài xế mới'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Tên đăng nhập </Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Nhập tên đăng nhập"
                                value={driverForm.Username}
                                onChange={(e) => setDriverForm({ ...driverForm, Username: e.target.value })}
                                disabled={editingDriver}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Mật khẩu </Form.Label>
                            <Form.Control
                                type="password"
                                value={driverForm.Password}
                                onChange={(e) => setDriverForm({ ...driverForm, Password: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Họ và tên</Form.Label>
                            <Form.Control
                                type="text"
                                value={driverForm.FullName}
                                onChange={(e) => setDriverForm({ ...driverForm, FullName: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Số điện thoại </Form.Label>
                            <Form.Control
                                type="tel"
                                value={driverForm.Phone}
                                onChange={(e) => setDriverForm({ ...driverForm, Phone: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Bằng lái</Form.Label>
                            <Form.Select
                                value={driverForm.LicenseNumber}
                                onChange={(e) => setDriverForm({ ...driverForm, LicenseNumber: e.target.value })}
                            >
                                <option value="B2">B2</option>
                                <option value="C">C</option>
                                <option value="D">D</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Trạng thái</Form.Label>
                            <Form.Select
                                value={driverForm.Status}
                                onChange={(e) => setDriverForm({ ...driverForm, Status: e.target.value })}
                            >
                                <option value="active">Hoạt động</option>
                                <option value="off">Nghỉ</option>
                            </Form.Select>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDriverModal(false)}>
                        Hủy
                    </Button>
                    <Button variant="primary" onClick={handleAddDriver}>
                        {editingDriver ? 'Cập nhật' : 'Thêm tài xế'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal Thêm Phụ huynh */}
            <Modal show={showParentModal} onHide={() => { setShowParentModal(false); setEditingParent(null); setParentForm({ ParentID: '', FullName: '', Phone: '', Email: '', Address: '', UserID: '', Username: '', Password: '' }); }}>
                <Modal.Header closeButton>
                    <Modal.Title>{editingParent ? 'Sửa thông tin phụ huynh' : 'Thêm phụ huynh mới'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Tên đăng nhập</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Nhập tên đăng nhập"
                                value={parentForm.Username}
                                onChange={(e) => setParentForm({ ...parentForm, Username: e.target.value })}
                                disabled={editingParent}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Mật khẩu</Form.Label>
                            <Form.Control
                                type="password"
                                value={parentForm.Password}
                                onChange={(e) => setParentForm({ ...parentForm, Password: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Họ và tên </Form.Label>
                            <Form.Control
                                type="text"
                                value={parentForm.FullName}
                                onChange={(e) => setParentForm({ ...parentForm, FullName: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Số điện thoại </Form.Label>
                            <Form.Control
                                type="tel"
                                value={parentForm.Phone}
                                onChange={(e) => setParentForm({ ...parentForm, Phone: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Email</Form.Label>
                            <Form.Control
                                type="email"
                                value={parentForm.Email}
                                onChange={(e) => setParentForm({ ...parentForm, Email: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Địa chỉ</Form.Label>
                            <Form.Control
                                type="text"
                                value={parentForm.Address}
                                onChange={(e) => setParentForm({ ...parentForm, Address: e.target.value })}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowParentModal(false)}>
                        Hủy
                    </Button>
                    <Button variant="primary" onClick={handleAddParent}>
                        {editingParent ? 'Cập nhật' : 'Thêm phụ huynh'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal Thêm Xe buýt */}
            <Modal show={showBusModal} onHide={() => { setShowBusModal(false); setEditingBus(null); setBusForm({ BusID: '', PlateNumber: '', Capacity: '', Status: 'running' }); }}>
                <Modal.Header closeButton>
                    <Modal.Title>{editingBus ? 'Sửa thông tin xe buýt' : 'Thêm xe buýt mới'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Mã xe </Form.Label>
                            <Form.Control
                                type="text"
                                value={busForm.BusID}
                                onChange={(e) => setBusForm({ ...busForm, BusID: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Biển số </Form.Label>
                            <Form.Control
                                type="text"
                                value={busForm.PlateNumber}
                                onChange={(e) => setBusForm({ ...busForm, PlateNumber: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Số ghế </Form.Label>
                            <Form.Control
                                type="number"
                                value={busForm.Capacity}
                                onChange={(e) => setBusForm({ ...busForm, Capacity: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Trạng thái</Form.Label>
                            <Form.Select
                                value={busForm.Status}
                                onChange={(e) => setBusForm({ ...busForm, Status: e.target.value })}
                            >
                                <option value="running">Đang chạy</option>
                                <option value="stopped">Dừng</option>
                                <option value="maintenance">Bảo trì</option>
                            </Form.Select>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowBusModal(false)}>
                        Hủy
                    </Button>
                    <Button variant="primary" onClick={handleAddBus}>
                        Thêm xe buýt
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal Thêm Tuyến đường */}
            <Modal show={showRouteModal} onHide={() => { setShowRouteModal(false); setEditingRoute(null); setRouteForm({ RouteID: '', RouteName: '', Description: '' }); }}>
                <Modal.Header closeButton>
                    <Modal.Title>{editingRoute ? 'Sửa thông tin tuyến đường' : 'Thêm tuyến đường mới'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Mã tuyến </Form.Label>
                            <Form.Control
                                type="text"
                                value={routeForm.RouteID}
                                onChange={(e) => setRouteForm({ ...routeForm, RouteID: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Tên tuyến </Form.Label>
                            <Form.Control
                                type="text"
                                value={routeForm.RouteName}
                                onChange={(e) => setRouteForm({ ...routeForm, RouteName: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Mô tả </Form.Label>
                            <Form.Control
                                type="text"
                                value={routeForm.Description}
                                onChange={(e) => setRouteForm({ ...routeForm, Description: e.target.value })}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowRouteModal(false)}>
                        Hủy
                    </Button>
                    <Button variant="primary" onClick={handleAddRoute}>
                        Thêm tuyến đường
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal Thêm Lịch trình */}
            <Modal show={showScheduleModal} onHide={() => { setShowScheduleModal(false); setEditingSchedule(null); setScheduleForm({ TripID: '', AssignmentID: '', StartTime: '', EndTime: '', Status: 'scheduled' }); }}>
                <Modal.Header closeButton>
                    <Modal.Title>{editingSchedule ? 'Sửa lịch trình' : 'Tạo lịch trình mới'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Phân công (Tuyến - Xe - Tài xế)</Form.Label>
                            <Form.Select
                                value={scheduleForm.AssignmentID}
                                onChange={e => setScheduleForm({ ...scheduleForm, AssignmentID: e.target.value })}
                            >
                                <option value="">-- Chọn phân công --</option>
                                {assignments.map(a => {
                                    const route = routes.find(r => r.RouteID === a.RouteID);
                                    const bus = buses.find(b => b.BusID === a.BusID);
                                    const driver = drivers.find(d => d.DriverID === a.DriverID);
                                    return (
                                        <option key={a.AssignmentID} value={a.AssignmentID}>
                                            {route ? route.RouteName : a.RouteID} - {bus ? bus.PlateNumber : a.BusID} - {driver ? driver.FullName : a.DriverID}
                                        </option>
                                    );
                                })}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Giờ xuất phát</Form.Label>
                            <Form.Control
                                type="time"
                                value={scheduleForm.StartTime}
                                onChange={e => setScheduleForm({ ...scheduleForm, StartTime: e.target.value })}
                                step="60"
                                pattern="[0-9]{2}:[0-9]{2}"
                                lang="vi"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Giờ đến dự kiến</Form.Label>
                            <Form.Control
                                type="time"
                                value={scheduleForm.EndTime}
                                onChange={e => setScheduleForm({ ...scheduleForm, EndTime: e.target.value })}
                                step="60"
                                pattern="[0-9]{2}:[0-9]{2}"
                                lang="vi"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Trạng thái</Form.Label>
                            <Form.Select
                                value={scheduleForm.Status}
                                onChange={e => setScheduleForm({ ...scheduleForm, Status: e.target.value })}
                            >
                                <option value="scheduled">Đã lên lịch</option>
                                <option value="running">Đang chạy</option>
                                <option value="completed">Hoàn thành</option>
                            </Form.Select>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowScheduleModal(false)}>
                        Hủy
                    </Button>
                    <Button variant="primary" onClick={handleAddSchedule}>
                        Tạo lịch trình
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

