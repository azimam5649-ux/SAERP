<?php
/******************************************************
 * upload_bom.php — GitHub Pages 완전 호환 최종본
 * - GitHub Pages(HTTPS) → NAS(PHP) 파일 업로드 지원
 * - CORS 전체 허용
 * - OPTIONS preflight 정상 처리
 * - JSON 응답 일관성
 * - NAS 파일권한/존재 여부 자동 처리
 ******************************************************/

// =======================
// 🔥 CORS 허용 영역
// =======================
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

$allowed_origins = [
    'https://azimam5649-ux.github.io',
    'https://saerp.synology.me',
    'http://172.30.1.42',
    'http://172.30.1.42:80'
];

// 허용된 Origin만 특정 허용 (보안 ↑)
if (in_array($origin, $allowed_origins, true)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    // 기본 GitHub Pages 허용
    header("Access-Control-Allow-Origin: https://azimam5649-ux.github.io");
}

header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-Requested-With, Authorization");

// Preflight (OPTIONS) 요청 즉시 종료
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// =======================
// 공용 함수
// =======================
function send_json($arr, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($arr, JSON_UNESCAPED_UNICODE);
    exit;
}

// =======================
// 🔒 요청 메서드 검증
// =======================
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json(['success' => false, 'message' => 'POST 방식만 허용됩니다.'], 405);
}

// =======================
// 📁 config.php 불러오기
// =======================
require_once __DIR__ . '/config.php';  // 반드시 PATH_BOM 정의되어 있어야 함

if (!defined('PATH_BOM')) {
    send_json(['success' => false, 'message' => 'NAS 경로(PATH_BOM)가 설정되지 않았습니다.']);
}

// =======================
// 📦 파일 체크
// =======================
if (!isset($_FILES['file'])) {
    send_json(['success' => false, 'message' => '업로드된 파일이 없습니다.']);
}

$file = $_FILES['file'];

if ($file['error'] !== UPLOAD_ERR_OK) {
    send_json(['success' => false, 'message' => '업로드 오류 발생: 코드 ' . $file['error']]);
}

// =======================
// 📁 저장 폴더 생성 (없으면 자동 생성)
// =======================
$dir = rtrim(PATH_BOM, '/') . '/';

if (!is_dir($dir)) {
    if (!mkdir($dir, 0777, true)) {
        send_json(['success' => false, 'message' => 'NAS 폴더 생성 실패 (권한 부족 가능)']);
    }
}

// =======================
// 📄 파일 저장
// =======================
$name = basename($file['name']);               // 보안: 경로 제거
$target = $dir . $name;

if (!move_uploaded_file($file['tmp_name'], $target)) {
    send_json(['success' => false, 'message' => 'NAS 저장 실패 (move_uploaded_file 실패)']);
}

// =======================
// 🎉 성공 응답
// =======================
send_json([
    'success' => true,
    'message' => 'BOM 저장 완료',
    'file' => [
        'name' => $name,
        'size' => $file['size'],
        'uploadedAt' => date('Y-m-d H:i:s'),
    ]
]);
