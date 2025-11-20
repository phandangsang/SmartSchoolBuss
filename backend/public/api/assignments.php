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
            // Lấy tất cả hoặc theo RouteID
            if (isset($_GET['route_id'])) {
                $stmt = $db->prepare('SELECT * FROM routeassignments WHERE RouteID = ? ORDER BY AssignedAt DESC');
                $stmt->execute([$_GET['route_id']]);
                $assignments = $stmt->fetchAll();
                echo json_encode(['success' => true, 'data' => $assignments]);
            } else {
                $stmt = $db->query('SELECT * FROM routeassignments ORDER BY AssignedAt DESC');
                $assignments = $stmt->fetchAll();
                echo json_encode(['success' => true, 'data' => $assignments]);
            }
            break;
        case 'POST':
            // Thêm mới phân công
            $routeId = $input['RouteID'] ?? null;
            $busId = $input['BusID'] ?? null;
            $driverId = $input['DriverID'] ?? null;
            $note = $input['Note'] ?? null;
            if (!$routeId || !$busId || !$driverId) {
                echo json_encode(['success' => false, 'message' => 'Thiếu thông tin phân công']);
                exit;
            }
            $stmt = $db->prepare('INSERT INTO routeassignments (RouteID, BusID, DriverID, Note) VALUES (?, ?, ?, ?)');
            $stmt->execute([$routeId, $busId, $driverId, $note]);
            echo json_encode(['success' => true, 'message' => 'Phân công thành công', 'id' => $db->lastInsertId()]);
            break;
        case 'PUT':
            // Cập nhật phân công (theo AssignmentID)
            $assignmentId = $input['AssignmentID'] ?? null;
            $routeId = $input['RouteID'] ?? null;
            $busId = $input['BusID'] ?? null;
            $driverId = $input['DriverID'] ?? null;
            $note = $input['Note'] ?? null;
            if (!$assignmentId || !$routeId || !$busId || !$driverId) {
                echo json_encode(['success' => false, 'message' => 'Thiếu thông tin cập nhật phân công']);
                exit;
            }
            $stmt = $db->prepare('UPDATE routeassignments SET RouteID=?, BusID=?, DriverID=?, Note=? WHERE AssignmentID=?');
            $stmt->execute([$routeId, $busId, $driverId, $note, $assignmentId]);
            echo json_encode(['success' => true, 'message' => 'Cập nhật phân công thành công']);
            break;
        case 'DELETE':
            // Xóa phân công
            $assignmentId = $input['AssignmentID'] ?? ($_GET['id'] ?? null);
            if (!$assignmentId) {
                echo json_encode(['success' => false, 'message' => 'Thiếu AssignmentID']);
                exit;
            }
            $stmt = $db->prepare('DELETE FROM routeassignments WHERE AssignmentID=?');
            $stmt->execute([$assignmentId]);
            echo json_encode(['success' => true, 'message' => 'Xóa phân công thành công']);
            break;
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
