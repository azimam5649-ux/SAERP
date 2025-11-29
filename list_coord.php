<?php
// list_coord.php: NAS에 저장된 좌표 데이터 목록을 JSON으로 반환

require_once __DIR__ . '/config.php'; 

$baseDir = rtrim(PATH_COORD, '/').'/';
// ★ 이 경로는 웹 브라우저에서 NAS 폴더에 접근하는 URL prefix와 일치해야 합니다.
$baseUrl = '/saerp_data/coord/'; 

// 1. 경로 존재 여부 확인 (경로 불일치 오류 진단)
if (!is_dir($baseDir)) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => '폴더를 찾을 수 없습니다 (경로 불일치): ' . $baseDir,
        'hint'    => 'config.php의 PATH_COORD 경로를 NAS File Station에서 복사하여 다시 붙여넣으세요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$files = [];
// 2. 폴더 열기 시도 (open_basedir 또는 권한 오류 진단)
$dh = @opendir($baseDir); 

if ($dh === false) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => '폴더를 열 수 없습니다 (open_basedir 또는 Linux 권한 오류)',
        'path'    => $baseDir,
        'hint'    => 'NAS Web Station의 PHP 프로필에서 open_basedir 설정에 이 경로를 추가해야 합니다.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

while (($file = readdir($dh)) !== false) {
    if ($file === '.' || $file === '..') continue;

    $path = $baseDir . $file;
    if (!is_file($path)) continue;

    $files[] = [
        'id'        => sha1('coord|' . $file),
        'name'      => $file,
        'size'      => filesize($path),
        'type'      => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'savedAt'   => date('c', filemtime($path)), // 파일의 마지막 수정 시간
        'updatedAt' => null,
        'url'       => $baseUrl . rawurlencode($file),
    ];
}

closedir($dh);

echo json_encode([
    'success' => true,
    'files'   => $files,
], JSON_UNESCAPED_UNICODE);