<?php
// CORS 허용
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

$allowed = [
    'http://172.30.1.42',
    'http://172.30.1.42:80',
    'https://azimam5649-ux.github.io',
    'https://saerp.synology.me',
];

if (in_array($origin, $allowed, true)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    // 필요하면 기본 허용 출처 하나 지정
    header("Access-Control-Allow-Origin: https://azimam5649-ux.github.io");
}

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
