<?php
// list_files.php

// 1. config.php 파일을 포함하여 PATH_BOM, PATH_COORD 상수에 접근합니다.
require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');

// type=bom | coord
$type = $_GET['type'] ?? '';

if ($type === 'bom') {
    // BOM 업로드 스크립트(upload_bom.php)와 동일한 경로 상수 사용
    $baseDir = rtrim(PATH_BOM, '/').'/';
    $baseUrl = '/saerp_data/bom/';   // 웹에서 접근 가능한 URL prefix
} elseif ($type === 'coord') {
    // 2. 좌표 업로드 스크립트(upload_coord.php)와 동일한 경로 상수 사용
    $baseDir = rtrim(PATH_COORD, '/').'/';
    $baseUrl = '/saerp_data/coord/';
} else {
    echo json_encode([
        'success' => false,
        'message' => '잘못된 type 입니다. (bom | coord)'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!is_dir($baseDir)) {
    // 파일 경로 불일치 시, 어떤 경로를 찾았는지 출력하여 디버깅을 돕습니다.
    echo json_encode([
        'success' => false,
        'message' => '폴더를 찾을 수 없습니다: ' . $baseDir,
        'debug'   => 'PATH_COORD 상수의 경로 문자열을 다시 확인하십시오.' // 디버그 힌트 추가
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$files = [];
// 🚨 opendir()이 실패하는 경우 (권한 또는 open_basedir 문제)를 대비한 디버깅 추가
$dh = opendir($baseDir);

if ($dh === false) {
    echo json_encode([
        'success' => false,
        'message' => '폴더를 열 수 없습니다. (권한 또는 open_basedir 설정 확인 필요)',
        'path'    => $baseDir
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

while (($file = readdir($dh)) !== false) {
    if ($file === '.' || $file === '..') continue;

    $path = $baseDir . $file;
    if (!is_file($path)) continue;

    $files[] = [
        // 파일마다 고정 ID (파일명 기준 해시)
        'id'        => sha1($type . '|' . $file),
        'name'      => $file,
        'size'      => filesize($path),
        'type'      => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'savedAt'   => date('c', filemtime($path)), // ISO8601
        'updatedAt' => null,
        // 웹에서 다시 다운로드할 수 있는 경로
        'url'       => $baseUrl . rawurlencode($file),
    ];
}

closedir($dh);

echo json_encode([
    'success' => true,
    'files'   => $files,
], JSON_UNESCAPED_UNICODE);