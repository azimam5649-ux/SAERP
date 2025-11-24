<?php
require_once __DIR__ . '/config.php';
header('Content-Type: application/json; charset=utf-8');

$dir = rtrim(PATH_BOM, '/').'/';

if (!is_dir($dir)) {
    echo json_encode(['success' => false, 'message' => 'BOM 폴더를 찾을 수 없습니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$files = [];
$dh = opendir($dir);
if ($dh === false) {
    echo json_encode(['success' => false, 'message' => 'BOM 폴더를 열 수 없습니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}

while (($f = readdir($dh)) !== false) {
    if ($f === '.' || $f === '..') continue;

    $full = $dir . $f;
    if (!is_file($full)) continue;

    $stat = stat($full);
    $files[] = [
        'id'       => $f,
        'name'     => $f,
        'size'     => $stat['size'],
        'type'     => mime_content_type($full),
        'savedAt'  => date('c', $stat['mtime']),
        'updatedAt'=> null,
    ];
}
closedir($dh);

echo json_encode(['success' => true, 'files' => $files], JSON_UNESCAPED_UNICODE);
