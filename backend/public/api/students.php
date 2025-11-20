
<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
require_once __DIR__ . '/../../src/Database.php';
require_once __DIR__ . '/../../src/Helpers.php';

use App\Database;
use App\Helpers;

$pdo = Database::getConnection();

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data || !isset($data['id'])) {
        Helpers::error_response('Thiếu dữ liệu đầu vào', 400);
    }
    try {
        $stmt = $pdo->prepare('DELETE FROM students WHERE StudentID = ?');
        $stmt->execute([$data['id']]);
        Helpers::success_response(['message' => 'Xóa học sinh thành công']);
    } catch (Exception $e) {
        Helpers::error_response('Lỗi xóa học sinh: ' . $e->getMessage(), 500);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    // Nhận dữ liệu JSON
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data || !isset($data['StudentID'], $data['FullName'], $data['ClassName'], $data['SchoolName'], $data['ParentID'])) {
        Helpers::error_response('Thiếu dữ liệu đầu vào', 400);
    }
    try {
        $stmt = $pdo->prepare('UPDATE students SET FullName = ?, ClassName = ?, SchoolName = ?, ParentID = ? WHERE StudentID = ?');
        $stmt->execute([
            $data['FullName'],
            $data['ClassName'],
            $data['SchoolName'],
            $data['ParentID'],
            $data['StudentID']
        ]);
        Helpers::success_response(['message' => 'Cập nhật học sinh thành công']);
    } catch (Exception $e) {
        Helpers::error_response('Lỗi cập nhật học sinh: ' . $e->getMessage(), 500);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Nhận dữ liệu JSON
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data || !isset($data['FullName'], $data['ClassName'], $data['SchoolName'], $data['ParentID'])) {
        Helpers::error_response('Thiếu dữ liệu đầu vào', 400);
    }
    try {
        $stmt = $pdo->prepare('INSERT INTO students (FullName, ClassName, SchoolName, ParentID) VALUES (?, ?, ?, ?)');
        $stmt->execute([
            $data['FullName'],
            $data['ClassName'],
            $data['SchoolName'],
            $data['ParentID']
        ]);
        Helpers::success_response(['message' => 'Thêm học sinh thành công']);
    } catch (Exception $e) {
        Helpers::error_response('Lỗi thêm học sinh: ' . $e->getMessage(), 500);
    }
    exit;
}

try {
    $stmt = $pdo->query('SELECT * FROM students');
    $students = $stmt->fetchAll();
    Helpers::success_response($students);
} catch (Exception $e) {
    Helpers::error_response('Lỗi truy vấn học sinh: ' . $e->getMessage(), 500);
}
