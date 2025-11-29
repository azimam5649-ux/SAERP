<?php
// config.php

// 에러 표시 켜기 (디버깅용)
ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');

// CORS 설정
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
header("Access-Control-Allow-Origin: *"); // 테스트용 전체 허용
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ★ 경로 설정 (오타 없는지 꼭 확인!)
define('PATH_BOM',   '/volume1/SAERP List/SAERP BOM List/');
define('PATH_COORD', '/volume1/SAERP List/SAERP 좌표데이터 List/');
?>