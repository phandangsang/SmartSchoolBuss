<?php
// CORS cho Next.js
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../vendor/autoload.php';
require_once __DIR__ . '/../../src/Database.php';
require_once __DIR__ . '/../../src/Helpers.php';

use App\Database;
use App\Helpers;


try {
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method !== 'POST') {
        Helpers::error_response('Method not allowed', 405);
    }

    $input = json_decode(file_get_contents('php://input'), true) ?? [];

    $username = trim($input['username'] ?? '');
    $password = trim($input['password'] ?? '');

    if ($username === '' || $password === '') {
        Helpers::error_response('Username and password are required', 400);
    }

    $db = Database::getConnection();

    // Lấy user theo Username
    $sql = "SELECT UserID, Username, PasswordHash, FullName, Role, IsActive
            FROM users
            WHERE Username = :username
            LIMIT 1";
    $stmt = $db->prepare($sql);
    $stmt->bindParam(':username', $username, PDO::PARAM_STR);
    $stmt->execute();

    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // Không tìm thấy user
    if (!$user) {
        Helpers::error_response('Invalid username or password', 401);
    }

    // Tài khoản bị khóa
    if ((int)$user['IsActive'] === 0) {
        Helpers::error_response('Account is inactive', 403);
    }

    // So sánh mật khẩu (plain text: PasswordHash = '123456')
    if ($password !== $user['PasswordHash']) {
        Helpers::error_response('Invalid username or password', 401);
    }

    // Tạo token đơn giản (cho dự án demo)
    $token = base64_encode($user['UserID'] . '|' . $user['Username'] . '|' . $user['Role']);

    Helpers::success_response([
        'token' => $token,
        'user'  => [
            'id'        => $user['UserID'],
            'username'  => $user['Username'],
            'full_name' => $user['FullName'],
            'role'      => $user['Role'],
        ],
    ], 'Login successful');
} catch (Exception $e) {
    Helpers::error_response('Server error: ' . $e->getMessage(), 500);
}
