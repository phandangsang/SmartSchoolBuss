<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
require_once __DIR__ . '/../../src/Database.php';
require_once __DIR__ . '/../../src/Helpers.php';

use App\Database;
use App\Helpers;


// Handle CORS preflight
$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$pdo = Database::getConnection();

switch ($method) {
    case 'GET':
        try {
            $stmt = $pdo->query('SELECT * FROM parents');
            $parents = $stmt->fetchAll();
            Helpers::success_response($parents);
        } catch (Exception $e) {
            Helpers::error_response('Lỗi truy vấn phụ huynh: ' . $e->getMessage(), 500);
        }
        break;
    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        if (!isset($input['FullName'], $input['Phone'])) {
            Helpers::error_response('Thiếu dữ liệu đầu vào', 400);
        }
        $fullName = $input['FullName'];
        $phone = $input['Phone'];
        $email = $input['Email'] ?? null;
        $address = $input['Address'] ?? null;
        $userId = isset($input['UserID']) && $input['UserID'] !== '' ? $input['UserID'] : null;
        $username = isset($input['Username']) ? trim($input['Username']) : null;
        $password = isset($input['Password']) ? trim($input['Password']) : null;
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
                $stmt = $pdo->prepare('INSERT INTO users (Username, PasswordHash, FullName, Phone, Email, Role, IsActive) VALUES (?, ?, ?, ?, ?, ?, 1)');
                $stmt->execute([$username, $password, $fullName, $phone, $email, 'parent']);
                $userId = $pdo->lastInsertId();
            }
            $stmt = $pdo->prepare('INSERT INTO parents (FullName, Phone, Email, Address, UserID) VALUES (?, ?, ?, ?, ?)');
            $stmt->bindValue(1, $fullName);
            $stmt->bindValue(2, $phone);
            $stmt->bindValue(3, $email);
            $stmt->bindValue(4, $address);
            if ($userId === null) {
                $stmt->bindValue(5, null, PDO::PARAM_NULL);
            } else {
                $stmt->bindValue(5, $userId);
            }
            $stmt->execute();
            $parentId = $pdo->lastInsertId();
            $stmt = $pdo->prepare('SELECT * FROM parents WHERE ParentID = ?');
            $stmt->execute([$parentId]);
            $parent = $stmt->fetch();
            Helpers::success_response($parent, 'Thêm phụ huynh thành công');
        } catch (Exception $e) {
            Helpers::error_response('Lỗi thêm phụ huynh: ' . $e->getMessage(), 500);
        }
        break;
    case 'PUT':
        $input = json_decode(file_get_contents('php://input'), true);
        if (!isset($input['ParentID'], $input['FullName'], $input['Phone'])) {
            Helpers::error_response('Thiếu dữ liệu đầu vào', 400);
        }
        $parentId = $input['ParentID'];
        $fullName = $input['FullName'];
        $phone = $input['Phone'];
        $email = $input['Email'] ?? null;
        $address = $input['Address'] ?? null;
        $userId = isset($input['UserID']) && $input['UserID'] !== '' ? $input['UserID'] : null;
        $username = isset($input['Username']) ? trim($input['Username']) : null;
        $password = isset($input['Password']) ? trim($input['Password']) : null;
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
                if ($email) {
                    $setUser[] = 'Email = ?';
                    $paramsUser[] = $email;
                }
                if (!empty($setUser)) {
                    $paramsUser[] = $userId;
                    $sqlUser = 'UPDATE users SET ' . implode(', ', $setUser) . ' WHERE UserID = ?';
                    $stmt = $pdo->prepare($sqlUser);
                    $stmt->execute($paramsUser);
                }
            }
            // Cập nhật thông tin phụ huynh
            $stmt = $pdo->prepare('UPDATE parents SET FullName = ?, Phone = ?, Email = ?, Address = ? WHERE ParentID = ?');
            $stmt->execute([$fullName, $phone, $email, $address, $parentId]);
            $stmt = $pdo->prepare('SELECT * FROM parents WHERE ParentID = ?');
            $stmt->execute([$parentId]);
            $parent = $stmt->fetch();
            Helpers::success_response($parent, 'Cập nhật phụ huynh thành công');
        } catch (Exception $e) {
            Helpers::error_response('Lỗi cập nhật phụ huynh: ' . $e->getMessage(), 500);
        }
        break;
    case 'DELETE':
        $input = json_decode(file_get_contents('php://input'), true);
        if (!isset($input['id'])) {
            Helpers::error_response('Thiếu dữ liệu đầu vào', 400);
        }
        $parentId = $input['id'];
        try {
            $stmt = $pdo->prepare('DELETE FROM parents WHERE ParentID = ?');
            $stmt->execute([$parentId]);
            Helpers::success_response(['message' => 'Xóa phụ huynh thành công']);
        } catch (Exception $e) {
            Helpers::error_response('Lỗi xóa phụ huynh: ' . $e->getMessage(), 500);
        }
        break;
    default:
        Helpers::error_response('Phương thức không được hỗ trợ', 405);
}
