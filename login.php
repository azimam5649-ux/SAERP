<?php
require_once __DIR__ . '/config.php';

// JSON 또는 FormData 둘 다 처리
$data = read_json_body();

if ($data && is_array($data)) {
    // app.js에서 보내는 JSON 형식
    $userid = trim($data['id'] ?? '');
    $pw     = $data['pw']      ?? '';
} else {
    // auth.js에서 FormData로 보낼 수도 있으므로 대비
    $userid = trim($_POST['userid']   ?? '');
    $pw     = $_POST['password']      ?? '';
}

if (!$userid || !$pw) {
    json_err('아이디와 비밀번호를 입력해 주세요.');
}

// DB에서 사용자 조회
$stmt = $mysqli->prepare('SELECT id, password FROM users WHERE userid = ?');
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

// 비밀번호 검증
if (!password_verify($pw, $hash)) {
    json_err('비밀번호가 올바르지 않습니다.');
}

// (선택) 토큰 등 세션 만들고 싶으면 여기에 추가.
// 지금은 간단하게 성공 여부 + userid만 반환
json_ok([
  'userid' => $userid,
  'msg'    => '로그인 성공'
]);
