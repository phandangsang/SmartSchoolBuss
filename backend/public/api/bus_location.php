<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
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
    $db = Database::getConnection();
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'POST') {
        // Lưu vị trí xe buýt (chỉ tài xế)
        $user = Auth::get_current_user_from_token();
        
        // Fallback authentication
        if (!$user) {
            $headers = function_exists('apache_request_headers') ? apache_request_headers() : $_SERVER;
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
        
        // if (!$user || strtolower($user['Role']) !== 'driver') {
        //     http_response_code(401);
        //     echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        //     exit;
        // }

        $input = json_decode(file_get_contents('php://input'), true);
        
        if (empty($input['busId']) || !isset($input['latitude']) || !isset($input['longitude'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Thiếu thông tin bắt buộc']);
            exit;
        }

        $busId = $input['busId'];
        $tripId = $input['tripId'] ?? null;
        $latitude = $input['latitude'];
        $longitude = $input['longitude'];
        $speed = $input['speed'] ?? null;
        $heading = $input['heading'] ?? null;

        $sql = "INSERT INTO buslocations (TripID, BusID, Latitude, Longitude, Speed, Heading, RecordedAt) 
                VALUES (?, ?, ?, ?, ?, ?, NOW())";
        
        $stmt = $db->prepare($sql);
        $stmt->execute([$tripId, $busId, $latitude, $longitude, $speed, $heading]);

        echo json_encode([
            'success' => true,
            'message' => 'Đã cập nhật vị trí',
            'location_id' => $db->lastInsertId()
        ]);

    } elseif ($method === 'GET') {
        // Lấy vị trí xe buýt mới nhất
        $busId = $_GET['bus_id'] ?? null;
        $tripId = $_GET['trip_id'] ?? null;

        if (!$busId && !$tripId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Cần bus_id hoặc trip_id']);
            exit;
        }

        $sql = "SELECT * FROM buslocations WHERE ";
        $params = [];
        
        if ($busId) {
            $sql .= "BusID = ? ";
            $params[] = $busId;
        } else {
            $sql .= "TripID = ? ";
            $params[] = $tripId;
        }
        
        // $sql .= "AND RecordedAt >= DATE_SUB(NOW(), INTERVAL 5 MINUTE) ";
        $sql .= "ORDER BY RecordedAt DESC LIMIT 1";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $location = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($location) {
            echo json_encode([
                'success' => true,
                'data' => $location
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Không tìm thấy vị trí gần đây'
            ]);
        }

    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Lỗi server: ' . $e->getMessage()]);
}
