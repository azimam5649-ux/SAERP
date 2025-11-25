<?php
/******************************************************
 * upload_bom.php — Reverse Proxy 최종 안정 버전
 ******************************************************/

// ========== CORS ==========
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

$allowed = [
    'http://172.30.1.42',
    'https://saerp.synology.me',
    'https://api.saerp.synology.me',
    'https://azimam5649-ux.github.io'
];

if (in_array($origin, $allowed, true)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: https://azimam5649-ux.github.io");
}

header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

header('Content-Type: application/json; charset=utf-8');

// JSON 리턴 함수
function respond($arr, $code=200){
    http_response_code($code);
    echo json_encode($arr, JSON_UNESCAPED_UNICODE);
    exit;
}

// ========== config 로드 ==========
require_once __DIR__ . '/config.php';

if (!defined('PATH_BOM')) {
    respond(['success'=>false, 'message'=>'PATH_BOM undefined']);
}

// ========== 파일 체크 ==========
if (!isset($_FILES['file'])) {
    respond(['success'=>false, 'message'=>'업로드된 파일 없음']);
}

$f = $_FILES['file'];

if ($f['error'] !== UPLOAD_ERR_OK) {
    respond(['success'=>false, 'message'=>'업로드 오류: '.$f['error']]);
}

// ========== 저장 경로 ==========
$saveDir = rtrim(PATH_BOM, '/') . '/';

if (!is_dir($saveDir)) {
    if (!mkdir($saveDir, 0777, true)) {
        respond(['success'=>false, 'message'=>'폴더 생성 실패 또는 권한 오류']);
    }
}

// ========== 파일 저장 ==========
$filename = basename($f['name']);
$target = $saveDir . $filename;

if (!move_uploaded_file($f['tmp_name'], $target)) {
    respond(['success'=>false, 'message'=>'NAS 저장 실패: move_uploaded_file']);
}

respond([
    'success' => true,
    'message' => 'BOM 저장 완료!',
    'file' => [
        'name' => $filename,
        'size' => $f['size'],
        'uploadedAt' => date('Y-m-d H:i:s')
    ]
]);
