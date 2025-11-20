yarn install
pnpm install
yarn dev
pnpm dev

# SmartSchoolBus

Hệ thống quản lý xe buýt trường học thông minh

## Mục lục
- [Giới thiệu](#giới-thiệu)
- [Tính năng chính](#tính-năng-chính)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Cài đặt & Chạy thử](#cài-đặt--chạy-thử)
- [API Backend](#api-backend)
- [Frontend](#frontend)
- [Liên hệ](#liên-hệ)

---

## Giới thiệu
SmartSchoolBus là hệ thống quản lý xe buýt trường học, hỗ trợ quản trị viên, tài xế, phụ huynh và học sinh theo dõi, phân công, lên lịch trình và giám sát hoạt động xe buýt.

## Tính năng chính
- Quản lý học sinh, phụ huynh, tài xế, xe buýt, tuyến đường
- Phân công xe buýt và tài xế cho từng tuyến
- Lên lịch trình chạy xe buýt (theo phân công)
- Theo dõi GPS xe buýt (demo)
- Đăng nhập, phân quyền người dùng

## Cấu trúc dự án
```
SmartSchoolBus-main/
├── backend/           # PHP API, MySQL
│   ├── public/api/    # Các file API PHP (students.php, trips.php, ...)
│   └── src/           # Code PHP core (Database, Auth, ...)
├── frontend/          # Next.js (React)
│   ├── src/app/       # Trang, component, utils
│   └── public/        # Static assets
└── README.md
```

## Cài đặt & Chạy thử
### 1. Backend (PHP + MySQL)
- Cài XAMPP hoặc LAMP, import file SQL vào MySQL
- Đặt backend vào thư mục webserver (vd: `htdocs/SmartSchoolBus-main/backend`)
- Cấu hình kết nối DB trong `src/Database.php`
- Truy cập các API qua: `http://localhost/SmartSchoolBus-main/backend/public/api/`

### 2. Frontend (Next.js)
- `cd frontend`
- `npm install`
- `npm run dev`
- Truy cập: `http://localhost:3000`

## API Backend
- RESTful API cho tất cả thực thể: students, parents, drivers, buses, routes, assignments, trips...
- Chuẩn JSON, xác thực JWT (token)
- Xem chi tiết từng API trong thư mục `backend/public/api/`

## Frontend
- Giao diện quản trị viên: quản lý, phân công, lên lịch trình, theo dõi GPS
- Giao diện tài xế, phụ huynh (demo)
- Sử dụng React, Next.js, Bootstrap

## Liên hệ
- Tác giả: [Tên bạn]
- Email: [email@example.com]
- Github: [link repo]

---
> SmartSchoolBus - School Bus Management System
