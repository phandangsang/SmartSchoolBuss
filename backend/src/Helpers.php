<?php

namespace App;

class Helpers
{
    public static function success_response($data = null, $message = '', $status = 200)
    {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode(['success' => true, 'message' => $message, 'data' => $data]);
        exit;
    }

    public static function error_response($message = '', $status = 400)
    {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => $message]);
        exit;
    }
}
