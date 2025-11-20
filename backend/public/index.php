<?php
require __DIR__ . '/../vendor/autoload.php';
// Load .env file
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();


// Simple .env loader (reads .env in project root)
function load_dotenv($path)
{
    $file = rtrim($path, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . '.env';
    if (!file_exists($file)) return;
    $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        [$key, $val] = array_map('trim', explode('=', $line, 2) + [1 => '']);
        $val = trim($val, "\"'");
        if ($key) putenv("$key=$val");
    }
}

load_dotenv(__DIR__ . '/..');

use App\Database;
use App\Helpers;
use App\Auth;

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Basic CORS
header('Access-Control-Allow-Origin: ' . (getenv('CORS_ORIGINS') ?: '*'));
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
if ($method === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Simple router
if ($uri === '/health' && $method === 'GET') {
    Helpers::success_response(['status' => 'healthy'], 'OK');
}

if ($uri === '/' && $method === 'GET') {
    Helpers::success_response(['name' => 'Smart School Bus API (PHP)', 'version' => '0.1'], 'OK');
}

// Auth: /api/auth/login
if ($uri === '/api/auth/login' && $method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input) || empty($input['username']) || empty($input['password'])) {
        Helpers::error_response('username and password are required', 400);
    }

    try {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare('SELECT UserID, Username, PasswordHash, FullName, Role, IsActive FROM Users WHERE Username = :u');
        $stmt->execute([':u' => $input['username']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$user) {
            Helpers::error_response('Invalid username or password', 401);
        }

        $passwordHash = $user['PasswordHash'] ?? '';
        $passwordValid = false;
        // Try PHP password_verify (bcrypt) or fallback to plain compare
        if (function_exists('password_verify') && strlen($passwordHash) > 0) {
            try {
                $passwordValid = password_verify($input['password'], $passwordHash);
            } catch (Exception $e) {
                $passwordValid = ($input['password'] === $passwordHash);
            }
        } else {
            $passwordValid = ($input['password'] === $passwordHash);
        }

        if (!$passwordValid) {
            Helpers::error_response('Invalid username or password', 401);
        }

        if (!$user['IsActive']) {
            Helpers::error_response('Account is inactive', 403);
        }

        $token = Auth::create_jwt($user['UserID']);
        Helpers::success_response(['access_token' => $token, 'user' => ['id' => $user['UserID'], 'username' => $user['Username'], 'full_name' => $user['FullName'], 'role' => strtolower($user['Role'])]], 'Login successful');
    } catch (Exception $e) {
        Helpers::error_response('Login failed: ' . $e->getMessage(), 500);
    }
}

// Auth: /api/auth/register
if ($uri === '/api/auth/register' && $method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $required = ['username', 'password', 'full_name', 'phone', 'role'];
    foreach ($required as $r) {
        if (empty($input[$r])) Helpers::error_response("Field '$r' is required", 400);
    }

    try {
        // Check existing username
        if (Auth::get_user_by_username($input['username'])) {
            Helpers::error_response('Username already exists', 400);
        }

        // Check existing phone
        $pdo = Database::getConnection();
        $s = $pdo->prepare('SELECT UserID FROM Users WHERE Phone = :ph');
        $s->execute([':ph' => $input['phone']]);
        if ($s->fetch(PDO::FETCH_ASSOC)) {
            Helpers::error_response('Phone number already exists', 400);
        }

        // Validate role
        $role = strtolower($input['role']);
        if (!in_array($role, ['parent', 'driver'])) {
            Helpers::error_response('Invalid role. Must be parent or driver', 400);
        }

        // Create user
        $created = Auth::create_user([
            'username' => $input['username'],
            'password' => $input['password'],
            'full_name' => $input['full_name'],
            'phone' => $input['phone'],
            'email' => $input['email'] ?? '',
            'role' => $role,
            'is_active' => 1
        ]);

        if (!$created) Helpers::error_response('Failed to create user', 500);

        // Create role-specific profile
        if ($role === 'driver') {
            $stmt = $pdo->prepare('INSERT INTO Drivers (UserID, FullName, Phone, LicenseNumber, Status) VALUES (:uid, :fn, :ph, :lic, :st)');
            $stmt->execute([':uid' => $created['UserID'], ':fn' => $created['FullName'] ?? $input['full_name'], ':ph' => $created['Phone'] ?? $input['phone'], ':lic' => $input['license_number'] ?? '', ':st' => 'ACTIVE']);
        } else {
            $stmt = $pdo->prepare('INSERT INTO Parents (UserID, FullName, Phone, Email, Address) VALUES (:uid, :fn, :ph, :em, :ad)');
            $stmt->execute([':uid' => $created['UserID'], ':fn' => $created['FullName'] ?? $input['full_name'], ':ph' => $created['Phone'] ?? $input['phone'], ':em' => $created['Email'] ?? $input['email'] ?? '', ':ad' => $input['address'] ?? '']);
        }

        Helpers::success_response(['user' => ['id' => $created['UserID'], 'username' => $created['Username'], 'full_name' => $created['FullName'] ?? $input['full_name'], 'role' => $role]], 'Registration successful', 201);
    } catch (Exception $e) {
        Helpers::error_response('Registration failed: ' . $e->getMessage(), 500);
    }
}

// Auth: /api/auth/change-password
if ($uri === '/api/auth/change-password' && $method === 'POST') {
    $decodedUser = Auth::get_current_user_from_token();
    if (!$decodedUser) Helpers::error_response('Invalid or missing token', 401);

    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input) || empty($input['current_password']) || empty($input['new_password'])) {
        Helpers::error_response('current_password and new_password are required', 400);
    }

    try {
        $res = Auth::change_password($decodedUser['UserID'], $input['current_password'], $input['new_password']);
        if (!$res['ok']) Helpers::error_response($res['message'] ?? 'Failed to change password', 400);
        Helpers::success_response(null, 'Password changed successfully');
    } catch (Exception $e) {
        Helpers::error_response('Failed to change password: ' . $e->getMessage(), 500);
    }
}

// Auth: /api/auth/me
if ($uri === '/api/auth/me' && $method === 'GET') {
    $decoded = Auth::verify_jwt();
    if (!$decoded) Helpers::error_response('Invalid or missing token', 401);
    $userId = $decoded->sub ?? null;
    if (!$userId) Helpers::error_response('Invalid token payload', 401);
    try {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare('SELECT UserID, Username, FullName, Role, Email, Phone, IsActive, CreatedAt FROM Users WHERE UserID = :id');
        $stmt->execute([':id' => $userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$user) Helpers::error_response('User not found', 404);
        Helpers::success_response(['id' => $user['UserID'], 'username' => $user['Username'], 'full_name' => $user['FullName'], 'email' => $user['Email'], 'phone' => $user['Phone'], 'role' => strtolower($user['Role']), 'is_active' => (bool)$user['IsActive']], 'OK');
    } catch (Exception $e) {
        Helpers::error_response('Failed to fetch user: ' . $e->getMessage(), 500);
    }
}

// -----------------------
// Admin routes
// -----------------------
if (strpos($uri, '/api/admin') === 0) {
    // require admin role
    $current = Auth::get_current_user_from_token();
    if (!$current) Helpers::error_response('Unauthorized', 401);
    if (strtolower($current['Role'] ?? '') !== 'admin') Helpers::error_response('Forbidden', 403);

    // /api/admin/dashboard
    if ($uri === '/api/admin/dashboard' && $method === 'GET') {
        try {
            $pdo = Database::getConnection();
            $counts = [];
            $tables = ['Users', 'Drivers', 'Parents', 'Students', 'Buses', 'Routes', 'Trips', 'BusLocations'];
            foreach ($tables as $t) {
                $s = $pdo->prepare("SELECT COUNT(*) AS c FROM $t");
                $s->execute();
                $r = $s->fetch(PDO::FETCH_ASSOC);
                $counts[strtolower($t)] = (int)($r['c'] ?? 0);
            }
            // active buses
            $s = $pdo->prepare("SELECT COUNT(*) AS c FROM Buses WHERE Status = 'ACTIVE'");
            $s->execute();
            $r = $s->fetch(PDO::FETCH_ASSOC);
            $counts['active_buses'] = (int)($r['c'] ?? 0);

            Helpers::success_response($counts);
        } catch (Exception $e) {
            Helpers::error_response('Failed to get dashboard: ' . $e->getMessage(), 500);
        }
    }

    // /api/admin/users
    if ($uri === '/api/admin/users' && $method === 'GET') {
        try {
            $pdo = Database::getConnection();
            $s = $pdo->prepare('SELECT UserID AS id, Username AS username, FullName AS full_name, Phone AS phone, Email AS email, Role AS role, IsActive AS is_active FROM Users');
            $s->execute();
            $rows = $s->fetchAll(PDO::FETCH_ASSOC);
            Helpers::success_response($rows);
        } catch (Exception $e) {
            Helpers::error_response('Failed to list users: ' . $e->getMessage(), 500);
        }
    }

    // STUDENTS collection: GET / POST
    if ($uri === '/api/admin/students' && $method === 'GET') {
        try {
            $pdo = Database::getConnection();
            $s = $pdo->prepare('SELECT StudentID AS id, FullName AS full_name, DateOfBirth AS date_of_birth, ClassName AS class_name, SchoolName AS school_name, ParentID AS parent_id, IsActive AS is_active FROM Students');
            $s->execute();
            Helpers::success_response($s->fetchAll(PDO::FETCH_ASSOC));
        } catch (Exception $e) {
            Helpers::error_response('Failed to get students: ' . $e->getMessage(), 500);
        }
    }

    if ($uri === '/api/admin/students' && $method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $required = ['full_name', 'parent_id'];
        foreach ($required as $r) if (empty($input[$r])) Helpers::error_response("Field $r required", 400);
        try {
            $pdo = Database::getConnection();
            // ensure parent exists
            $p = $pdo->prepare('SELECT ParentID FROM Parents WHERE ParentID = :id');
            $p->execute([':id' => $input['parent_id']]);
            if (!$p->fetch(PDO::FETCH_ASSOC)) Helpers::error_response('Parent not found', 404);
            $stmt = $pdo->prepare('INSERT INTO Students (FullName, DateOfBirth, ClassName, SchoolName, ParentID, IsActive) VALUES (:fn, :dob, :cn, :sn, :pid, :ia)');
            $stmt->execute([':fn' => $input['full_name'], ':dob' => $input['date_of_birth'] ?? null, ':cn' => $input['class_name'] ?? null, ':sn' => $input['school_name'] ?? null, ':pid' => $input['parent_id'], ':ia' => isset($input['is_active']) ? (int)$input['is_active'] : 1]);
            Helpers::success_response(['id' => $pdo->lastInsertId()], 'Student created', 201);
        } catch (Exception $e) {
            Helpers::error_response('Failed to create student: ' . $e->getMessage(), 500);
        }
    }

    // STUDENT item: PUT / DELETE
    if (preg_match('#^/api/admin/students/(\d+)$#', $uri, $m)) {
        $studentId = (int)$m[1];
        if ($method === 'PUT') {
            $input = json_decode(file_get_contents('php://input'), true);
            try {
                $pdo = Database::getConnection();
                $fields = [];
                $params = [':id' => $studentId];
                if (isset($input['full_name'])) {
                    $fields[] = 'FullName=:fn';
                    $params[':fn'] = $input['full_name'];
                }
                if (isset($input['date_of_birth'])) {
                    $fields[] = 'DateOfBirth=:dob';
                    $params[':dob'] = $input['date_of_birth'];
                }
                if (isset($input['class_name'])) {
                    $fields[] = 'ClassName=:cn';
                    $params[':cn'] = $input['class_name'];
                }
                if (isset($input['school_name'])) {
                    $fields[] = 'SchoolName=:sn';
                    $params[':sn'] = $input['school_name'];
                }
                if (isset($input['parent_id'])) {
                    $fields[] = 'ParentID=:pid';
                    $params[':pid'] = $input['parent_id'];
                }
                if (isset($input['is_active'])) {
                    $fields[] = 'IsActive=:ia';
                    $params[':ia'] = (int)$input['is_active'];
                }
                if (empty($fields)) Helpers::error_response('No fields to update', 400);
                $sql = 'UPDATE Students SET ' . implode(',', $fields) . ' WHERE StudentID=:id';
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                Helpers::success_response(null, 'Student updated');
            } catch (Exception $e) {
                Helpers::error_response('Failed to update student: ' . $e->getMessage(), 500);
            }
        }
        if ($method === 'DELETE') {
            try {
                $pdo = Database::getConnection();
                $s = $pdo->prepare('DELETE FROM Students WHERE StudentID=:id');
                $s->execute([':id' => $studentId]);
                Helpers::success_response(null, 'Student deleted');
            } catch (Exception $e) {
                Helpers::error_response('Failed to delete student: ' . $e->getMessage(), 500);
            }
        }
    }

    // DRIVERS collection: GET / POST
    if ($uri === '/api/admin/drivers' && $method === 'GET') {
        try {
            $pdo = Database::getConnection();
            $s = $pdo->prepare('SELECT DriverID AS id, UserID AS user_id, FullName AS full_name, Phone AS phone, LicenseNumber AS license_number, Status AS status FROM Drivers');
            $s->execute();
            Helpers::success_response($s->fetchAll(PDO::FETCH_ASSOC));
        } catch (Exception $e) {
            Helpers::error_response('Failed to get drivers: ' . $e->getMessage(), 500);
        }
    }
    if ($uri === '/api/admin/drivers' && $method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        if (empty($input['full_name']) || empty($input['phone'])) Helpers::error_response('full_name and phone required', 400);
        try {
            $pdo = Database::getConnection();
            $s = $pdo->prepare('INSERT INTO Drivers (FullName,Phone,LicenseNumber,Status) VALUES (:fn,:ph,:lic,:st)');
            $s->execute([':fn' => $input['full_name'], ':ph' => $input['phone'], ':lic' => $input['license_number'] ?? '', ':st' => $input['status'] ?? 'ACTIVE']);
            Helpers::success_response(['id' => $pdo->lastInsertId()], 'Driver created', 201);
        } catch (Exception $e) {
            Helpers::error_response('Failed to create driver: ' . $e->getMessage(), 500);
        }
    }
    // driver item PUT/DELETE
    if (preg_match('#^/api/admin/drivers/(\d+)$#', $uri, $m)) {
        $id = (int)$m[1];
        if ($method === 'PUT') {
            $input = json_decode(file_get_contents('php://input'), true);
            try {
                $pdo = Database::getConnection();
                $fields = [];
                $params = [':id' => $id];
                if (isset($input['full_name'])) {
                    $fields[] = 'FullName=:fn';
                    $params[':fn'] = $input['full_name'];
                }
                if (isset($input['phone'])) {
                    $fields[] = 'Phone=:ph';
                    $params[':ph'] = $input['phone'];
                }
                if (isset($input['license_number'])) {
                    $fields[] = 'LicenseNumber=:lic';
                    $params[':lic'] = $input['license_number'];
                }
                if (isset($input['status'])) {
                    $fields[] = 'Status=:st';
                    $params[':st'] = $input['status'];
                }
                if (empty($fields)) Helpers::error_response('No fields', 400);
                $sql = 'UPDATE Drivers SET ' . implode(',', $fields) . ' WHERE DriverID=:id';
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                Helpers::success_response(null, 'Driver updated');
            } catch (Exception $e) {
                Helpers::error_response('Failed: ' . $e->getMessage(), 500);
            }
        }
        if ($method === 'DELETE') {
            try {
                $pdo = Database::getConnection();
                $s = $pdo->prepare('DELETE FROM Drivers WHERE DriverID=:id');
                $s->execute([':id' => $id]);
                Helpers::success_response(null, 'Driver deleted');
            } catch (Exception $e) {
                Helpers::error_response('Failed: ' . $e->getMessage(), 500);
            }
        }
    }

    // PARENTS get / update / delete
    if ($uri === '/api/admin/parents' && $method === 'GET') {
        try {
            $pdo = Database::getConnection();
            $s = $pdo->prepare('SELECT ParentID AS id, UserID AS user_id, FullName AS full_name, Phone AS phone, Email AS email, Address AS address FROM Parents');
            $s->execute();
            Helpers::success_response($s->fetchAll(PDO::FETCH_ASSOC));
        } catch (Exception $e) {
            Helpers::error_response('Failed: ' . $e->getMessage(), 500);
        }
    }

    if (preg_match('#^/api/admin/parents/(\d+)$#', $uri, $m)) {
        $id = (int)$m[1];
        if ($method === 'PUT') {
            $input = json_decode(file_get_contents('php://input'), true);
            try {
                $pdo = Database::getConnection();
                $fields = [];
                $params = [':id' => $id];
                if (isset($input['full_name'])) {
                    $fields[] = 'FullName=:fn';
                    $params[':fn'] = $input['full_name'];
                }
                if (isset($input['phone'])) {
                    $fields[] = 'Phone=:ph';
                    $params[':ph'] = $input['phone'];
                }
                if (isset($input['email'])) {
                    $fields[] = 'Email=:em';
                    $params[':em'] = $input['email'];
                }
                if (isset($input['address'])) {
                    $fields[] = 'Address=:ad';
                    $params[':ad'] = $input['address'];
                }
                if (isset($input['password']) && $input['password']) { /* optional: update Users table if mapping exists */
                }
                if (empty($fields)) Helpers::error_response('No fields', 400);
                $sql = 'UPDATE Parents SET ' . implode(',', $fields) . ' WHERE ParentID=:id';
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                Helpers::success_response(null, 'Parent updated');
            } catch (Exception $e) {
                Helpers::error_response('Failed: ' . $e->getMessage(), 500);
            }
        }
        if ($method === 'DELETE') {
            try {
                $pdo = Database::getConnection();
                $s = $pdo->prepare('DELETE FROM Parents WHERE ParentID=:id');
                $s->execute([':id' => $id]);
                Helpers::success_response(null, 'Parent deleted');
            } catch (Exception $e) {
                Helpers::error_response('Failed: ' . $e->getMessage(), 500);
            }
        }
    }

    // BUSES
    if ($uri === '/api/admin/buses' && $method === 'GET') {
        try {
            $pdo = Database::getConnection();
            $s = $pdo->prepare('SELECT BusID AS id, PlateNumber AS plate_number, Capacity AS capacity, Model AS model, Status AS status, Note AS note FROM Buses');
            $s->execute();
            Helpers::success_response($s->fetchAll(PDO::FETCH_ASSOC));
        } catch (Exception $e) {
            Helpers::error_response('Failed: ' . $e->getMessage(), 500);
        }
    }
    if ($uri === '/api/admin/buses' && $method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        if (empty($input['plate_number']) || !isset($input['capacity'])) Helpers::error_response('plate_number and capacity required', 400);
        try {
            $pdo = Database::getConnection();
            $s = $pdo->prepare('INSERT INTO Buses (PlateNumber,Capacity,Model,Status,Note) VALUES (:pn,:cap,:mod,:st,:note)');
            $s->execute([':pn' => $input['plate_number'], ':cap' => $input['capacity'], ':mod' => $input['model'] ?? '', ':st' => $input['status'] ?? 'ACTIVE', ':note' => $input['note'] ?? '']);
            Helpers::success_response(['id' => $pdo->lastInsertId()], 'Bus created', 201);
        } catch (Exception $e) {
            Helpers::error_response('Failed: ' . $e->getMessage(), 500);
        }
    }
    if (preg_match('#^/api/admin/buses/(\d+)$#', $uri, $m)) {
        $id = (int)$m[1];
        if ($method === 'PUT') {
            $input = json_decode(file_get_contents('php://input'), true);
            try {
                $pdo = Database::getConnection();
                $fields = [];
                $params = [':id' => $id];
                if (isset($input['plate_number'])) {
                    $fields[] = 'PlateNumber=:pn';
                    $params[':pn'] = $input['plate_number'];
                }
                if (isset($input['capacity'])) {
                    $fields[] = 'Capacity=:cap';
                    $params[':cap'] = $input['capacity'];
                }
                if (isset($input['model'])) {
                    $fields[] = 'Model=:mod';
                    $params[':mod'] = $input['model'];
                }
                if (isset($input['status'])) {
                    $fields[] = 'Status=:st';
                    $params[':st'] = $input['status'];
                }
                if (isset($input['note'])) {
                    $fields[] = 'Note=:note';
                    $params[':note'] = $input['note'];
                }
                if (empty($fields)) Helpers::error_response('No fields', 400);
                $sql = 'UPDATE Buses SET ' . implode(',', $fields) . ' WHERE BusID=:id';
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                Helpers::success_response(null, 'Bus updated');
            } catch (Exception $e) {
                Helpers::error_response('Failed: ' . $e->getMessage(), 500);
            }
        }
        if ($method === 'DELETE') {
            try {
                $pdo = Database::getConnection();
                $s = $pdo->prepare('DELETE FROM Buses WHERE BusID=:id');
                $s->execute([':id' => $id]);
                Helpers::success_response(null, 'Bus deleted');
            } catch (Exception $e) {
                Helpers::error_response('Failed: ' . $e->getMessage(), 500);
            }
        }
    }

    // ROUTES
    if ($uri === '/api/admin/routes' && $method === 'GET') {
        try {
            $pdo = Database::getConnection();
            $s = $pdo->prepare('SELECT RouteID AS id, RouteName AS route_name, Description AS description, Status AS status FROM Routes');
            $s->execute();
            Helpers::success_response($s->fetchAll(PDO::FETCH_ASSOC));
        } catch (Exception $e) {
            Helpers::error_response('Failed: ' . $e->getMessage(), 500);
        }
    }
    if ($uri === '/api/admin/routes' && $method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        if (empty($input['route_name'])) Helpers::error_response('route_name required', 400);
        try {
            $pdo = Database::getConnection();
            $s = $pdo->prepare('INSERT INTO Routes (RouteName,Description,Status) VALUES (:rn,:desc,:st)');
            $s->execute([':rn' => $input['route_name'], ':desc' => $input['description'] ?? '', ':st' => $input['status'] ?? 'ACTIVE']);
            Helpers::success_response(['id' => $pdo->lastInsertId()], 'Route created', 201);
        } catch (Exception $e) {
            Helpers::error_response('Failed: ' . $e->getMessage(), 500);
        }
    }
    if (preg_match('#^/api/admin/routes/(\d+)$#', $uri, $m)) {
        $id = (int)$m[1];
        if ($method === 'PUT') {
            $input = json_decode(file_get_contents('php://input'), true);
            try {
                $pdo = Database::getConnection();
                $fields = [];
                $params = [':id' => $id];
                if (isset($input['route_name'])) {
                    $fields[] = 'RouteName=:rn';
                    $params[':rn'] = $input['route_name'];
                }
                if (isset($input['description'])) {
                    $fields[] = 'Description=:desc';
                    $params[':desc'] = $input['description'];
                }
                if (isset($input['status'])) {
                    $fields[] = 'Status=:st';
                    $params[':st'] = $input['status'];
                }
                if (empty($fields)) Helpers::error_response('No fields', 400);
                $sql = 'UPDATE Routes SET ' . implode(',', $fields) . ' WHERE RouteID=:id';
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                Helpers::success_response(null, 'Route updated');
            } catch (Exception $e) {
                Helpers::error_response('Failed: ' . $e->getMessage(), 500);
            }
        }
        if ($method === 'DELETE') {
            try {
                $pdo = Database::getConnection();
                $s = $pdo->prepare('DELETE FROM Routes WHERE RouteID=:id');
                $s->execute([':id' => $id]);
                Helpers::success_response(null, 'Route deleted');
            } catch (Exception $e) {
                Helpers::error_response('Failed: ' . $e->getMessage(), 500);
            }
        }
    }

    // Admin create user (POST /api/admin/users)
    if ($uri === '/api/admin/users' && $method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $required = ['username', 'password', 'full_name', 'phone', 'role'];
        foreach ($required as $r) if (empty($input[$r])) Helpers::error_response("Field $r required", 400);
        try {
            $created = Auth::create_user(['username' => $input['username'], 'password' => $input['password'], 'full_name' => $input['full_name'], 'phone' => $input['phone'], 'email' => $input['email'] ?? '', 'role' => $input['role'], 'is_active' => isset($input['is_active']) ? (int)$input['is_active'] : 1]);
            Helpers::success_response(['user' => ['id' => $created['UserID'], 'username' => $created['Username']]], 'User created', 201);
        } catch (Exception $e) {
            Helpers::error_response('Failed: ' . $e->getMessage(), 500);
        }
    }

    // finished handling admin block
}

// -----------------------
// Driver routes
// -----------------------
if (strpos($uri, '/api/driver') === 0) {
    $current = Auth::get_current_user_from_token();
    if (!$current) Helpers::error_response('Unauthorized', 401);
    // find driver profile by UserID
    try {
        $pdo = Database::getConnection();
        $s = $pdo->prepare('SELECT DriverID, UserID, FullName, Phone, LicenseNumber, Status FROM Drivers WHERE UserID = :uid');
        $s->execute([':uid' => $current['UserID']]);
        $driver = $s->fetch(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        Helpers::error_response('Failed to load driver profile: ' . $e->getMessage(), 500);
    }
    if (!$driver) Helpers::error_response('Driver profile not found', 404);

    // GET /api/driver/dashboard
    if ($uri === '/api/driver/dashboard' && $method === 'GET') {
        Helpers::success_response(['driver' => ['id' => $driver['DriverID'], 'full_name' => $driver['FullName'], 'phone' => $driver['Phone']]]);
    }

    // GET /api/driver/trips
    if ($uri === '/api/driver/trips' && $method === 'GET') {
        try {
            $s = $pdo->prepare('SELECT TripID AS id, RouteID AS route_id, BusID AS bus_id, TripDate AS trip_date, StartTime AS start_time, EndTime AS end_time, Direction AS direction, Status AS status FROM Trips WHERE DriverID = :did');
            $s->execute([':did' => $driver['DriverID']]);
            Helpers::success_response($s->fetchAll(PDO::FETCH_ASSOC));
        } catch (Exception $e) {
            Helpers::error_response('Failed to get trips: ' . $e->getMessage(), 500);
        }
    }

    // POST /api/driver/trips/{id}/start  and /end
    if (preg_match('#^/api/driver/trips/(\d+)/(start|end)$#', $uri, $m) && $method === 'POST') {
        $tripId = (int)$m[1];
        $action = $m[2];
        try {
            if ($action === 'start') {
                $stmt = $pdo->prepare("UPDATE Trips SET Status='IN_PROGRESS' WHERE TripID=:id AND DriverID=:did");
                $stmt->execute([':id' => $tripId, ':did' => $driver['DriverID']]);
                Helpers::success_response(null, 'Trip started');
            } else {
                $stmt = $pdo->prepare("UPDATE Trips SET Status='COMPLETED' WHERE TripID=:id AND DriverID=:did");
                $stmt->execute([':id' => $tripId, ':did' => $driver['DriverID']]);
                Helpers::success_response(null, 'Trip ended');
            }
        } catch (Exception $e) {
            Helpers::error_response('Failed: ' . $e->getMessage(), 500);
        }
    }

    // POST /api/driver/location  (expects bus_id, latitude, longitude, optional speed, heading)
    if ($uri === '/api/driver/location' && $method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $required = ['bus_id', 'latitude', 'longitude'];
        foreach ($required as $r) if (!isset($input[$r])) Helpers::error_response("Field $r required", 400);
        try {
            $stmt = $pdo->prepare('INSERT INTO BusLocations (BusID,Latitude,Longitude,Speed,Heading,RecordedAt) VALUES (:bus,:lat,:lon,:sp,:hd, NOW())');
            $stmt->execute([':bus' => $input['bus_id'], ':lat' => $input['latitude'], ':lon' => $input['longitude'], ':sp' => $input['speed'] ?? null, ':hd' => $input['heading'] ?? null]);
            Helpers::success_response(['id' => $pdo->lastInsertId()], 'Location updated', 201);
        } catch (Exception $e) {
            Helpers::error_response('Failed: ' . $e->getMessage(), 500);
        }
    }
}

// -----------------------
// Parent routes
// -----------------------
if (strpos($uri, '/api/parent') === 0) {
    $current = Auth::get_current_user_from_token();
    if (!$current) Helpers::error_response('Unauthorized', 401);
    $pdo = Database::getConnection();
    // find parent profile
    try {
        $s = $pdo->prepare('SELECT ParentID, UserID, FullName FROM Parents WHERE UserID = :uid');
        $s->execute([':uid' => $current['UserID']]);
        $parent = $s->fetch(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        Helpers::error_response('Failed: ' . $e->getMessage(), 500);
    }
    if (!$parent) Helpers::error_response('Parent profile not found', 404);

    // GET /api/parent/dashboard
    if ($uri === '/api/parent/dashboard' && $method === 'GET') {
        Helpers::success_response(['parent' => ['id' => $parent['ParentID'], 'full_name' => $parent['FullName']]]);
    }

    // GET /api/parent/students
    if ($uri === '/api/parent/students' && $method === 'GET') {
        try {
            $s = $pdo->prepare('SELECT StudentID AS id, FullName AS full_name, DateOfBirth AS date_of_birth, ClassName AS class_name, SchoolName AS school_name, AssignedBusID AS assigned_bus_id FROM Students WHERE ParentID = :pid');
            $s->execute([':pid' => $parent['ParentID']]);
            Helpers::success_response($s->fetchAll(PDO::FETCH_ASSOC));
        } catch (Exception $e) {
            Helpers::error_response('Failed: ' . $e->getMessage(), 500);
        }
    }

    // GET /api/parent/bus/{id}/location  (latest)
    if (preg_match('#^/api/parent/bus/(\d+)/location$#', $uri, $m) && $method === 'GET') {
        $busId = (int)$m[1];
        // verify parent's student assigned to this bus
        try {
            $s = $pdo->prepare('SELECT StudentID FROM Students WHERE ParentID=:pid AND AssignedBusID=:bid');
            $s->execute([':pid' => $parent['ParentID'], ':bid' => $busId]);
            if (!$s->fetch(PDO::FETCH_ASSOC)) Helpers::error_response('Unauthorized access to bus location', 403);
            $t = $pdo->prepare('SELECT LocationID AS id, BusID AS bus_id, Latitude AS latitude, Longitude AS longitude, Speed AS speed, Heading AS heading, RecordedAt AS recorded_at FROM BusLocations WHERE BusID=:bid ORDER BY RecordedAt DESC LIMIT 1');
            $t->execute([':bid' => $busId]);
            $track = $t->fetch(PDO::FETCH_ASSOC);
            if (!$track) Helpers::error_response('No tracking data available', 404);
            Helpers::success_response($track);
        } catch (Exception $e) {
            Helpers::error_response('Failed: ' . $e->getMessage(), 500);
        }
    }

    // GET /api/parent/notifications
    if ($uri === '/api/parent/notifications' && $method === 'GET') {
        try {
            $s = $pdo->prepare('SELECT NotificationID AS id, Type AS type, Title AS title, Content AS content, CreatedAt AS created_at, ReadAt AS read_at FROM Notifications WHERE UserID = :uid ORDER BY CreatedAt DESC');
            $s->execute([':uid' => $current['UserID']]);
            Helpers::success_response($s->fetchAll(PDO::FETCH_ASSOC));
        } catch (Exception $e) {
            Helpers::error_response('Failed: ' . $e->getMessage(), 500);
        }
    }
}

// Fallthrough: unknown route
Helpers::error_response('Not Found', 404);
