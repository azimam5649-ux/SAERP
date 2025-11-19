<?php
// /saerp/api/signup.php

// --- CORS 설정 ---
// ★ 실제 서비스때는 * 대신 GitHub 주소로 제한하는 게 안전함
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=utf-8");

// Preflight 요청 처리
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['ok' => true, 'msg' => 'OK']);
    exit;
}

// POST만 허용
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'msg' => 'POST만 허용됩니다.']);
    exit;
}

// --- DB 접속 정보 (★ 수정) ---
$host = "localhost";
$user = "root";          // MariaDB 사용자
$pass = "Bb83205959!";       // MariaDB 비밀번호
$db   = "saerp";

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'msg' => 'DB 연결 실패: '.$conn->connect_error]);
    exit;
}
$conn->set_charset("utf8mb4");

// 폼 데이터 받기
$userid   = trim($_POST['userid']  ?? '');
$company  = trim($_POST['company'] ?? '');
$phone    = trim($_POST['phone']   ?? '');
$email    = trim($_POST['email']   ?? '');
$password = $_POST['password']     ?? '';

if ($userid === '' || $company === '' || $phone === '' || $email === '' || $password === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'msg' => '필수 항목이 비어 있습니다.']);
    exit;
}

// 비밀번호 해시
$hash = password_hash($password, PASSWORD_DEFAULT);

// INSERT
$stmt = $conn->prepare("
    INSERT INTO users (userid, company, phone, email, password_hash)
    VALUES (?, ?, ?, ?, ?)
");
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'msg' => '쿼리 준비 실패: '.$conn->error]);
    exit;
}
$stmt->bind_param("sssss", $userid, $company, $phone, $email, $hash);

if ($stmt->execute()) {
    echo json_encode(['ok' => true, 'msg' => '회원가입 성공']);
} else {
    if ($conn->errno === 1062) {
        // pk/unique 중복 (아이디 중복)
        http_response_code(409);
        echo json_encode(['ok' => false, 'msg' => '이미 사용 중인 아이디입니다.']);
    } else {
        http_response_code(500);
        echo json_encode(['ok' => false, 'msg' => 'DB 오류: '.$conn->error]);
    }
}

$stmt->close();
$conn->close();
