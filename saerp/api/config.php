<?php
// config.php : 공통 환경 설정 및 NAS 경로 정의 (DB 접속 코드 모두 제거됨)

// ===== PHP 에러 표시 (개발용) =====
ini_set('display_errors', 1);
error_reporting(E_ALL);

// 기본 응답 타입을 JSON 으로 설정
header('Content-Type: application/json; charset=utf-8');

// ===== CORS (교차 출처) 설정 - GitHub 및 NAS 외부 접근 허용 =====
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// ★ 여기에 GitHub Pages 주소와 NAS DDNS 주소를 포함하여 모든 접속 주소를 등록하세요.
$allowed_origins = [
    'http://172.30.1.42',                   // 내부망 IP (http)
    'https://azimam5649-ux.github.io',      // GitHub Pages 주소 (HTTPS 필수)
    'https://saerp.synology.me',            // DDNS 주소 (HTTPS 필수)
];

if (in_array($origin, $allowed_origins, true)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    // 허용된 출처가 아닌 경우, GitHub Pages를 기본 허용
    header("Access-Control-Allow-Origin: https://azimam5649-ux.github.io");
}

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

// OPTIONS 프리플라이트 요청은 여기서 바로 끝내기
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ===== JSON 입력 헬퍼 =====
function read_json_input() {
    $raw = file_get_contents('php://input');
    if ($raw === '' || $raw === false) return null;

    $data = json_decode($raw, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        return null;
    }
    return $data;
}

// ===== NAS 저장 경로 설정 (리눅스 절대 경로 사용) =====
// ★ NAS File Station에서 복사하여 100% 일치시켜야 합니다.
define('PATH_BOM',          '/volume1/SAERP List/SAERP BOM List/');
define('PATH_COORD',        '/volume1/SAERP List/SAERP 좌표데이터 List/');