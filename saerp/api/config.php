<?php
// ===============================
// config.php – SAERP 공통 설정
// ===============================

// PHP 에러 표시
ini_set('display_errors', 1);
error_reporting(E_ALL);

// JSON 기본 응답
header('Content-Type: application/json; charset=utf-8');

// ===== CORS 설정 =====
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

$allowed = [
    'https://azimam5649-ux.github.io',   // GitHub Pages
    'https://saerp.synology.me',         // 메인 도메인
    'https://api.saerp.synology.me',     // API 도메인
    'http://172.30.1.42',                // NAS 내부
];

if (in_array($origin, $allowed, true)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: https://azimam5649-ux.github.io");
}

header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-Requested-With, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ===== JSON 입력 헬퍼 =====
function read_json_input() {
    $raw = file_get_contents('php://input');
    if ($raw === '' || $raw === false) return null;

    $data = json_decode($raw, true);
    if (json_last_error() !== JSON_ERROR_NONE) return null;

    return $data;
}

// ===== NAS 실제 저장 경로 =====
// ※ NAS File Station에서 복사한 절대경로 100% 동일해야 함
define('PATH_BOM',   '/volume1/SAERP List/SAERP BOM List/');
define('PATH_COORD', '/volume1/SAERP List/SAERP 좌표데이터 List/');
