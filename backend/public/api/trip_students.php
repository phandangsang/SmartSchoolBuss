<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../src/Database.php';
require_once __DIR__ . '/../../src/Helpers.php';

use App\Database;
use App\Helpers;

$tripId = $_GET['trip_id'] ?? null;

if (!$tripId) {
    Helpers::error_response('Thiếu TripID', 400);
}

try {
    $db = Database::getConnection();
    
    // 1. Get RouteID from TripID
    // Trip -> Assignment -> Route
    $stmt = $db->prepare('
        SELECT ra.RouteID 
        FROM trips t
        JOIN routeassignments ra ON t.AssignmentID = ra.AssignmentID
        WHERE t.TripID = ?
    ');
    $stmt->execute([$tripId]);
    $route = $stmt->fetch();
    
    if (!$route) {
        Helpers::error_response('Không tìm thấy thông tin tuyến đường cho chuyến xe này', 404);
    }
    
    $routeId = $route['RouteID'];
    
    // 2. Get Students assigned to this Route với tọa độ điểm đón
    $stmt = $db->prepare('
        SELECT 
            s.StudentID, 
            s.FullName, 
            s.ClassName, 
            p.Address as PickupPoint,
            pickup.Latitude as PickupLatitude,
            pickup.Longitude as PickupLongitude,
            COALESCE(ts.Status, "waiting") as Status
        FROM students s
        LEFT JOIN parents p ON s.ParentID = p.ParentID
        LEFT JOIN routestops pickup ON s.PickupStopID = pickup.StopID
        LEFT JOIN tripstudents ts ON s.StudentID = ts.StudentID AND ts.TripID = ?
        WHERE s.RouteID = ?
    ');
    $stmt->execute([$tripId, $routeId]);
    $students = $stmt->fetchAll();
    
    Helpers::success_response($students);

} catch (PDOException $e) {
    Helpers::error_response('Lỗi server: ' . $e->getMessage(), 500);
}
