<?php
// upload_coord.php: 클라이언트에서 받은 파일을 NAS에 저장

require_once __DIR__ . '/config.php'; 

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => '잘못된 요청입니다. POST 메서드를 사용하세요.'], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!isset($_FILES['coordFile'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => '파일(coordFile)이 전송되지 않았습니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$file = $_FILES['coordFile'];
$fileName = basename($file['name']);
$targetDir = PATH_COORD;
$targetPath = $targetDir . $fileName;
$tempPath = $file['tmp_name'];

// 저장 폴더가 존재하는지 확인
if (!is_dir($targetDir)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => '저장 폴더를 찾을 수 없습니다: ' . $targetDir], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => '파일 업로드 오류. PHP 오류 코드: ' . $file['error']], JSON_UNESCAPED_UNICODE);
    exit;
}

// 파일을 임시 위치에서 최종 위치로 이동 (NAS 쓰기 권한 필요)
if (!move_uploaded_file($tempPath, $targetPath)) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => '파일을 NAS로 최종 이동하는 데 실패했습니다.',
        'hint'    => 'NAS Web Station의 PHP 임시 폴더와 ' . $targetDir . ' 폴더의 HTTP 사용자 쓰기 권한을 확인하세요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// DB 기록 코드가 모두 제거되었으므로, 파일 저장 성공 즉시 성공 응답을 보냅니다.
http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => '좌표 파일 업로드 및 저장 성공',
    'fileName' => $fileName,
], JSON_UNESCAPED_UNICODE);