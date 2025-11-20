'use client'
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Dropdown } from 'react-bootstrap';
import "../styles/header.css";

export default function Header() {
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [userRole, setUserRole] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);


    // Hàm cập nhật trạng thái đăng nhập từ localStorage
    const updateAuthState = () => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('userRole');
        const name = localStorage.getItem('userName');
        if (token && role) {
            setUserRole(role);
            setUserName(name || 'User');
            setIsLoggedIn(true);
        } else {
            setUserRole('');
            setUserName('');
            setIsLoggedIn(false);
        }
    };

    useEffect(() => {
        updateAuthState();
        // Lắng nghe sự kiện storage để cập nhật khi localStorage thay đổi (ví dụ: đăng nhập ở tab khác)
        const handleStorage = (event) => {
            if (
                event.key === 'token' ||
                event.key === 'userRole' ||
                event.key === 'userName'
            ) {
                updateAuthState();
            }
        };
        // Lắng nghe custom event 'authChanged' để cập nhật ngay khi đăng nhập thành công
        const handleAuthChanged = () => {
            updateAuthState();
        };
        window.addEventListener('storage', handleStorage);
        window.addEventListener('authChanged', handleAuthChanged);
        return () => {
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('authChanged', handleAuthChanged);
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        localStorage.removeItem('userId');
        window.location.href = '/login';
    };

    return (
        <header className="app-header">
            <div className="header-left">
                <Link href="/" className="brand">
                    <div className="logo">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="2" y="6" width="20" height="10" rx="2" fill="#2F80ED" />
                            <circle cx="8" cy="17" r="1.4" fill="#ffffff" />
                            <circle cx="16" cy="17" r="1.4" fill="#ffffff" />
                            <rect x="4" y="8" width="4" height="4" rx="0.5" fill="#ffffff" />
                        </svg>
                    </div>
                    <div className="brand-text">
                        <div className="brand-title">Smart School Bus</div>
                        <div className="brand-subtitle">Hệ thống quản lý thông minh</div>
                    </div>
                </Link>
            </div>

            <div className="header-right">

                {isLoggedIn ? (
                    <Dropdown align="end">
                        <Dropdown.Toggle variant="link" className="profile text-decoration-none" style={{ border: 'none', background: 'transparent', padding: 0 }}>
                            <div className="avatar">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor" />
                                </svg>
                            </div>
                            <div className="profile-text">
                                <div className="profile-name">{userName}</div>
                                <div className="profile-role">
                                    {userRole?.toLowerCase() === 'admin'
                                        ? 'Quản trị viên'
                                        : userRole?.toLowerCase() === 'driver'
                                            ? 'Tài xế'
                                            : 'Phụ huynh'}
                                </div>
                            </div>
                        </Dropdown.Toggle>

                        <Dropdown.Menu>

                            <Dropdown.Item onClick={handleLogout}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
                                    <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" fill="currentColor" />
                                </svg>
                                Đăng xuất
                            </Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                ) : (
                    <Link href="/login" className="profile">
                        <div className="avatar">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor" />
                            </svg>
                        </div>
                        <div className="profile-text">
                            <div className="profile-name">Đăng nhập</div>
                        </div>
                    </Link>
                )}
            </div>
        </header>

    )
}
