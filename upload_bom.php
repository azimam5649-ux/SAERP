<?php
// upload_bom.php: BOM 파일 업로드 (디버깅 강화판)

// 1. 설정 파일 로드
require_once __DIR__ . '/config.php'; 

// 2. 메서드 확인 (405 오류 방지)
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => '잘못된 요청입니다. POST 메서드만 허용됩니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}

// 3. 파일 전송 여부 확인
if (!isset($_FILES['bomFile'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => '파일(bomFile)이 전송되지 않았습니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$file = $_FILES['bomFile'];
$fileName = basename($file['name']);

// config.php에서 정의한 BOM 경로 사용
$targetDir = PATH_BOM; 
$targetPath = $targetDir . $fileName;
$tempPath = $file['tmp_name'];

// 4. 저장 폴더 존재 확인 (가장 먼저 체크)
if (!is_dir($targetDir)) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => '저장 폴더를 찾을 수 없습니다: ' . $targetDir,
        'hint' => 'open_basedir 설정에 이 경로가 빠져 있거나, 실제 폴더명 오타일 수 있습니다.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 5. 업로드 중 기본 에러 확인
if ($file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'PHP 파일 업로드 오류 코드: ' . $file['error']], JSON_UNESCAPED_UNICODE);
    exit;
}

// 6. 파일을 임시 위치에서 최종 위치로 이동 (★ 여기가 핵심)
// 경고 메시지를 억제하지 않고, 에러 발생 시 내용을 잡아서 출력합니다.
if (!@move_uploaded_file($tempPath, $targetPath)) {
    // 🚨 시스템 에러 메시지 가져오기
    $error = error_get_last();
    $sysMsg = $error ? $error['message'] : '알 수 없는 시스템 오류';

    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => '이동 실패! 원인: ' . $sysMsg, // ★ 진짜 에러 이유 출력
        'debug_info' => [
            '임시파일위치' => $tempPath,
            '목표위치' => $targetPath,
            '임시파일존재여부' => file_exists($tempPath) ? '있음' : '없음 (이미 삭제됨?)',
            '목표폴더쓰기권한' => is_writable($targetDir) ? '있음' : '없음 (권한 문제!)'
        ]
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 7. 성공 응답
http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => 'BOM 파일 업로드 성공',
    'fileName' => $fileName,
], JSON_UNESCAPED_UNICODE);
?>