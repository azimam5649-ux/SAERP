<?php
// /saerp/api/signup_api.php
// GitHub 페이지에서 넘어온 회원가입 데이터를 DB에 저장하고 JSON으로 결과 반환

error_reporting(E_ALL);
ini_set('display_errors', 1);

// ----- CORS 설정 (자기 GitHub 주소로 바꾸기) -----
$allowed_origin = 'https://azimam5649-ux.github.io/SAERP/login.html';  // ★ 수정필요

header("Access-Control-Allow-Origin: $allowed_origin");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Preflight 요청 처리
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 실제 요청은 POST만 허용
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'msg' => 'POST만 허용됩니다.']);
    exit;
}

// ----- DB 연결 -----
$host = "localhost";
$user = "root";            // 실제 사용자
$pass = "Bb83205959!";   // 실제 비번
$db   = "saerp";

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'msg' => 'DB 연결 실패: '.$conn->connect_error]);
    exit;
}

// ----- JSON 데이터 파싱 -----
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

$userid   = trim($data['userid']  ?? '');
$company  = trim($data['company'] ?? '');
$phone    = trim($data['phone']   ?? '');
$email    = trim($data['email']   ?? '');
$password = $data['password']     ?? '';

if ($userid === '' || $company === '' || $phone === '' || $email === '' || $password === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'msg' => '필수 항목이 비어 있습니다.']);
    exit;
}

// 비밀번호 해시
$hash = password_hash($password, PASSWORD_DEFAULT);

// ----- INSERT (아이디 중복 체크는 UNIQUE 제약이 처리) -----
$stmt = $conn->prepare("
    INSERT INTO users (userid, company, phone, email, password_hash)
    VALUES (?, ?, ?, ?, ?)
");
$stmt->bind_param("sssss", $userid, $company, $phone, $email, $hash);

if ($stmt->execute()) {
    echo json_encode(['ok' => true, 'msg' => '회원가입 성공']);
} else {
    if ($conn->errno === 1062) {
        // duplicate entry
        http_response_code(409);
        echo json_encode(['ok' => false, 'msg' => '이미 사용 중인 아이디입니다.']);
    } else {
        http_response_code(500);
        echo json_encode(['ok' => false, 'msg' => 'DB 오류: '.$conn->error]);
    }
}
