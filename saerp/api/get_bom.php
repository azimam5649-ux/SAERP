<?php
// NAS 실제 BOM 위치
$base = "\\\\SAVE\\SAERP List\\SAERP BOM List\\";

// 파일명 받기
$name = $_GET['name'] ?? '';
$name = basename($name); // 보안 처리

$path = $base . $name;

// 파일 존재 체크
if (!file_exists($path)) {
    http_response_code(404);
    echo "File not found: " . $path;
    exit;
}

// MIME 타입 자동 감지
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$type = finfo_file($finfo, $path);
finfo_close($finfo);

header("Content-Type: " . $type);
header("Content-Disposition: inline; filename=\"$name\"");
header("Content-Length: " . filesize($path));

// PHP가 파일 읽어서 출력
readfile($path);
