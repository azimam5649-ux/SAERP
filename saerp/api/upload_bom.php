<?php
/******************************************************
 * upload_bom.php — Reverse Proxy + GitHub Pages 완전 호환 버전
 ******************************************************/

require_once __DIR__ . '/config.php';

// POST 방식만 허용
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'POST만 허용됨'], JSON_UNESCAPED_UNICODE);
    exit;
}

// 파일 유무 확인
if (!isset($_FILES['file'])) {
    echo json_encode(['success' => false, 'message' => '업로드된 파일이 없음'], JSON_UNESCAPED_UNICODE);
    exit;
}

$file = $_FILES['file'];

if ($file['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'message' => '업로드 오류: 코드 ' . $file['error']], JSON_UNESCAPED_UNICODE);
    exit;
}

$saveDir = rtrim(PATH_BOM, '/') . '/';

// 저장 폴더 없으면 생성
if (!is_dir($saveDir)) {
    mkdir($saveDir, 0777, true);
}

$filename = basename($file['name']);
$target = $saveDir . $filename;

// 저장 시도
if (!move_uploaded_file($file['tmp_name'], $target)) {
    echo json_encode(['success' => false, 'message' => 'NAS 저장 실패'], JSON_UNESCAPED_UNICODE);
    exit;
}

echo json_encode([
    'success' => true,
    'message' => '저장 완료',
    'file' => [
        'name' => $filename,
        'size' => $file['size'],
        'uploadedAt' => date('Y-m-d H:i:s'),
    ]
], JSON_UNESCAPED_UNICODE);
