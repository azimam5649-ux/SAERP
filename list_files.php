<?php
// list_files.php
header('Content-Type: application/json; charset=utf-8');

// type=bom | coord
$type = $_GET['type'] ?? '';

if ($type === 'bom') {
    // 👉 여기 NAS 상의 BOM 폴더 경로로 변경
    $baseDir = '/volume1/saerp_data/bom/';
    $baseUrl = '/saerp_data/bom/';   // 웹에서 접근 가능한 URL prefix
} elseif ($type === 'coord') {
    // 👉 여기 NAS 상의 좌표 폴더 경로로 변경
    $baseDir = '/volume1/saerp_data/coord/';
    $baseUrl = '/saerp_data/coord/';
} else {
    echo json_encode([
        'success' => false,
        'message' => '잘못된 type 입니다. (bom | coord)'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!is_dir($baseDir)) {
    echo json_encode([
        'success' => false,
        'message' => '폴더를 찾을 수 없습니다: ' . $baseDir
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$files = [];
$dh = opendir($baseDir);

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
