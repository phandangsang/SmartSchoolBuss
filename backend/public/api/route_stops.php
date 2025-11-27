<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../vendor/autoload.php';
require_once __DIR__ . '/../../src/Database.php';

use App\Database;

try {
    $db = Database::getConnection();
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        $routeId = $_GET['route_id'] ?? null;

        if (!$routeId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Thiếu route_id']);
            exit;
        }

        // Lấy thông tin route (start và end point)
        $routeSql = "SELECT * FROM routes WHERE RouteID = ?";
        $routeStmt = $db->prepare($routeSql);
        $routeStmt->execute([$routeId]);
        $route = $routeStmt->fetch(PDO::FETCH_ASSOC);

        if (!$route) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Không tìm thấy route']);
            exit;
        }

        // Lấy danh sách điểm dừng
        $stopsSql = "SELECT * FROM routestops 
                     WHERE RouteID = ? 
                     ORDER BY StopOrder ASC";
        $stopsStmt = $db->prepare($stopsSql);
        $stopsStmt->execute([$routeId]);
        $stops = $stopsStmt->fetchAll(PDO::FETCH_ASSOC);

        // Kết hợp: StartPoint → Stops → EndPoint
        $allPoints = [];

        // 1. Thêm StartPoint
        $allPoints[] = [
            'StopID' => 'start',
            'StopName' => $route['StartPointName'],
            'Latitude' => $route['StartLatitude'],
            'Longitude' => $route['StartLongitude'],
            'StopOrder' => 0,
            'ExpectedTime' => null
        ];

        // 2. Thêm các điểm dừng
        foreach ($stops as $stop) {
            $allPoints[] = $stop;
        }

        // 3. Thêm EndPoint
        $allPoints[] = [
            'StopID' => 'end',
            'StopName' => $route['EndPointName'],
            'Latitude' => $route['EndLatitude'],
            'Longitude' => $route['EndLongitude'],
            'StopOrder' => count($stops) + 1,
            'ExpectedTime' => null
        ];

        echo json_encode([
            'success' => true,
            'data' => $allPoints
        ]);

    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Lỗi server: ' . $e->getMessage()]);
}
