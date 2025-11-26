<?php
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../src/Database.php';

use App\Database;

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

try {
    $db = Database::getConnection();

    switch ($method) {
        case 'GET':
            // Lấy điểm dừng theo RouteID
            if (isset($_GET['route_id'])) {
                $stmt = $db->prepare("SELECT StopID, RouteID, StopName, Latitude, Longitude, StopOrder, ExpectedTime 
                    FROM routestops WHERE RouteID = ? ORDER BY StopOrder ASC");
                $stmt->execute([$_GET['route_id']]);
                $stops = $stmt->fetchAll();
                echo json_encode(['success' => true, 'data' => $stops]);
            } 
            // Lấy một điểm dừng cụ thể
            elseif (isset($_GET['id'])) {
                $stmt = $db->prepare("SELECT StopID, RouteID, StopName, Latitude, Longitude, StopOrder, ExpectedTime 
                    FROM routestops WHERE StopID = ?");
                $stmt->execute([$_GET['id']]);
                $stop = $stmt->fetch();
                echo json_encode(['success' => true, 'data' => $stop]);
            } 
            // Lấy tất cả điểm dừng
            else {
                $stmt = $db->query("SELECT StopID, RouteID, StopName, Latitude, Longitude, StopOrder, ExpectedTime 
                    FROM routestops ORDER BY RouteID, StopOrder");
                $stops = $stmt->fetchAll();
                echo json_encode(['success' => true, 'data' => $stops]);
            }
            break;

        case 'POST':
            // Thêm điểm dừng mới
            $routeId = $input['RouteID'] ?? null;
            $stopName = $input['StopName'] ?? '';
            $latitude = $input['Latitude'] ?? null;
            $longitude = $input['Longitude'] ?? null;
            $stopOrder = $input['StopOrder'] ?? null;
            $expectedTime = $input['ExpectedTime'] ?? null;

            if (!$routeId || !$stopName || !$latitude || !$longitude) {
                echo json_encode(['success' => false, 'message' => 'Thiếu thông tin điểm dừng']);
                exit;
            }

            // Nếu không có StopOrder, tự động lấy số thứ tự tiếp theo
            if (!$stopOrder) {
                $stmt = $db->prepare("SELECT MAX(StopOrder) as maxOrder FROM routestops WHERE RouteID = ?");
                $stmt->execute([$routeId]);
                $result = $stmt->fetch();
                $stopOrder = ($result['maxOrder'] ?? 0) + 1;
            }

            $stmt = $db->prepare("INSERT INTO routestops (RouteID, StopName, Latitude, Longitude, StopOrder, ExpectedTime) 
                VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $routeId,
                $stopName,
                $latitude,
                $longitude,
                $stopOrder,
                $expectedTime
            ]);

            echo json_encode([
                'success' => true,
                'message' => 'Thêm điểm dừng thành công',
                'id' => $db->lastInsertId()
            ]);
            break;

        case 'PUT':
            // Cập nhật điểm dừng
            $stopId = $input['StopID'] ?? $input['id'] ?? null;
            $stopName = $input['StopName'] ?? '';
            $latitude = $input['Latitude'] ?? null;
            $longitude = $input['Longitude'] ?? null;
            $stopOrder = $input['StopOrder'] ?? null;
            $expectedTime = $input['ExpectedTime'] ?? null;

            if (!$stopId || !$stopName) {
                echo json_encode(['success' => false, 'message' => 'Thiếu thông tin điểm dừng']);
                exit;
            }

            $stmt = $db->prepare("UPDATE routestops SET StopName=?, Latitude=?, Longitude=?, StopOrder=?, ExpectedTime=? 
                WHERE StopID=?");
            $stmt->execute([
                $stopName,
                $latitude,
                $longitude,
                $stopOrder,
                $expectedTime,
                $stopId
            ]);

            echo json_encode(['success' => true, 'message' => 'Cập nhật điểm dừng thành công']);
            break;

        case 'DELETE':
            // Xóa điểm dừng
            $id = $_GET['id'] ?? $input['id'] ?? null;
            
            if (!$id) {
                echo json_encode(['success' => false, 'message' => 'Thiếu ID điểm dừng']);
                exit;
            }

            $stmt = $db->prepare("DELETE FROM routestops WHERE StopID=?");
            $stmt->execute([$id]);

            echo json_encode(['success' => true, 'message' => 'Xóa điểm dừng thành công']);
            break;

        default:
            echo json_encode(['success' => false, 'message' => 'Phương thức không được hỗ trợ']);
            break;
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
