<?php
// config.php : DB 접속 + 공통 유틸
ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');

// CORS (GitHub / DDNS 등 외부 접근 허용)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');

// OPTIONS 프리플라이트 처리
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ===== DB 접속 설정 =====
$db_host = 'localhost';
$db_user = 'root';
$db_pass = 'Bb83205959!';
$db_name = 'saerp';

$mysqli = @new mysqli($db_host, $db_user, $db_pass, $db_name);
if ($mysqli->connect_errno) {
    http_response_code(500);
    echo json_encode([
        'ok'  => false,
        'msg' => 'DB 연결 실패: ' . $mysqli->connect_error
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$mysqli->set_charset('utf8mb4');

// ===== 공통 응답 함수 =====
function json_ok($data = []) {
    echo json_encode(array_merge(['ok' => true], $data), JSON_UNESCAPED_UNICODE);
    exit;
}

function json_err($msg, $status = 400) {
    echo json_encode(['ok' => false, 'msg' => $msg], JSON_UNESCAPED_UNICODE);
    exit;
}

// ===== 요청 JSON 처리 =====
function read_json_body() {
    $raw = file_get_contents('php://input');
    if (!$raw) return null;
    $data = json_decode($raw, true);
    return (json_last_error() === JSON_ERROR_NONE) ? $data : null;
}

// ===== NAS 저장 경로 설정 =====
// 공유폴더: "SAERP List" (윈도우에서 \\SAVE\SAERP List 로 보이는 폴더)

define('PATH_BOM',         '/volume1/SAERP List/SAERP BOM List/');
define('PATH_COORD',       '/volume1/SAERP List/SAERP 좌표데이터 List/');
define('PATH_RESULT_EXCEL','/volume1/SAERP List/SAERP 결과값 추출 List/');
define('PATH_RESULT_TXT',  '/volume1/SAERP List/SAERP 결과값 추출 txt/');

?>
