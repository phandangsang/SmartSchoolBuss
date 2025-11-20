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
            if (isset($_GET['id'])) {
                $stmt = $db->prepare("SELECT RouteID, RouteName, Description FROM routes WHERE RouteID = ?");
                $stmt->execute([$_GET['id']]);
                $route = $stmt->fetch();
                echo json_encode(['success' => true, 'data' => $route]);
            } else {
                $stmt = $db->query("SELECT RouteID, RouteName, Description FROM routes ORDER BY RouteID DESC");
                $routes = $stmt->fetchAll();
                echo json_encode(['success' => true, 'data' => $routes]);
            }
            break;

        case 'POST':
            // Nhận các trường RouteID, RouteName, Description từ frontend
            $routeName = $input['RouteName'] ?? '';
            $description = $input['Description'] ?? '';
            if (!$routeName) {
                echo json_encode(['success' => false, 'message' => 'Thiếu tên tuyến']);
                exit;
            }
            $stmt = $db->prepare("INSERT INTO routes (RouteName, Description) VALUES (?, ?)");
            $stmt->execute([
                $routeName,
                $description
            ]);
            echo json_encode([
                'success' => true,
                'message' => 'Thêm tuyến đường thành công',
                'id' => $db->lastInsertId()
            ]);
            break;

        case 'PUT':
            $routeId = $input['RouteID'] ?? $input['id'] ?? null;
            $routeName = $input['RouteName'] ?? '';
            $description = $input['Description'] ?? '';
            if (!$routeId || !$routeName) {
                echo json_encode(['success' => false, 'message' => 'Thiếu thông tin tuyến đường']);
                exit;
            }
            $stmt = $db->prepare("UPDATE routes SET RouteName=?, Description=? WHERE RouteID=?");
            $stmt->execute([
                $routeName,
                $description,
                $routeId
            ]);
            echo json_encode(['success' => true, 'message' => 'Cập nhật thành công']);
            break;

        case 'DELETE':
            $id = $_GET['id'] ?? $input['id'];
            $stmt = $db->prepare("DELETE FROM routes WHERE RouteID=?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true, 'message' => 'Xóa thành công']);
            break;
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
