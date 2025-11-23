<?php
header('Access-Control-Allow-Origin: *');
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

use App\Database;
use App\Auth;

try {
    // Xác thực tài xế
    $user = Auth::get_current_user_from_token();
    
    // Fallback for simple base64 token (UserID|Username|Role)
    if (!$user) {
        $headers = function_exists('apache_request_headers') ? apache_request_headers() : $_SERVER;
        // Handle case-insensitive header keys
        $authHeader = null;
        foreach ($headers as $key => $value) {
            if (strtolower($key) === 'authorization') {
                $authHeader = $value;
                break;
            }
        }
        
        if ($authHeader && preg_match('/Bearer\s+(\S+)/', $authHeader, $matches)) {
            $token = $matches[1];
            $decoded = base64_decode($token, true);
            if ($decoded) {
                $parts = explode('|', $decoded);
                if (count($parts) >= 1) {
                    $userId = $parts[0];
                    $user = Auth::get_user_by_id($userId);
                }
            }
        }
    }
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['content'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Thiếu nội dung cảnh báo']);
        exit;
    }

    $content = $input['content'];
    $fromUserId = $user['UserID'];
    
    $db = Database::getConnection();
    
    // Lấy danh sách phụ huynh từ học sinh được phân công cho tài xế này
    // 1. Tìm DriverID từ UserID
    $stmtDriver = $db->prepare('SELECT DriverID FROM drivers WHERE UserID = ?');
    $stmtDriver->execute([$fromUserId]);
    $driver = $stmtDriver->fetch();
    
    if (!$driver) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Không tìm thấy thông tin tài xế']);
        exit;
    }
    
    $driverId = $driver['DriverID'];
    
    // 2. Lấy danh sách phụ huynh từ học sinh trên các chuyến của tài xế
    $sql = "SELECT DISTINCT p.UserID 
            FROM trips t
            JOIN routeassignments ra ON t.AssignmentID = ra.AssignmentID
            JOIN tripstudents ts ON t.TripID = ts.TripID
            JOIN students s ON ts.StudentID = s.StudentID
            JOIN parents p ON s.ParentID = p.ParentID
            WHERE ra.DriverID = ? AND p.UserID IS NOT NULL";
    
    $stmtParents = $db->prepare($sql);
    $stmtParents->execute([$driverId]);
    $parents = $stmtParents->fetchAll();
    
    if (empty($parents)) {
        http_response_code(200);
        echo json_encode(['success' => true, 'message' => 'Không có phụ huynh nào để gửi cảnh báo', 'sent_count' => 0]);
        exit;
    }
    
    // 3. Gửi tin nhắn cảnh báo cho tất cả phụ huynh
    $stmtMsg = $db->prepare('INSERT INTO messages (FromUserID, ToUserID, Content, MessageType, SentAt) VALUES (?, ?, ?, "ALERT", NOW())');
    
    $sentCount = 0;
    foreach ($parents as $parent) {
        $stmtMsg->execute([$fromUserId, $parent['UserID'], $content]);
        $sentCount++;
    }
    
    echo json_encode([
        'success' => true, 
        'message' => 'Đã gửi cảnh báo thành công', 
        'sent_count' => $sentCount
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Lỗi server: ' . $e->getMessage()]);
}
