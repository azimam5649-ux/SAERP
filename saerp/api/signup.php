<?php
require_once __DIR__ . '/config.php';

// JSON 또는 FormData 둘 다 처리
$data = read_json_body();

if ($data && is_array($data)) {
    // JSON 방식 (app.js 등에서 보낼 때)
    $userid  = trim($data['id']      ?? '');
    $company = trim($data['company'] ?? '');
    $phone   = trim($data['phone']   ?? '');
    $email   = trim($data['email']   ?? '');
    $pw      = $data['pw']           ?? '';
} else {
    // 폼방식 대비
    $userid  = trim($_POST['userid']  ?? '');
    $company = trim($_POST['company'] ?? '');
    $phone   = trim($_POST['phone']   ?? '');
    $email   = trim($_POST['email']   ?? '');
    $pw      = $_POST['password']     ?? '';
}

// 필수값 체크
if (!$userid || !$company || !$phone || !$email || !$pw) {
    json_err('필수 항목이 누락되었습니다.');
}

// 아이디 중복 확인
global $mysqli;
$stmt = $mysqli->prepare('SELECT id FROM users WHERE userid = ?');
if (!$stmt) {
    json_err('쿼리 준비 중 오류: ' . $mysqli->error, 500);
}
$stmt->bind_param('s', $userid);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
    $stmt->close();
    json_err('이미 사용 중인 아이디입니다.');
}
$stmt->close();

// 비밀번호 해시
$hash = password_hash($pw, PASSWORD_DEFAULT);

// INSERT
$stmt = $mysqli->prepare(
    'INSERT INTO users (userid, company, phone, email, password_hash) VALUES (?,?,?,?,?)'
);
if (!$stmt) {
    json_err('회원가입 쿼리 준비 중 오류: ' . $mysqli->error, 500);
}

$stmt->bind_param('sssss', $userid, $company, $phone, $email, $hash);
if (!$stmt->execute()) {
    $msg = '회원가입 중 오류가 발생했습니다: ' . $stmt->error;
    $stmt->close();
    json_err($msg, 500);
}
$stmt->close();

json_ok([
    'userid' => $userid,
    'msg'    => '회원가입 성공'
]);
