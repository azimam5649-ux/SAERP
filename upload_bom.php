<?php
// BOM 파일 업로드: 브라우저에서 넘어온 파일을 NAS BOM 폴더(PATH_BOM)에 저장

require_once __DIR__ . '/config.php';   // 같은 폴더의 config.php 사용

// JSON 응답 헬퍼
function send_json($arr, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($arr, JSON_UNESCAPED_UNICODE);
    exit;
}

// 메서드 체크
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json(['success' => false, 'message' => '잘못된 요청입니다.'], 405);
}

// JS 에서 fd.append('bomFile', file, file.name) 으로 보내고 있음
if (!isset($_FILES['bomFile']) || $_FILES['bomFile']['error'] !== UPLOAD_ERR_OK) {
    $err = $_FILES['bomFile']['error'] ?? 'no_file';
    send_json(['success' => false, 'message' => '업로드된 파일이 없습니다. (error: '.$err.')']);
}

$file = $_FILES['bomFile'];
$name = basename($file['name']);

// config.php 에서 정의한 NAS BOM 폴더
$dir = rtrim(PATH_BOM, '/').'/';

// 폴더 없으면 생성 시도
if (!is_dir($dir)) {
    @mkdir($dir, 0777, true);
}
if (!is_dir($dir)) {
    send_json(['success' => false, 'message' => 'BOM 폴더를 찾을 수 없거나 생성할 수 없습니다. ('. $dir .')']);
}

$target = $dir . $name;

if (move_uploaded_file($file['tmp_name'], $target)) {
    send_json([
        'success' => true,
        'message' => 'BOM 저장 완료',
        'file'    => [
            'name' => $name,
            'size' => $file['size'],
        ],
    ]);
} else {
    send_json(['success' => false, 'message' => 'BOM 저장 실패(파일 이동 실패)']);
}
