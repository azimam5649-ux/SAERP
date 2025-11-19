<?php
// /saerp/api/login.php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['ok' => true, 'msg' => 'OK']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'msg' => 'POST만 허용됩니다.']);
    exit;
}

// --- DB 접속 정보 (★ signup.php 와 동일하게 설정) ---
$host = "localhost";
$user = "root";
$pass = "Bb83205959!";
$db   = "saerp";

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'msg' => 'DB 연결 실패: '.$conn->connect_error]);
    exit;
}
$conn->set_charset("utf8mb4");

$userid   = trim($_POST['userid']  ?? '');
$password = $_POST['password']     ?? '';

if ($userid === '' || $password === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'msg' => '아이디와 비밀번호를 입력하세요.']);
    exit;
}

// 해당 사용자 조회
$stmt = $conn->prepare("SELECT id, password_hash, company FROM users WHERE userid = ?");
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'msg' => '쿼리 준비 실패: '.$conn->error]);
    exit;
}
$stmt->bind_param("s", $userid);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    if (!password_verify($password, $row['password_hash'])) {
        http_response_code(401);
        echo json_encode(['ok' => false, 'msg' => '비밀번호가 올바르지 않습니다.']);
    } else {
        // 간단 토큰 (실서비스면 JWT/세션 등으로 교체)
        $token = bin2hex(random_bytes(16));
        // 세션을 쓰고 싶다면 여기에 session_start() 하고 저장해도 됨

        echo json_encode([
            'ok'      => true,
            'msg'     => '로그인 성공',
            'token'   => $token,
            'user_id' => (int)$row['id'],
            'company' => $row['company']
        ]);
    }
} else {
    http_response_code(404);
    echo json_encode(['ok' => false, 'msg' => '존재하지 않는 아이디입니다.']);
}

$stmt->close();
$conn->close();
