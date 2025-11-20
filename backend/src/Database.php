<?php

namespace App;

use PDO;
use PDOException;
use Exception;

class Database
{
    private static ?PDO $pdo = null;

    public static function getConnection()
    {
        if (self::$pdo) {
            return self::$pdo;
        }

        // ✅ CẤU HÌNH DB VIẾT THẲNG Ở ĐÂY
        $dsn  = 'mysql:host=127.0.0.1;dbname=smartschoolbusdb;charset=utf8mb4';
        $user = 'root';
        $pass = '';

        try {
            self::$pdo = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);
            return self::$pdo;
        } catch (PDOException $e) {
            throw new Exception('Database connection failed: ' . $e->getMessage());
        }
    }
}
