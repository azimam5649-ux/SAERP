<?php
require_once __DIR__ . '/config.php';
header('Content-Type: application/json; charset=utf-8');

$dir = rtrim(PATH_EXCEL, '/').'/';

if (!is_dir($dir)) {
    echo json_encode(['success'=>false, 'files'=>[]]);
    exit;
}

$files = [];
$h = opendir($dir);

while (($f = readdir($h)) !== false) {
    if ($f === '.' || $f === '..') continue;

    $full = $dir . $f;
    if (is_file($full)) {
        $st = stat($full);
        $files[] = [
            'name'=>$f,
            'size'=>$st['size'],
            'savedAt'=>date('c', $st['mtime']),
        ];
    }
}
closedir($h);

echo json_encode(['success'=>true, 'files'=>$files]);
