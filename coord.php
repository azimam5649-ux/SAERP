<?php
header('Content-Type: application/json; charset=utf-8');

$dir = '/volume1/saerp/COORD';  // 🔴 실제 좌표 파일 경로로 수정

if (!is_dir($dir)) {
    echo json_encode(['success' => false, 'message' => '좌표 폴더를 찾을 수 없습니다.']);
    exit;
}

$files = [];
$dh = opendir($dir);
if ($dh === false) {
    echo json_encode(['success' => false, 'message' => '좌표 폴더를 열 수 없습니다.']);
    exit;
}

while (($f = readdir($dh)) !== false) {
    if ($f === '.' || $f === '..') continue;
    $path = $dir . '/' . $f;
    if (!is_file($path)) continue;

    $stat = stat($path);
    $files[] = [
        'id'       => sha1($f . $stat['mtime']),
        'name'     => $f,
        'size'     => $stat['size'],
        'type'     => 'application/vnd.ms-excel',
        'savedAt'  => date('c', $stat['mtime']),
        'updatedAt'=> null,
        'url'      => '/saerp/COORD/' . rawurlencode($f),
    ];
}

closedir($dh);

echo json_encode([
    'success' => true,
    'files'   => $files,
]);
