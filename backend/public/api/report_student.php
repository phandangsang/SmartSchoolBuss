<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
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

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['TripID']) || !isset($input['StudentID']) || !isset($input['Status'])) {
    Helpers::error_response('Thiếu thông tin bắt buộc', 400);
}

$tripId = $input['TripID'];
$studentId = $input['StudentID'];
$status = $input['Status'];

// Validate status
$allowedStatus = ['waiting', 'picked', 'dropped', 'absent'];
if (!in_array($status, $allowedStatus)) {
    Helpers::error_response('Trạng thái không hợp lệ', 400);
}

try {
    $db = Database::getConnection();

    // Check if record exists
    $stmt = $db->prepare('SELECT TripStudentID FROM tripstudents WHERE TripID = ? AND StudentID = ?');
    $stmt->execute([$tripId, $studentId]);
    $existing = $stmt->fetch();

    if ($existing) {
        // Update
        $stmt = $db->prepare('UPDATE tripstudents SET Status = ?, UpdatedTime = NOW() WHERE TripStudentID = ?');
        $stmt->execute([$status, $existing['TripStudentID']]);
    } else {
        // Insert - explicitly set PickupStopID and DropoffStopID to NULL
        $stmt = $db->prepare('INSERT INTO tripstudents (TripID, StudentID, PickupStopID, DropoffStopID, Status, UpdatedTime) VALUES (?, ?, NULL, NULL, ?, NOW())');
        $stmt->execute([$tripId, $studentId, $status]);
    }

    Helpers::success_response(['message' => 'Cập nhật trạng thái thành công']);

} catch (PDOException $e) {
    Helpers::error_response('Lỗi server: ' . $e->getMessage(), 500);
}
