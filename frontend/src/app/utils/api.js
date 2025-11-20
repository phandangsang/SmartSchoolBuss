
// Lấy thông tin học sinh/phụ huynh/xe buýt động và các API khác cho phụ huynh
export const parentAPI = {
    getStudentInfo: (parentId) => fetchAPI(`/studentinfo.php?parent_id=${parentId}`),
    getDashboard: () => fetchAPI('/parent/dashboard'),
    getStudents: () => fetchAPI('/parent/students'),
    getBusLocation: (busId) => fetchAPI(`/parent/bus/${busId}/location`),
    getNotifications: () => fetchAPI('/parent/notifications'),
};
// Assignment APIs
export const assignmentAPI = {
    getAssignments: (routeId) => routeId
        ? fetchAPI(`/assignments.php?route_id=${routeId}`)
        : fetchAPI('/assignments.php'),
    createAssignment: (data) => fetchAPI('/assignments.php', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    updateAssignment: (assignmentId, data) => fetchAPI('/assignments.php', {
        method: 'PUT',
        body: JSON.stringify({ AssignmentID: assignmentId, ...data }),
    }),
    deleteAssignment: (assignmentId) => fetchAPI('/assignments.php', {
        method: 'DELETE',
        body: JSON.stringify({ AssignmentID: assignmentId }),
    }),
};
// API Configuration
// Default to PHP backend on port 8000. Normalize NEXT_PUBLIC_API_URL so it
// always includes the '/api' prefix (makes it resilient when env is set
// to 'http://localhost:8000' or 'http://localhost:8000/api').

// Sửa đường dẫn API cho đúng backend PHP thực tế
let API_BASE_URL = 'http://localhost/SmartSchoolBus-main/backend/public/api';

// Helper function để gọi API
const fetchAPI = async (endpoint, options = {}) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
    };

    const config = {
        ...options,
        headers,
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'API request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

// Auth APIs
export const authAPI = {
    register: async (userData) => {
        const data = await fetchAPI('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
        return data.data;
    },

    login: async (username, password) => {
        const data = await fetchAPI('/login.php', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });

        // Hỗ trợ cả trường hợp backend trả về access_token hoặc token
        if (data.data) {
            if (data.data.access_token) {
                localStorage.setItem('token', data.data.access_token);
            }
            if (data.data.token) {
                localStorage.setItem('token', data.data.token);
            }
            if (data.data.user && data.data.user.role) {
                localStorage.setItem('userRole', data.data.user.role);
            }
            if (data.data.user && data.data.user.full_name) {
                localStorage.setItem('userName', data.data.user.full_name);
            }
            if (data.data.user && data.data.user.id) {
                localStorage.setItem('userId', data.data.user.id);
            }
        }

        return data.data;
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        localStorage.removeItem('userId');
    },

    getCurrentUser: () => {
        if (typeof window === 'undefined') return null;

        const token = localStorage.getItem('token');
        if (!token) return null;

        return {
            userId: localStorage.getItem('userId'),
            role: localStorage.getItem('userRole'),
            name: localStorage.getItem('userName'),
        };
    },
};

// Admin APIs
export const adminAPI = {
    createTrip: (tripData) => fetchAPI('/trips.php', {
        method: 'POST',
        body: JSON.stringify(tripData),
    }),
    updateTrip: (tripId, tripData) => fetchAPI('/trips.php', {
        method: 'PUT',
        body: JSON.stringify({ TripID: tripId, ...tripData }),
    }),
    // Trips
    getTrips: () => fetchAPI('/trips.php'),
    // Students
    getStudents: () => fetchAPI('/students.php'),
    createStudent: (studentData) => fetchAPI('/students.php', {
        method: 'POST',
        body: JSON.stringify(studentData),
    }),
    updateStudent: (studentId, studentData) => fetchAPI('/students.php', {
        method: 'PUT',
        body: JSON.stringify({ StudentID: studentId, ...studentData }),
    }),
    deleteStudent: (studentId) => fetchAPI('/students.php', {
        method: 'DELETE',
        body: JSON.stringify({ id: studentId }),
    }),

    // Drivers
    getDrivers: () => fetchAPI('/drivers.php'),
    createDriver: (driverData) => fetchAPI('/drivers.php', {
        method: 'POST',
        body: JSON.stringify(driverData),
    }),
    updateDriver: (driverId, driverData) => {
        // Always send all required fields for update
        const {
            FullName = '',
            Phone = '',
            LicenseNumber = '',
            Status = '',
            UserID = '',
            Password = '',
        } = driverData;
        // Compose payload with all required fields
        const payload = {
            DriverID: driverId,
            FullName,
            Phone,
            LicenseNumber,
            Status,
            UserID,
        };
        // Only include Password if provided (for password change)
        if (Password) payload.Password = Password;
        return fetchAPI('/drivers.php', {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    },
    deleteDriver: (driverId) => fetchAPI('/drivers.php', {
        method: 'DELETE',
        body: JSON.stringify({ id: driverId }),
    }),

    // Parents
    getParents: () => fetchAPI('/parents.php'),
    createParent: (parentData) => fetchAPI('/parents.php', {
        method: 'POST',
        body: JSON.stringify(parentData),
    }),
    updateParent: (parentId, parentData) => fetchAPI('/parents.php', {
        method: 'PUT',
        body: JSON.stringify({ ParentID: parentId, ...parentData }),
    }),
    deleteParent: (parentId) => fetchAPI('/parents.php', {
        method: 'DELETE',
        body: JSON.stringify({ id: parentId }),
    }),

    // Buses
    getBuses: () => fetchAPI('/buses.php'),
    createBus: (busData) => fetchAPI('/buses.php', {
        method: 'POST',
        body: JSON.stringify(busData),
    }),
    updateBus: (busId, busData) => fetchAPI('/buses.php', {
        method: 'PUT',
        body: JSON.stringify({ id: busId, ...busData }),
    }),
    deleteBus: (busId) => fetchAPI('/buses.php', {
        method: 'DELETE',
        body: JSON.stringify({ id: busId }),
    }),

    // Routes
    getRoutes: () => fetchAPI('/routes.php'),
    createRoute: (routeData) => fetchAPI('/routes.php', {
        method: 'POST',
        body: JSON.stringify(routeData),
    }),
    updateRoute: (routeId, routeData) => fetchAPI('/routes.php', {
        method: 'PUT',
        body: JSON.stringify({ id: routeId, ...routeData }),
    }),
    deleteRoute: (routeId) => fetchAPI('/routes.php', {
        method: 'DELETE',
        body: JSON.stringify({ id: routeId }),
    }),

    // Users
    getUsers: () => fetchAPI('/users.php'),
    createUser: (userData) => fetchAPI('/users.php', {
        method: 'POST',
        body: JSON.stringify(userData),
    }),
    updateUser: (userId, userData) => fetchAPI('/users.php', {
        method: 'PUT',
        body: JSON.stringify({ id: userId, ...userData }),
    }),
    deleteUser: (userId) => fetchAPI('/users.php', {
        method: 'DELETE',
        body: JSON.stringify({ id: userId }),
    }),
};

// Driver APIs
export const driverAPI = {
    getDashboard: () => fetchAPI('/driver/dashboard'),
    getTrips: () => fetchAPI('/driver/trips'),
    startTrip: (tripId) => fetchAPI(`/driver/trips/${tripId}/start`, {
        method: 'POST',
    }),
    endTrip: (tripId) => fetchAPI(`/driver/trips/${tripId}/end`, {
        method: 'POST',
    }),
    updateLocation: (location) => fetchAPI('/driver/location', {
        method: 'POST',
        body: JSON.stringify(location),
    }),
};



export default fetchAPI;
