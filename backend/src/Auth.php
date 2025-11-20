<?php

namespace App;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use App\Database;

use PDO;

class Auth
{
    public static function create_jwt($userId)
    {
        $secret = getenv('JWT_SECRET') ?: 'secret';
        $now = time();
        $exp = $now + 60 * 60 * 24; // 24 hours
        $payload = [
            'iat' => $now,
            'exp' => $exp,
            'sub' => (string)$userId
        ];
        return JWT::encode($payload, $secret, 'HS256');
    }

    public static function get_bearer_token()
    {
        $headers = null;
        if (isset($_SERVER['Authorization'])) {
            $headers = trim($_SERVER["Authorization"]);
        } elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) { // Nginx or fast CGI
            $headers = trim($_SERVER["HTTP_AUTHORIZATION"]);
        } elseif (function_exists('apache_request_headers')) {
            $requestHeaders = apache_request_headers();
            // Server-side fix for bug in apache_request_headers()
            $requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
            if (isset($requestHeaders['Authorization'])) {
                $headers = trim($requestHeaders['Authorization']);
            }
        }
        if (!empty($headers)) {
            if (preg_match('/Bearer\s+(\S+)/', $headers, $matches)) {
                return $matches[1];
            }
        }
        return null;
    }

    public static function verify_jwt()
    {
        $token = self::get_bearer_token();
        if (!$token) return null;
        $secret = getenv('JWT_SECRET') ?: 'secret';
        try {
            $decoded = JWT::decode($token, new Key($secret, 'HS256'));
            return $decoded;
        } catch (\Exception $e) {
            return null;
        }
    }

    // --- Database helpers ---
    public static function get_user_by_username($username)
    {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare('SELECT UserID, Username, PasswordHash, FullName, Phone, Email, Role, IsActive, CreatedAt FROM Users WHERE Username = :u');
        $stmt->execute([':u' => $username]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public static function get_user_by_id($id)
    {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare('SELECT UserID, Username, PasswordHash, FullName, Phone, Email, Role, IsActive, CreatedAt FROM Users WHERE UserID = :id');
        $stmt->execute([':id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public static function create_user(array $data)
    {
        $pdo = Database::getConnection();
        $passwordHash = password_hash($data['password'], PASSWORD_BCRYPT);
        $role = isset($data['role']) ? strtoupper($data['role']) : 'PARENT';

        $stmt = $pdo->prepare('INSERT INTO Users (Username, PasswordHash, FullName, Phone, Email, Role, IsActive, CreatedAt) VALUES (:u, :p, :f, :ph, :e, :r, :a, NOW())');
        // Use NOW() for MySQL (replaces SQL Server GETDATE())
        $stmt->execute([
            ':u' => $data['username'],
            ':p' => $passwordHash,
            ':f' => $data['full_name'],
            ':ph' => $data['phone'],
            ':e' => $data['email'] ?? '',
            ':r' => $role,
            ':a' => isset($data['is_active']) ? (int)$data['is_active'] : 1
        ]);

        // Return the created user (attempt to fetch by last insert id or username)
        return self::get_user_by_username($data['username']);
    }

    public static function change_password($userId, $currentPassword, $newPassword)
    {
        $user = self::get_user_by_id($userId);
        if (!$user) return ['ok' => false, 'message' => 'User not found'];

        $stored = $user['PasswordHash'] ?? '';
        $valid = false;
        if ($stored && function_exists('password_verify')) {
            try {
                $valid = password_verify($currentPassword, $stored);
            } catch (\Exception $e) {
                $valid = ($currentPassword === $stored);
            }
        } else {
            $valid = ($currentPassword === $stored);
        }

        if (!$valid) return ['ok' => false, 'message' => 'Current password is incorrect'];

        $pdo = Database::getConnection();
        $newHash = password_hash($newPassword, PASSWORD_BCRYPT);
        $stmt = $pdo->prepare('UPDATE Users SET PasswordHash = :p WHERE UserID = :id');
        $stmt->execute([':p' => $newHash, ':id' => $userId]);
        return ['ok' => true];
    }

    public static function get_current_user_from_token()
    {
        $decoded = self::verify_jwt();
        if (!$decoded) return null;
        $userId = $decoded->sub ?? null;
        if (!$userId) return null;
        return self::get_user_by_id($userId);
    }
}
