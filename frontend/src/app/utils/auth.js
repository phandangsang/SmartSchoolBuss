import { authAPI } from './api';

// Kiểm tra xác thực
export const checkAuth = () => {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    return !!token && !!userRole;
};

// Lấy thông tin user
export const getUserInfo = () => {
    return authAPI.getCurrentUser();
};

// Đăng xuất
export const logout = () => {
    authAPI.logout();
    if (typeof window !== 'undefined') {
        window.location.href = '/login';
    }
};
