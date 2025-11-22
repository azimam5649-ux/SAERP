<?php
// NAS 실제 좌표데이터 위치
$base = "\\\\SAVE\\SAERP List\\SAERP 좌표데이터 List\\";

$name = $_GET['name'] ?? '';
$name = basename($name);

$path = $base . $name;

if (!file_exists($path)) {
    http_response_code(404);
    echo "File not found: " . $path;
    exit;
}

$finfo = finfo_open(FILEINFO_MIME_TYPE);
$type = finfo_file($finfo, $path);
finfo_close($finfo);

header("Content-Type: " . $type);
header("Content-Disposition: inline; filename=\"$name\"");
header("Content-Length: " . filesize($path));

readfile($path);
