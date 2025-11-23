<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../vendor/autoload.php';
require_once __DIR__ . '/../../src/Database.php';
require_once __DIR__ . '/../../src/Helpers.php';
require_once __DIR__ . '/../../src/Auth.php';

use App\Database;
use App\Helpers;
use App\Auth;

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

    // --- Gửi thông báo cho phụ huynh ---
    // Lấy thông tin học sinh và UserID của phụ huynh
    $stmt = $db->prepare('SELECT s.FullName, p.UserID as ParentUserID 
                          FROM students s 
                          JOIN parents p ON s.ParentID = p.ParentID 
                          WHERE s.StudentID = ?');
    $stmt->execute([$studentId]);
    $studentInfo = $stmt->fetch();

    if ($studentInfo && $studentInfo['ParentUserID']) {
        $studentName = $studentInfo['FullName'];
        $parentUserId = $studentInfo['ParentUserID'];
        
        $statusText = '';
        if ($status === 'picked') $statusText = 'đã được đón';
        elseif ($status === 'dropped') $statusText = 'đã được trả';
        elseif ($status === 'absent') $statusText = 'vắng mặt';
        
        if ($statusText) {
            $content = "Học sinh $studentName $statusText ";
            
            // Xác định người gửi (Tài xế)
            $fromUserId = 1; // Default to Admin
            
            // 1. Thử lấy từ token
            $user = Auth::get_current_user_from_token();
            if ($user) {
                $fromUserId = $user['UserID'];
            } else {
                 // 2. Nếu không có token, thử lấy từ Trip -> Driver
                 $stmtDriver = $db->prepare('
                    SELECT d.UserID 
                    FROM trips t 
                    JOIN routeassignments ra ON t.AssignmentID = ra.AssignmentID 
                    JOIN drivers d ON ra.DriverID = d.DriverID 
                    WHERE t.TripID = ?
                 ');
                 $stmtDriver->execute([$tripId]);
                 $driver = $stmtDriver->fetch();
                 if ($driver) $fromUserId = $driver['UserID'];
            }

            // Insert tin nhắn thông báo
            $stmtMsg = $db->prepare('INSERT INTO messages (FromUserID, ToUserID, Content, MessageType, SentAt) VALUES (?, ?, ?, "NOTIFICATION", NOW())');
            $stmtMsg->execute([$fromUserId, $parentUserId, $content]);
        }
    }
    // -----------------------------------

    Helpers::success_response(['message' => 'Cập nhật trạng thái thành công']);

} catch (PDOException $e) {
    Helpers::error_response('Lỗi server: ' . $e->getMessage(), 500);
}
