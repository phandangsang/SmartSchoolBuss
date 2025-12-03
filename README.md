# 🚌 SmartSchoolBus

> Hệ thống quản lý và theo dõi xe buýt trường học thông minh với GPS tracking và tự động điểm danh học sinh

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![PHP](https://img.shields.io/badge/PHP-8.x-777BB4)](https://www.php.net/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1)](https://www.mysql.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-Maps-199900)](https://leafletjs.com/)

---

## 📋 Mục lục

- [Giới thiệu](#-giới-thiệu)
- [Tính năng chính](#-tính-năng-chính)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Cài đặt](#-cài-đặt)
- [Hướng dẫn sử dụng](#-hướng-dẫn-sử-dụng)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [API Documentation](#-api-documentation)
- [Xử lý lỗi](#-xử-lý-lỗi)
- [Đóng góp](#-đóng-góp)
- [License](#-license)

---

## 🎯 Giới thiệu

**SmartSchoolBus** là hệ thống quản lý xe buýt trường học toàn diện, giúp nhà trường, tài xế và phụ huynh theo dõi vị trí xe buýt real-time, quản lý lộ trình, và tự động điểm danh học sinh khi đón/trả.

### Vấn đề giải quyết

- ✅ Theo dõi vị trí xe buýt real-time trên bản đồ
- ✅ Tự động điểm danh học sinh khi xe đến điểm đón/trả
- ✅ Quản lý tuyến đường, lịch trình và phân công tài xế
- ✅ Giao tiếp giữa nhà trường, tài xế và phụ huynh
- ✅ Báo cáo và thống kê hiệu quả

---

## ✨ Tính năng chính

### 👨‍💼 Admin Panel

- 📊 **Quản lý toàn diện**: Học sinh, phụ huynh, tài xế, xe buýt, tuyến đường
- 🗺️ **Quản lý lộ trình**: Tạo/sửa/xóa tuyến đường với điểm dừng trên bản đồ
- 📅 **Lên lịch trình**: Phân công xe buýt và tài xế cho từng tuyến theo thời gian
- 📍 **Theo dõi GPS**: Xem vị trí real-time của tất cả xe buýt
- 💬 **Gửi thông báo**: Gửi tin nhắn đến tài xế và phụ huynh

### 🚗 Giao diện Tài xế

- 🗺️ **Xem lộ trình**: Hiển thị tuyến đường chi tiết trên bản đồ với OSRM routing
- 🎮 **Simulation**: Mô phỏng chuyến đi với điểm danh tự động
- 👥 **Quản lý học sinh**: Xem danh sách học sinh trên chuyến
- ✅ **Tự động đón/trả**: Hệ thống tự động đánh dấu khi xe đến gần điểm đón/trả (< 50m)
- 📢 **Nhận thông báo**: Nhận tin nhắn từ admin

### 📱 Giao diện Phụ huynh

- 🗺️ **Theo dõi xe**: Xem vị trí real-time của xe buýt chở con
- 👶 **Trạng thái học sinh**: Kiểm tra con đã được đón/trả chưa
- 💬 **Liên hệ**: Nhận thông báo từ nhà trường

### 🤖 Tính năng nổi bật

#### Tự động điểm danh học sinh

Hệ thống sử dụng GPS để tự động đánh dấu học sinh khi xe đến gần điểm đón/trả:

```javascript
// Tự động khi xe < 50m từ điểm đón
if (distance < 50m && status === 'waiting') {
    → Auto-mark as 'picked'
}

// Tự động khi xe < 50m từ điểm trả
if (distance < 50m && status === 'picked') {
    → Auto-mark as 'dropped'
}
```

#### Animation mượt mà

- 🎬 **Smooth animation**: Xe di chuyển mượt mà trên bản đồ (1s/frame, 20m/point)
- 🛣️ **OSRM Routing**: Lộ trình theo đường phố thực tế, không phải đường chim bay
- 🎯 **Easing function**: Chuyển động tự nhiên với ease-out cubic

---

## 🛠️ Công nghệ sử dụng

### Frontend

| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| **Next.js** | 14.x | React framework |
| **React** | 18.x | UI library |
| **React Bootstrap** | 2.x | UI components |
| **Leaflet** | 1.9.x | Bản đồ tương tác |
| **OSRM** | - | Routing engine |

### Backend

| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| **PHP** | 8.x | Server-side logic |
| **MySQL** | 8.0 | Database |
| **PDO** | - | Database access |

### External Services

- **Leaflet Maps**: Bản đồ tương tác
- **OSRM (Open Source Routing Machine)**: Tính toán lộ trình theo đường phố thực tế

---

## 📦 Cài đặt

### Yêu cầu hệ thống

- **XAMPP** hoặc **LAMP/WAMP** (Apache + PHP 8.x + MySQL 8.0)
- **Node.js** v18+ và **npm**
- **Git**

### Bước 1: Clone Repository

```bash
git clone https://github.com/yourusername/SmartSchoolBus.git
cd SmartSchoolBus
```

### Bước 2: Cài đặt Backend (PHP + MySQL)

#### 2.1. Import Database

1. Khởi động XAMPP (Apache + MySQL)
2. Mở phpMyAdmin: `http://localhost/phpmyadmin`
3. Tạo database mới: `smartschoolbus`
4. Import file SQL: `backend/database/smartschoolbus.sql`

#### 2.2. Cấu hình Database

Mở file `backend/src/Database.php` và cấu hình:

```php
private static $host = 'localhost';
private static $dbname = 'smartschoolbus';
private static $username = 'root';
private static $password = ''; // Để trống nếu dùng XAMPP
```

#### 2.3. Di chuyển Backend vào XAMPP

```bash
# Windows
xcopy /E /I backend C:\xampp\htdocs\SmartSchoolBus-main\backend

# Linux/Mac
cp -r backend /opt/lampp/htdocs/SmartSchoolBus-main/backend
```

#### 2.4. Kiểm tra API

Truy cập: `http://localhost/SmartSchoolBus-main/backend/public/api/students.php`

Kết quả mong đợi:
```json
{
    "success": true,
    "data": [...]
}
```

### Bước 3: Cài đặt Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

Truy cập: `http://localhost:3000`

### Bước 4: Đăng nhập

#### Tài khoản mặc định:

| Vai trò | Username | Password |
|---------|----------|----------|
| **Admin** | `admin` | `admin123` |
| **Tài xế** | `driver1` | `driver123` |
| **Phụ huynh** | `parent1` | `parent123` |

---

## 📖 Hướng dẫn sử dụng

### Dành cho Admin

#### 1. Quản lý tuyến đường

1. Vào **Quản lý tuyến đường** → **+ Thêm tuyến đường**
2. Nhập thông tin:
   - Tên tuyến: `H1-B1`
   - Điểm đầu/cuối
   - Thêm điểm dừng trung gian
3. **Lưu**

#### 2. Phân công tài xế

1. Vào **Phân công**
2. Chọn tuyến → Chọn xe buýt → Chọn tài xế
3. **Lưu phân công**

#### 3. Lên lịch trình

1. Vào **Lịch trình** → **+ Tạo lịch trình**
2. Chọn phân công (tuyến + xe + tài xế)
3. Chọn giờ xuất phát
4. **Tạo**

### Dành cho Tài xế

#### 1. Xem chuyến của mình

1. Đăng nhập với tài khoản tài xế
2. Vào tab **Chuyến của tôi**
3. Xem danh sách chuyến được phân công

#### 2. Bắt đầu chuyến (Simulation)

1. Nhấn **🚀 Bắt đầu** ở chuyến muốn chạy
2. Hệ thống sẽ:
   - Reset tất cả học sinh về `waiting`
   - Tính toán lộ trình OSRM
   - Bắt đầu mô phỏng di chuyển
   - Tự động đón/trả học sinh khi đến điểm

#### 3. Xem danh sách học sinh

1. Nhấn **Xem danh sách** ở chuyến đang chạy
2. Xem trạng thái từng học sinh:
   - ⚪ **Chưa đón**
   - 🔵 **Đã đón**
   - ✅ **Đã trả**

### Dành cho Phụ huynh

1. Đăng nhập với tài khoản phụ huynh
2. Xem vị trí xe buýt chở con trên bản đồ
3. Kiểm tra trạng thái: Con đã được đón/trả chưa

---

## 📁 Cấu trúc dự án

```
SmartSchoolBus-main/
├── backend/                      # PHP Backend
│   ├── public/
│   │   └── api/                  # REST API endpoints
│   │       ├── students.php      # Quản lý học sinh
│   │       ├── drivers.php       # Quản lý tài xế
│   │       ├── buses.php         # Quản lý xe buýt
│   │       ├── routes.php        # Quản lý tuyến đường
│   │       ├── route_stops.php   # Điểm dừng trên tuyến
│   │       ├── assignments.php   # Phân công xe/tài xế
│   │       ├── trips.php         # Lịch trình chuyến đi
│   │       ├── trip_students.php # Học sinh trên chuyến
│   │       ├── report_student.php# Đánh dấu trạng thái HS
│   │       ├── bus_location.php  # GPS tracking
│   │       └── ...
│   └── src/
│       ├── Database.php          # Database connection
│       ├── Auth.php              # Authentication
│       └── Helpers.php           # Helper functions
│
├── frontend/                     # Next.js Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── admin/            # Trang admin
│   │   │   │   └── page.js       # Admin dashboard
│   │   │   ├── driver/           # Trang tài xế
│   │   │   │   └── page.js       # Driver interface
│   │   │   ├── parent/           # Trang phụ huynh
│   │   │   │   └── page.js       # Parent interface
│   │   │   ├── components/       # Shared components
│   │   │   │   ├── BusMap.js     # Map component
│   │   │   │   ├── sidebar.js    # Navigation sidebar
│   │   │   │   └── header.js     # Header component
│   │   │   ├── utils/
│   │   │   │   └── api.js        # API client
│   │   │   └── styles/           # CSS files
│   │   └── ...
│   ├── package.json
│   └── next.config.js
│
├── README.md                     # This file
└── .gitignore
```

---

## 📡 API Documentation

### Base URL

```
http://localhost/SmartSchoolBus-main/backend/public/api/
```

### Endpoints

#### Students

```http
GET    /students.php              # Lấy tất cả học sinh
POST   /students.php              # Tạo học sinh mới
PUT    /students.php?id={id}      # Cập nhật học sinh
DELETE /students.php?id={id}      # Xóa học sinh
```

#### Routes

```http
GET    /routes.php                # Lấy tất cả tuyến đường
POST   /routes.php                # Tạo tuyến đường mới
PUT    /routes.php?id={id}        # Cập nhật tuyến
DELETE /routes.php?id={id}        # Xóa tuyến
```

#### Trip Students

```http
GET    /trip_students.php?trip_id={id}  # Lấy học sinh trên chuyến
```

**Response:**
```json
{
    "success": true,
    "data": [
        {
            "StudentID": 1,
            "FullName": "Nguyễn Văn A",
            "ClassName": "Lớp 6A",
            "PickupLatitude": 10.870000,
            "PickupLongitude": 106.780000,
            "PickupStopName": "Khu công nghệ cao",
            "DropoffLatitude": 10.850000,
            "DropoffLongitude": 106.750000,
            "DropoffStopName": "Trường THPT X",
            "Status": "waiting"
        }
    ]
}
```

#### Report Student

```http
POST   /report_student.php
```

**Request Body:**
```json
{
    "trip_id": 1,
    "student_id": 5,
    "status": "picked"  // waiting | picked | dropped | absent
}
```

#### Bus Location

```http
POST   /bus_location.php
```

**Request Body:**
```json
{
    "busId": 1,
    "tripId": 3,
    "latitude": 10.870000,
    "longitude": 106.780000,
    "speed": 36,
    "heading": 180
}
```

---

## 🔧 Xử lý lỗi

### Lỗi thường gặp

#### 1. Foreign Key Constraint khi xóa

**Lỗi:**
```
SQLSTATE[23000]: Integrity constraint violation: 1451 Cannot delete or update a parent row
```

**Nguyên nhân:** Dữ liệu phụ thuộc chưa được xóa

**Giải pháp:** Code đã xử lý tự động, nếu vẫn lỗi check:
- `tripstudents` table
- `trips` table
- `routeassignments` table
- `routestops` table

#### 2. Không tự động đón học sinh

**Nguyên nhân:** Học sinh không có tọa độ điểm đón

**Giải pháp:**
1. Vào Admin → Quản lý học sinh
2. Sửa học sinh → Chọn **Điểm đón**
3. Lưu

**Kiểm tra trong database:**
```sql
SELECT s.FullName, s.PickupStopID, 
       pickup.Latitude, pickup.Longitude
FROM students s
LEFT JOIN routestops pickup ON s.PickupStopID = pickup.StopID
WHERE s.StudentID = 1;
```

#### 3. Xe chạy giật giật trên bản đồ

**Đã fix:** Animation duration = Simulation interval = 1s

Nếu vẫn giật, kiểm tra:
- Mật độ điểm (hiện tại: 20m/point)
- Network latency
- Browser performance

#### 4. Tọa độ điểm dừng bị sai

**Ví dụ:** Longitude `106.708000` thay vì `106.780493`

**Giải pháp:** Cập nhật database:
```sql
UPDATE routestops
SET Longitude = 106.780493,
    Latitude = 10.870817
WHERE StopID = 16;
```

---

## 🤝 Đóng góp

Contributions are welcome! For major changes, please:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Liên hệ

- **Author:** Phan Đăng Sang
- **Email:** your.email@example.com
- **GitHub:** [yourusername](https://github.com/yourusername)
- **Project Link:** [https://github.com/yourusername/SmartSchoolBus](https://github.com/yourusername/SmartSchoolBus)

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Leaflet](https://leafletjs.com/)
- [OSRM](http://project-osrm.org/)
- [React Bootstrap](https://react-bootstrap.github.io/)

---

<div align="center">

**Made with ❤️ for school transportation safety**

⭐ Star this repo if you found it helpful!

</div>
