<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Xử lý preflight CORS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
require_once __DIR__ . '/../../src/Database.php';
require_once __DIR__ . '/../../src/Helpers.php';

use App\Database;
use App\Helpers;


$pdo = Database::getConnection();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        try {
            $stmt = $pdo->query('SELECT DriverID, UserID, FullName, Phone, LicenseNumber, Status FROM drivers');
            $drivers = $stmt->fetchAll();
            Helpers::success_response($drivers);
        } catch (Exception $e) {
            Helpers::error_response('Lỗi truy vấn tài xế: ' . $e->getMessage(), 500);
        }
        break;
    case 'POST':
        // Lấy dữ liệu từ body
        $data = json_decode(file_get_contents('php://input'), true);
        $fullName = isset($data['FullName']) ? trim($data['FullName']) : '';
        $phone = isset($data['Phone']) ? trim($data['Phone']) : '';
        $licenseNumber = isset($data['LicenseNumber']) ? trim($data['LicenseNumber']) : '';
        $status = isset($data['Status']) ? trim($data['Status']) : 'ACTIVE';
        $userId = isset($data['UserID']) ? trim($data['UserID']) : null;
        $username = isset($data['Username']) ? trim($data['Username']) : null;
        $password = isset($data['Password']) ? trim($data['Password']) : null;

        // Validate đơn giản
        if ($fullName === '' || $phone === '' || $licenseNumber === '') {
            Helpers::error_response('Vui lòng nhập đầy đủ thông tin tài xế.', 400);
            exit;
        }

        try {
            // Nếu có username và password thì tạo user mới
            if ($username && $password) {
                // Kiểm tra username đã tồn tại chưa
                $stmt = $pdo->prepare('SELECT UserID FROM users WHERE Username = ?');
                $stmt->execute([$username]);
                $existUser = $stmt->fetch();
                if ($existUser) {
                    Helpers::error_response('Tên đăng nhập đã tồn tại', 400);
                }
                // Thêm user mới (mật khẩu plain text cho demo, thực tế nên hash)
                $stmt = $pdo->prepare('INSERT INTO users (Username, PasswordHash, FullName, Phone, Role, IsActive) VALUES (?, ?, ?, ?, ?, 1)');
                $stmt->execute([$username, $password, $fullName, $phone, 'driver']);
                $userId = $pdo->lastInsertId();
            }
            $stmt = $pdo->prepare('INSERT INTO drivers (UserID, FullName, Phone, LicenseNumber, Status) VALUES (?, ?, ?, ?, ?)');
            $stmt->execute([$userId, $fullName, $phone, $licenseNumber, $status]);
            $id = $pdo->lastInsertId();
            Helpers::success_response([
                'DriverID' => $id,
                'UserID' => $userId,
                'FullName' => $fullName,
                'Phone' => $phone,
                'LicenseNumber' => $licenseNumber,
                'Status' => $status
            ], 201);
        } catch (Exception $e) {
            Helpers::error_response('Lỗi thêm tài xế: ' . $e->getMessage(), 500);
        }
        break;
    case 'DELETE':
        // Handle DELETE (Xóa tài xế)
        $input = json_decode(file_get_contents('php://input'), true);
        if (!isset($input['id']) && !isset($input['DriverID'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Thiếu DriverID']);
            exit;
        }
        $driverId = $input['id'] ?? $input['DriverID'];

        // Lấy UserID liên kết với Driver
        $stmt = $pdo->prepare('SELECT UserID FROM drivers WHERE DriverID = ?');
        $stmt->execute([$driverId]);
        $driver = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$driver) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Không tìm thấy tài xế']);
            exit;
        }
        $userId = $driver['UserID'];

        // Xóa driver
        $stmt = $pdo->prepare('DELETE FROM drivers WHERE DriverID = ?');
        $stmt->execute([$driverId]);

        // Xóa user liên quan nếu có
        if ($userId) {
            $stmt = $pdo->prepare('DELETE FROM users WHERE UserID = ?');
            $stmt->execute([$userId]);
        }

        echo json_encode(['success' => true, 'message' => 'Đã xóa tài xế']);
        exit;
    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['DriverID'], $data['FullName'], $data['Phone'], $data['LicenseNumber'])) {
            Helpers::error_response('Thiếu dữ liệu đầu vào', 400);
        }
        $driverId = $data['DriverID'];
        $fullName = $data['FullName'];
        $phone = $data['Phone'];
        $licenseNumber = $data['LicenseNumber'];
        $status = isset($data['Status']) ? $data['Status'] : 'ACTIVE';
        $userId = isset($data['UserID']) ? $data['UserID'] : null;
        $username = isset($data['Username']) ? trim($data['Username']) : null;
        $password = isset($data['Password']) ? trim($data['Password']) : null;
        try {
            // Nếu có UserID và có Username/Password thì cập nhật tài khoản
            if ($userId && ($username || $password)) {
                $setUser = [];
                $paramsUser = [];
                if ($username) {
                    $setUser[] = 'Username = ?';
                    $paramsUser[] = $username;
                }
                if ($password) {
                    $setUser[] = 'PasswordHash = ?';
                    $paramsUser[] = $password;
                }
                if ($fullName) {
                    $setUser[] = 'FullName = ?';
                    $paramsUser[] = $fullName;
                }
                if ($phone) {
                    $setUser[] = 'Phone = ?';
                    $paramsUser[] = $phone;
                }
                if (!empty($setUser)) {
                    $paramsUser[] = $userId;
                    $sqlUser = 'UPDATE users SET ' . implode(', ', $setUser) . ' WHERE UserID = ?';
                    $stmt = $pdo->prepare($sqlUser);
                    $stmt->execute($paramsUser);
                }
            }
            // Cập nhật thông tin tài xế
            $stmt = $pdo->prepare('UPDATE drivers SET FullName = ?, Phone = ?, LicenseNumber = ?, Status = ? WHERE DriverID = ?');
            $stmt->execute([$fullName, $phone, $licenseNumber, $status, $driverId]);
            $stmt = $pdo->prepare('SELECT DriverID, UserID, FullName, Phone, LicenseNumber, Status FROM drivers WHERE DriverID = ?');
            $stmt->execute([$driverId]);
            $driver = $stmt->fetch();
            Helpers::success_response($driver, 'Cập nhật tài xế thành công');
        } catch (Exception $e) {
            Helpers::error_response('Lỗi cập nhật tài xế: ' . $e->getMessage(), 500);
        }
        break;
    default:
        Helpers::error_response('Phương thức không được hỗ trợ.', 405);
        break;
}
