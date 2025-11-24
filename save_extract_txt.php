<?php
// 결과값 TXT 저장 : 문자열을 NAS TXT 폴더에 저장

require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success'=>false, 'message'=>'잘못된 요청입니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$body = file_get_contents('php://input');
$data = json_decode($body, true);

if (!$data || !isset($data['filename']) || !isset($data['content'])) {
    echo json_encode(['success'=>false, 'message'=>'필수 데이터가 없습니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$filename = basename($data['filename']);
$text     = $data['content'];

$dir = rtrim(PATH_RESULT_TXT, '/').'/';

if (!is_dir($dir)) {
    @mkdir($dir, 0777, true);
}
if (!is_dir($dir)) {
    echo json_encode(['success'=>false, 'message'=>'TXT 저장 경로를 찾을 수 없습니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$target = $dir . $filename;

if (file_put_contents($target, $text) !== false) {
    echo json_encode([
        'success'=>true,
        'message'=>'TXT 결과값 저장 완료',
        'file'   => $filename
    ], JSON_UNESCAPED_UNICODE);
} else {
    echo json_encode(['success'=>false, 'message'=>'TXT 결과값 저장 실패'], JSON_UNESCAPED_UNICODE);
}
