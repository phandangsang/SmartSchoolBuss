'use client'

import { useState } from 'react';
import { Nav } from 'react-bootstrap';
import '../styles/sidebar.css';

export default function Sidebar({ activeTab, onTabChange, userRole = 'admin' }) {
    // Menu cho Admin
    const adminMenuItems = [
        { id: 'students', label: 'Quản lý học sinh' },
        { id: 'parents', label: 'Quản lý phụ huynh' },
        { id: 'drivers', label: 'Quản lý tài xế' },
        { id: 'buses', label: 'Quản lý xe buýt' },
        { id: 'routes', label: 'Quản lý tuyến đường' },
        { id: 'assignments', label: 'Phân công' },
        { id: 'schedule', label: 'Lịch trình' },
        { id: 'tracking', label: 'Theo dõi GPS' },
    ];

    // Menu cho Parent (Phụ huynh)
    const parentMenuItems = [
        { id: 'student', label: 'Thông tin' },
        { id: 'tracking', label: 'Theo dõi xe buýt' },
        { id: 'notifications', label: 'Thông báo & Cảnh báo' },
        { id: 'schedule', label: 'Lịch trình tuần' },
        { id: 'history', label: 'Lịch sử di chuyển' },
    ];

    // Menu cho Driver (Tài xế)
    const driverMenuItems = [
        { id: 'routes', label: 'Tuyến đường' },
        { id: 'students', label: 'Quản lý học sinh' },
        { id: 'schedule', label: 'Lịch chạy' },
        { id: 'notifications', label: 'Thông báo' },
    ];

    const menuItems = userRole === 'parent' ? parentMenuItems :
        userRole === 'driver' ? driverMenuItems : adminMenuItems;

    return (
        <div className="sidebar">


            <Nav className="sidebar-nav flex-column">
                {menuItems.map((item) => (
                    <Nav.Link
                        key={item.id}
                        className={`sidebar-nav-item ${activeTab === item.id ? 'active' : ''}`}
                        onClick={() => onTabChange(item.id)}
                    >
                        <span className="sidebar-nav-icon">{item.icon}</span>
                        <span className="sidebar-nav-label">{item.label}</span>
                    </Nav.Link>
                ))}
            </Nav>
        </div>
    );
}
