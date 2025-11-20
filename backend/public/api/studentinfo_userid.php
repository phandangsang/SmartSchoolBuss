<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../src/Database.php';

use App\Database;

$userId = $_GET['user_id'] ?? null;
if (!$userId) {
    echo json_encode(['success' => false, 'message' => 'Thiếu user_id']);
    exit;
}

try {
    $db = Database::getConnection();
    // Lấy thông tin phụ huynh theo UserID
    $stmt = $db->prepare('SELECT * FROM parents WHERE UserID = ?');
    $stmt->execute([$userId]);
    $parent = $stmt->fetch();
    if (!$parent) {
        echo json_encode(['success' => false, 'message' => 'Không tìm thấy phụ huynh']);
        exit;
    }
    // Lấy thông tin user phụ huynh
    $stmt = $db->prepare('SELECT * FROM users WHERE UserID = ?');
    $stmt->execute([$userId]);
    $parentUser = $stmt->fetch();
    // Lấy học sinh của phụ huynh
    $stmt = $db->prepare('SELECT * FROM students WHERE ParentID = ?');
    $stmt->execute([$parent['ParentID']]);
    $student = $stmt->fetch();
    if (!$student) {
        echo json_encode(['success' => false, 'message' => 'Không tìm thấy học sinh']);
        exit;
    }
    // Lấy thông tin tuyến (route) của học sinh (giả sử có trường RouteID trong students)
    $route = null;
    if (isset($student['RouteID'])) {
        $stmt = $db->prepare('SELECT * FROM routes WHERE RouteID = ?');
        $stmt->execute([$student['RouteID']]);
        $route = $stmt->fetch();
    }
    // Lấy phân công xe buýt/tài xế cho tuyến
    $assignment = null;
    $bus = null;
    $driver = null;
    if ($route) {
        $stmt = $db->prepare('SELECT * FROM routeassignments WHERE RouteID = ? ORDER BY AssignedAt DESC LIMIT 1');
        $stmt->execute([$route['RouteID']]);
        $assignment = $stmt->fetch();
        if ($assignment) {
            $stmt = $db->prepare('SELECT * FROM buses WHERE BusID = ?');
            $stmt->execute([$assignment['BusID']]);
            $bus = $stmt->fetch();
            $stmt = $db->prepare('SELECT * FROM drivers WHERE DriverID = ?');
            $stmt->execute([$assignment['DriverID']]);
            $driver = $stmt->fetch();
        }
    }
    echo json_encode([
        'success' => true,
        'data' => [
            'student' => $student,
            'parent' => $parent,
            'parentUser' => $parentUser,
            'route' => $route,
            'assignment' => $assignment,
            'bus' => $bus,
            'driver' => $driver
        ]
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
