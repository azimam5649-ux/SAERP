<?php
require_once __DIR__ . '/config.php';

// JSON 또는 FormData 둘 다 처리
$data = read_json_body();

if ($data && is_array($data)) {
    $userid = trim($data['id'] ?? '');
    $pw     = $data['pw']      ?? '';
} else {
    $userid = trim($_POST['userid']  ?? '');
    $pw     = $_POST['password']     ?? '';
}

if (!$userid || !$pw) {
    json_err('아이디와 비밀번호를 입력해 주세요.');
}

// 사용자 조회
global $mysqli;
$stmt = $mysqli->prepare('SELECT id, password_hash FROM users WHERE userid = ?');
if (!$stmt) {
    json_err('로그인 쿼리 준비 중 오류: ' . $mysqli->error, 500);
}
$stmt->bind_param('s', $userid);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows === 0) {
    $stmt->close();
    json_err('존재하지 않는 아이디입니다.');
}

$stmt->bind_result($id, $hash);
$stmt->fetch();
$stmt->close();

if (!password_verify($pw, $hash)) {
    json_err('비밀번호가 올바르지 않습니다.');
}

json_ok([
    'userid' => $userid,
    'msg'    => '로그인 성공'
]);
