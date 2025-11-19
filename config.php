<?php
// config.php : DB 접속 + 공통 유틸

header('Content-Type: application/json; charset=utf-8');

// ★ CORS (GitHub Pages 등 외부 도메인에서 부르는 경우 필요)
//   실제 사용하는 도메인으로 바꿔줘도 되고, 테스트용으로 * 써도 됨.
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
// phpMyAdmin 주소: http://172.30.1.42/phpmyadmin/
// 거기서 확인한 DB 계정/비밀번호로 맞춰 넣기
$db_host = 'localhost';     // NAS 내부에서 돌면 localhost 사용
$db_user = 'rost';    // 👈 실제 계정명으로 변경
$db_pass = 'Bb83205959!';    // 👈 실제 비밀번호로 변경
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

// 공통 응답 함수
function json_ok($data = []) {
    echo json_encode(array_merge(['ok' => true], $data), JSON_UNESCAPED_UNICODE);
    exit;
}
function json_err($msg, $status = 400) {
    http_response_code($status);
    echo json_encode(['ok' => false, 'msg' => $msg], JSON_UNESCAPED_UNICODE);
    exit;
}

// 요청 바디(JSON이면 파싱)
function read_json_body() {
    $raw = file_get_contents('php://input');
    if (!$raw) return null;
    $data = json_decode($raw, true);
    return (json_last_error() === JSON_ERROR_NONE) ? $data : null;
}
