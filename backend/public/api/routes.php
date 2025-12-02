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
                $stmt = $db->prepare("SELECT RouteID, RouteName, Description, 
                    StartPointName, StartLatitude, StartLongitude,
                    EndPointName, EndLatitude, EndLongitude 
                    FROM routes WHERE RouteID = ?");
                $stmt->execute([$_GET['id']]);
                $route = $stmt->fetch();
                echo json_encode(['success' => true, 'data' => $route]);
            } else {
                $stmt = $db->query("SELECT RouteID, RouteName, Description,
                    StartPointName, StartLatitude, StartLongitude,
                    EndPointName, EndLatitude, EndLongitude 
                    FROM routes ORDER BY RouteID DESC");
                $routes = $stmt->fetchAll();
                echo json_encode(['success' => true, 'data' => $routes]);
            }
            break;

        case 'POST':
            // Nhận các trường từ frontend
            $routeName = $input['RouteName'] ?? '';
            $description = $input['Description'] ?? '';
            $startPointName = $input['StartPointName'] ?? null;
            $startLatitude = $input['StartLatitude'] ?? null;
            $startLongitude = $input['StartLongitude'] ?? null;
            $endPointName = $input['EndPointName'] ?? null;
            $endLatitude = $input['EndLatitude'] ?? null;
            $endLongitude = $input['EndLongitude'] ?? null;
            $stops = $input['stops'] ?? []; // Array of stops
            
            if (!$routeName) {
                echo json_encode(['success' => false, 'message' => 'Thiếu tên tuyến']);
                exit;
            }
            
            try {
                $db->beginTransaction();

                $stmt = $db->prepare("INSERT INTO routes (RouteName, Description, 
                    StartPointName, StartLatitude, StartLongitude,
                    EndPointName, EndLatitude, EndLongitude) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $routeName,
                    $description,
                    $startPointName,
                    $startLatitude,
                    $startLongitude,
                    $endPointName,
                    $endLatitude,
                    $endLongitude
                ]);
                
                $routeId = $db->lastInsertId();

                // Insert stops if provided
                if (!empty($stops)) {
                    $stopStmt = $db->prepare("INSERT INTO routestops (RouteID, StopName, Latitude, Longitude, StopOrder, ExpectedTime) 
                        VALUES (?, ?, ?, ?, ?, ?)");
                    
                    foreach ($stops as $index => $stop) {
                        $stopStmt->execute([
                            $routeId,
                            $stop['StopName'],
                            $stop['Latitude'],
                            $stop['Longitude'],
                            $index + 1, // StopOrder based on array index
                            $stop['ExpectedTime'] ?? null
                        ]);
                    }
                }

                $db->commit();

                echo json_encode([
                    'success' => true,
                    'message' => 'Thêm tuyến đường và điểm dừng thành công',
                    'id' => $routeId
                ]);
            } catch (Exception $e) {
                $db->rollBack();
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Lỗi khi lưu tuyến đường: ' . $e->getMessage()]);
            }
            break;

        case 'PUT':
            $routeId = $input['RouteID'] ?? $input['id'] ?? null;
            $routeName = $input['RouteName'] ?? '';
            $description = $input['Description'] ?? '';
            $startPointName = $input['StartPointName'] ?? null;
            $startLatitude = $input['StartLatitude'] ?? null;
            $startLongitude = $input['StartLongitude'] ?? null;
            $endPointName = $input['EndPointName'] ?? null;
            $endLatitude = $input['EndLatitude'] ?? null;
            $endLongitude = $input['EndLongitude'] ?? null;
            
            if (!$routeId || !$routeName) {
                echo json_encode(['success' => false, 'message' => 'Thiếu thông tin tuyến đường']);
                exit;
            }
            
            $stmt = $db->prepare("UPDATE routes SET RouteName=?, Description=?,
                StartPointName=?, StartLatitude=?, StartLongitude=?,
                EndPointName=?, EndLatitude=?, EndLongitude=?
                WHERE RouteID=?");
            $stmt->execute([
                $routeName,
                $description,
                $startPointName,
                $startLatitude,
                $startLongitude,
                $endPointName,
                $endLatitude,
                $endLongitude,
                $routeId
            ]);
            echo json_encode(['success' => true, 'message' => 'Cập nhật thành công']);
            break;

        case 'DELETE':
            $id = $_GET['id'] ?? $input['id'];
            
            try {
                $db->beginTransaction();

                // 1. Update students: Set RouteID, PickupStopID, DropoffStopID to NULL
                // Handle PickupStopID referencing stops of this route
                $stmt = $db->prepare("UPDATE students SET PickupStopID = NULL WHERE PickupStopID IN (SELECT StopID FROM routestops WHERE RouteID = ?)");
                $stmt->execute([$id]);

                // Handle DropoffStopID referencing stops of this route
                $stmt = $db->prepare("UPDATE students SET DropoffStopID = NULL WHERE DropoffStopID IN (SELECT StopID FROM routestops WHERE RouteID = ?)");
                $stmt->execute([$id]);

                // Handle RouteID
                $stmt = $db->prepare("UPDATE students SET RouteID = NULL WHERE RouteID = ?");
                $stmt->execute([$id]);

                // 1.5 Delete bus locations associated with trips of this route
                $stmt = $db->prepare("DELETE FROM buslocations WHERE TripID IN (SELECT TripID FROM trips WHERE AssignmentID IN (SELECT AssignmentID FROM routeassignments WHERE RouteID = ?))");
                $stmt->execute([$id]);

                // 2. Delete trips associated with assignments of this route
                $stmt = $db->prepare("DELETE FROM trips WHERE AssignmentID IN (SELECT AssignmentID FROM routeassignments WHERE RouteID = ?)");
                $stmt->execute([$id]);

                // 3. Delete route assignments
                $stmt = $db->prepare("DELETE FROM routeassignments WHERE RouteID = ?");
                $stmt->execute([$id]);

                // 4. Delete route stops
                $stmt = $db->prepare("DELETE FROM routestops WHERE RouteID = ?");
                $stmt->execute([$id]);

                // 5. Delete the route itself
                $stmt = $db->prepare("DELETE FROM routes WHERE RouteID=?");
                $stmt->execute([$id]);

                $db->commit();
                echo json_encode(['success' => true, 'message' => 'Xóa thành công']);
            } catch (Exception $e) {
                $db->rollBack();
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Lỗi khi xóa tuyến đường: ' . $e->getMessage()]);
            }
            break;
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
