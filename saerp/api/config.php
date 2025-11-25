<?php
// ==============================
// config.php : SAERP 공용 환경 설정
// ==============================

// PHP 에러 표시 (개발용)
ini_set('display_errors', 1);
error_reporting(E_ALL);

// CORS 설정
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

$allowed_origins = [
    'http://172.30.1.42',
    'http://172.30.1.42:80',
    'https://azimam5649-ux.github.io',
    'https://saerp.synology.me',
];

if (in_array($origin, $allowed_origins, true)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: https://azimam5649-ux.github.io");
}

header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-Requested-With");

// OPTIONS 요청 빠른 종료
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// NAS 경로 (절대경로!)
// 네가 직접 찍어 올린 경로 그대로 적용함
define('PATH_BOM', '/volume1/SAERP List/SAERP BOM List/');
define('PATH_COORD', '/volume1/SAERP List/SAERP 좌표데이터 List/');

// JSON 입력 헬퍼
function read_json_input() {
    $raw = file_get_contents('php://input');
    if (!$raw) return null;

    $data = json_decode($raw, true);
    return json_last_error() === JSON_ERROR_NONE ? $data : null;
}
