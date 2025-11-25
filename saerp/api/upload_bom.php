<?php
/****************************************************************
 * upload_bom.php — Reverse Proxy + GitHub Pages 완전 호환 최종본
 ****************************************************************/

// ============== CORS 설정 ===============
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

$allowed_origins = [
    'https://azimam5649-ux.github.io',     // GitHub Pages
    'https://saerp.synology.me',           // 웹사이트
    'https://api.saerp.synology.me',       // API 서버 프록시
    'http://172.30.1.42',                  // 내부망
];

if (in_array($origin, $allowed_origins, true)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: https://azimam5649-ux.github.io");
}

header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-Requested-With, Authorization");

// OPTIONS 프리플라이트 즉시 처리
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ============== JSON 응답 함수 ===============
function send_json($arr, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($arr, JSON_UNESCAPED_UNICODE);
    exit;
}

// ============== 메서드 체크 ===============
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json(['success' => false, 'message' => 'POST 방식만 허용됩니다.'], 405);
}

// ============== 설정파일 ===============
require_once __DIR__ . '/config.php';  // PATH_BOM 가져오기

if (!defined('PATH_BOM')) {
    send_json(['success' => false, 'message' => 'PATH_BOM 미정의']);
}

// ============== 파일 업로드 체크 ===============
if (!isset($_FILES['file'])) {
    send_json(['success' => false, 'message' => '업로드된 파일이 없습니다.']);
}

$file = $_FILES['file'];

if ($file['error'] !== UPLOAD_ERR_OK) {
    send_json(['success' => false, 'message' => '파일 업로드 오류: code ' . $file['error']]);
}

// ============== 폴더 생성 ===============
$dir = rtrim(PATH_BOM, '/') . '/';

if (!is_dir($dir)) {
    mkdir($dir, 0777, true);
}

// ============== 파일 저장 ===============
$name = basename($file['name']);
$target = $dir . $name;

if (!move_uploaded_file($file['tmp_name'], $target)) {
    send_json(['success' => false, 'message' => 'NAS 파일 저장 실패']);
}

// ============== 성공 응답 ===============
send_json([
    'success' => true,
    'message' => '업로드 완료',
    'file' => [
        'name' => $name,
        'size' => $file['size'],
        'uploadedAt' => date('Y-m-d H:i:s'),
    ],
]);
