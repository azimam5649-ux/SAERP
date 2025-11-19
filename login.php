<?php
// login.php - 로그인 처리
require __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        throw new Exception('잘못된 요청입니다.');
    }

    $userid = trim($input['id'] ?? '');
    $pw     = (string)($input['pw'] ?? '');

    if ($userid === '' || $pw === '') {
        throw new Exception('아이디와 비밀번호를 입력하세요.');
    }

    // DB에서 사용자 찾기
    $stmt = $pdo->prepare("SELECT userid, password_hash, company, email FROM users WHERE userid = ?");
    $stmt->execute([$userid]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        throw new Exception('존재하지 않는 아이디입니다.');
    }

    if (!password_verify($pw, $row['password_hash'])) {
        throw new Exception('비밀번호가 올바르지 않습니다.');
    }

    // 여기서 PHP 세션을 써도 되지만, 일단은 JS에서만 currentUser 저장
    echo json_encode([
        'ok'      => true,
        'userid'  => $row['userid'],
        'company' => $row['company'],
        'email'   => $row['email'],
    ]);
} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'msg' => $e->getMessage()]);
}
