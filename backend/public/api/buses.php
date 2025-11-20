<?php
// CORS headers
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
            if (isset($_GET['id'])) {
                // Lấy 1 xe buýt theo ID
                $stmt = $db->prepare("SELECT * FROM buses WHERE BusID = ?");
                $stmt->execute([$_GET['id']]);
                $bus = $stmt->fetch();
                echo json_encode(['success' => true, 'data' => $bus]);
            } else {
                // Lấy tất cả xe buýt
                $stmt = $db->query("SELECT * FROM buses ORDER BY BusID DESC");
                $buses = $stmt->fetchAll();
                echo json_encode(['success' => true, 'data' => $buses]);
            }
            break;

        case 'POST':
            // Thêm xe buýt mới
            $plateNumber = $input['PlateNumber'] ?? $input['plateNumber'] ?? null;
            $capacity = $input['Capacity'] ?? $input['capacity'] ?? $input['seats'] ?? null;
            $status = $input['Status'] ?? $input['status'] ?? 'active';
            if (!$plateNumber || !$capacity) {
                echo json_encode(['success' => false, 'message' => 'Thiếu thông tin xe buýt']);
                exit;
            }
            $stmt = $db->prepare("INSERT INTO buses (PlateNumber, Capacity, Status) VALUES (?, ?, ?)");
            $stmt->execute([
                $plateNumber,
                $capacity,
                $status
            ]);
            echo json_encode([
                'success' => true,
                'message' => 'Thêm xe buýt thành công',
                'id' => $db->lastInsertId()
            ]);
            break;

        case 'PUT':
            // Cập nhật xe buýt
            $plateNumber = $input['PlateNumber'] ?? $input['plateNumber'] ?? null;
            $capacity = $input['Capacity'] ?? $input['capacity'] ?? $input['seats'] ?? null;
            $status = $input['Status'] ?? $input['status'] ?? null;
            $busId = $input['BusID'] ?? $input['id'] ?? null;
            if (!$plateNumber || !$capacity || !$busId) {
                echo json_encode(['success' => false, 'message' => 'Thiếu thông tin xe buýt']);
                exit;
            }
            $stmt = $db->prepare("UPDATE buses SET PlateNumber=?, Capacity=?, Status=? WHERE BusID=?");
            $stmt->execute([
                $plateNumber,
                $capacity,
                $status,
                $busId
            ]);
            echo json_encode(['success' => true, 'message' => 'Cập nhật thành công']);
            break;

        case 'DELETE':
            // Xóa xe buýt
            $id = $_GET['id'] ?? $input['id'];
            $stmt = $db->prepare("DELETE FROM buses WHERE BusID=?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true, 'message' => 'Xóa thành công']);
            break;

        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
