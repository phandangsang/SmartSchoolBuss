<?php
// Enable error reporting for debugging
ini_set('display_errors', 0);
error_reporting(E_ALL);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

use App\Database;
use App\Auth;

try {
    require_once __DIR__ . '/../../vendor/autoload.php';
    require_once __DIR__ . '/../../src/Database.php';
    require_once __DIR__ . '/../../src/Auth.php';

    // Verify authentication
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

    $conn = Database::getConnection();
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        $userId = $user['UserID'];
        
        $sql = "SELECT m.*, 
                u_from.FullName as FromName, u_from.Role as FromRole,
                u_to.FullName as ToName, u_to.Role as ToRole
                FROM messages m
                JOIN users u_from ON m.FromUserID = u_from.UserID
                JOIN users u_to ON m.ToUserID = u_to.UserID
                WHERE m.FromUserID = :uid1 OR m.ToUserID = :uid2
                ORDER BY m.SentAt DESC";
                
        $stmt = $conn->prepare($sql);
        $stmt->execute([':uid1' => $userId, ':uid2' => $userId]);
        $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'data' => $messages]);
    } 
    elseif ($method === 'POST') {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if (empty($data['ToUserID']) || empty($data['Content'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Missing required fields']);
            exit;
        }
        
        $fromUserId = $user['UserID'];
        $toUserId = $data['ToUserID'];
        $content = $data['Content'];
        $messageType = isset($data['MessageType']) ? $data['MessageType'] : 'TEXT';
        
        $sql = "INSERT INTO messages (FromUserID, ToUserID, Content, MessageType) VALUES (:from, :to, :content, :type)";
        $stmt = $conn->prepare($sql);
        
        $stmt->execute([
            ':from' => $fromUserId,
            ':to' => $toUserId,
            ':content' => $content,
            ':type' => $messageType
        ]);
        
        echo json_encode(['success' => true, 'message' => 'Message sent successfully', 'id' => $conn->lastInsertId()]);
    }
    else {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server Error: ' . $e->getMessage()]);
}

ob_end_flush();
