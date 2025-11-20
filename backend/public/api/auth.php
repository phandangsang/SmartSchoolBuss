<?php
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../vendor/autoload.php';
require_once __DIR__ . '/../../src/Database.php';
require_once __DIR__ . '/../../src/Auth.php';
require_once __DIR__ . '/../../src/Helpers.php';

use App\Database;
use App\Auth;
use App\Helpers;

// Chi cho phep POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Helpers::error_response('Method not allowed', 405);
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];

// Validate input
if (empty($input['username']) || empty($input['password'])) {
    Helpers::error_response('Username and password are required', 400);
}

try {
    $db = Database::getConnection();

    // Tim user theo username
    $stmt = $db->prepare('SELECT UserID, Username, PasswordHash, FullName, Phone, Email, Role, IsActive FROM Users WHERE Username = ?');
    $stmt->execute([$input['username']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // Kiem tra user co ton tai khong
    if (!$user) {
        Helpers::error_response('Invalid username or password', 401);
    }

    // Kiem tra tai khoan co active khong
    if (!$user['IsActive']) {
        Helpers::error_response('Account is disabled', 403);
    }

    // Verify password
    if (!password_verify($input['password'], $user['PasswordHash'])) {
        Helpers::error_response('Invalid username or password', 401);
    }

    // Tao JWT token
    $token = Auth::generate_token([
        'user_id' => $user['UserID'],
        'username' => $user['Username'],
        'role' => $user['Role']
    ]);

    // Tra ve thong tin user va token
    Helpers::success_response([
        'token' => $token,
        'user' => [
            'id' => $user['UserID'],
            'username' => $user['Username'],
            'full_name' => $user['FullName'],
            'phone' => $user['Phone'],
            'email' => $user['Email'],
            'role' => $user['Role']
        ]
    ], 'Login successful');
} catch (Exception $e) {
    Helpers::error_response('Server error: ' . $e->getMessage(), 500);
}
