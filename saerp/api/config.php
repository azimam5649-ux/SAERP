<?php
// config.php : DB 접속 + 공통 유틸

// ===== PHP 에러 표시 (개발용) =====
ini_set('display_errors', 1);
error_reporting(E_ALL);

// 기본 응답 타입을 JSON 으로
header('Content-Type: application/json; charset=utf-8');

// ===== CORS (외부 접근 허용) =====
// 🚨 이 설정은 CORS 오류를 해결합니다.
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

// OPTIONS 프리플라이트 요청은 여기서 바로 끝내기
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ===== DB 접속 설정 (MariaDB10, 포트 3307) =====
$db_host = '127.0.0.1';     // NAS 자체에서 접근
$db_user = 'root';          
$db_pass = 'Bb83205959!';  // ★ DB 비밀번호로 변경
$db_name = 'saerp';         
$db_port = 3307;            

$mysqli = @new mysqli($db_host, $db_user, $db_pass, $db_name, $db_port);

if ($mysqli->connect_errno) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'DB 연결 실패: ' . $mysqli->connect_error
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 문자셋 UTF-8
$mysqli->set_charset('utf8mb4');

// ===== JSON 입력 헬퍼 =====
function read_json_input() {
    $raw = file_get_contents('php://input');
    if ($raw === '' || $raw === false) return null;

    $data = json_decode($raw, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        return null;
    }
    return $data;
}

// ===== NAS 저장 경로 설정 (리눅스 절대 경로 사용) =====
// ★ NAS File Station에서 폴더 이름을 복사/붙여넣기하여 경로를 100% 일치시켜야 합니다.
define('PATH_BOM',          '/volume1/SAERP List/SAERP BOM List/');
define('PATH_COORD',        '/volume1/SAERP List/SAERP 좌표데이터 List/');