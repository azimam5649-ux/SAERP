<?php
// /volume1/web/saerp/api/list_bom.php 같은 위치에 두고 경로는 환경에 맞게 수정
header('Content-Type: application/json; charset=utf-8');

$dir = '/volume1/saerp/BOM';  // 🔴 실제 BOM 저장 경로로 수정

if (!is_dir($dir)) {
    echo json_encode(['success' => false, 'message' => 'BOM 폴더를 찾을 수 없습니다.']);
    exit;
}

$files = [];
$dh = opendir($dir);
if ($dh === false) {
    echo json_encode(['success' => false, 'message' => 'BOM 폴더를 열 수 없습니다.']);
    exit;
}

while (($f = readdir($dh)) !== false) {
    if ($f === '.' || $f === '..') continue;
    $path = $dir . '/' . $f;
    if (!is_file($path)) continue;

    $stat = stat($path);
    $files[] = [
        // id 는 기존 구조랑 비슷하게 아무거나 유니크하게만
        'id'       => sha1($f . $stat['mtime']),
        'name'     => $f,
        'size'     => $stat['size'],
        'type'     => 'application/vnd.ms-excel',
        'savedAt'  => date('c', $stat['mtime']),
        'updatedAt'=> null,
        // 필요하면 JS 에서 바로 다운/파싱할 수 있도록 URL 도 같이 내려주기
        'url'      => '/saerp/BOM/' . rawurlencode($f),
    ];
}

closedir($dh);

echo json_encode([
    'success' => true,
    'files'   => $files,
]);
