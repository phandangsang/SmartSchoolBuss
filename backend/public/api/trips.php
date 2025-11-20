<?php
header('Access-Control-Allow-Origin: *');
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
            if (isset($_GET['id'])) {
                $stmt = $db->prepare('
                    SELECT t.*, r.RouteName, b.PlateNumber, d.FullName as DriverName
                    FROM trips t
                    LEFT JOIN routeassignments a ON t.AssignmentID = a.AssignmentID
                    LEFT JOIN routes r ON a.RouteID = r.RouteID
                    LEFT JOIN buses b ON a.BusID = b.BusID
                    LEFT JOIN drivers d ON a.DriverID = d.DriverID
                    WHERE t.TripID = ?
                ');
                $stmt->execute([$_GET['id']]);
                $trip = $stmt->fetch();
                echo json_encode(['success' => true, 'data' => $trip]);
            } else {
                $stmt = $db->query('
                    SELECT t.*, r.RouteName, b.PlateNumber, d.FullName as DriverName
                    FROM trips t
                    LEFT JOIN routeassignments a ON t.AssignmentID = a.AssignmentID
                    LEFT JOIN routes r ON a.RouteID = r.RouteID
                    LEFT JOIN buses b ON a.BusID = b.BusID
                    LEFT JOIN drivers d ON a.DriverID = d.DriverID
                    ORDER BY t.StartTime DESC
                ');
                $trips = $stmt->fetchAll();
                echo json_encode(['success' => true, 'data' => $trips]);
            }
            break;
        case 'POST':
            $assignmentId = $input['AssignmentID'] ?? null;
            $startTime = $input['StartTime'] ?? null;
            $endTime = $input['EndTime'] ?? null;
            $status = $input['Status'] ?? 'SCHEDULED';
            if (!$assignmentId || !$startTime) {
                echo json_encode(['success' => false, 'message' => 'Thiếu thông tin lịch trình']);
                exit;
            }
            $stmt = $db->prepare('INSERT INTO trips (AssignmentID, StartTime, EndTime, Status) VALUES (?, ?, ?, ?)');
            $stmt->execute([$assignmentId, $startTime, $endTime, $status]);
            echo json_encode(['success' => true, 'message' => 'Thêm lịch trình thành công', 'id' => $db->lastInsertId()]);
            break;
        case 'PUT':
            $tripId = $input['TripID'] ?? $input['id'] ?? null;
            $assignmentId = $input['AssignmentID'] ?? null;
            $startTime = $input['StartTime'] ?? null;
            $endTime = $input['EndTime'] ?? null;
            $status = $input['Status'] ?? null;
            if (!$tripId || !$assignmentId || !$startTime) {
                echo json_encode(['success' => false, 'message' => 'Thiếu thông tin cập nhật lịch trình']);
                exit;
            }
            $stmt = $db->prepare('UPDATE trips SET AssignmentID=?, StartTime=?, EndTime=?, Status=? WHERE TripID=?');
            $stmt->execute([$assignmentId, $startTime, $endTime, $status, $tripId]);
            echo json_encode(['success' => true, 'message' => 'Cập nhật lịch trình thành công']);
            break;
        case 'DELETE':
            $tripId = $_GET['id'] ?? $input['id'] ?? null;
            if (!$tripId) {
                echo json_encode(['success' => false, 'message' => 'Thiếu TripID']);
                exit;
            }
            $stmt = $db->prepare('DELETE FROM trips WHERE TripID=?');
            $stmt->execute([$tripId]);
            echo json_encode(['success' => true, 'message' => 'Xóa lịch trình thành công']);
            break;
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
