<?php
// 좌표데이터 업로드: 브라우저에서 넘어온 파일을 NAS 좌표 폴더(PATH_COORD)에 저장

require_once __DIR__ . '/config.php';

// JSON 응답 헬퍼
function coord_send_json($arr, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($arr, JSON_UNESCAPED_UNICODE);
    exit;
}

// 메서드 체크
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    coord_send_json(['success' => false, 'message' => '잘못된 요청입니다.'], 405);
}

// JS: fd.append('coordFile', file, file.name);
if (!isset($_FILES['coordFile']) || $_FILES['coordFile']['error'] !== UPLOAD_ERR_OK) {
    $err = $_FILES['coordFile']['error'] ?? 'no_file';
    coord_send_json(['success' => false, 'message' => '업로드된 파일이 없습니다. (error: '.$err.')']);
}

$file = $_FILES['coordFile'];
$name = basename($file['name']);

// config.php 에서 정의한 NAS 좌표 폴더
$dir = rtrim(PATH_COORD, '/').'/';

// 폴더 없으면 생성 시도
if (!is_dir($dir)) {
    @mkdir($dir, 0777, true);
}
if (!is_dir($dir)) {
    coord_send_json(['success' => false, 'message' => '좌표 폴더를 찾을 수 없거나 생성할 수 없습니다. ('. $dir .')']);
}

$target = $dir . $name;

if (move_uploaded_file($file['tmp_name'], $target)) {
    coord_send_json([
        'success' => true,
        'message' => '좌표 저장 완료',
        'file'    => [
            'name' => $name,
            'size' => $file['size'],
        ],
    ]);
} else {
    coord_send_json(['success' => false, 'message' => '좌표 저장 실패(파일 이동 실패)']);
}