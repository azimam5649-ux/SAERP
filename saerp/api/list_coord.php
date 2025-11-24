<?php
// list_coord.php: NAS에 저장된 좌표 데이터 목록을 JSON으로 반환

// 🚨 1. config.php 파일을 포함해야 CORS 헤더와 PATH_COORD 상수가 적용됩니다.
require_once __DIR__ . '/config.php';

// PATH_COORD 상수를 사용합니다.
$baseDir = rtrim(PATH_COORD, '/').'/';
// 웹에서 접근 가능한 URL prefix (NAS Web Station 설정에 따라 변경될 수 있음)
$baseUrl = '/saerp_data/coord/'; 

if (!is_dir($baseDir)) {
    // 2. 경로 불일치 오류 출력
    echo json_encode([
        'success' => false,
        'message' => '폴더를 찾을 수 없습니다 (경로 불일치): ' . $baseDir,
        'hint'    => 'config.php의 PATH_COORD 경로를 NAS File Station에서 복사하여 다시 붙여넣으세요.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$files = [];
// opendir() 실행 시 open_basedir 제한에 걸릴 수 있습니다.
$dh = opendir($baseDir);

if ($dh === false) {
    // 3. 권한/open_basedir 오류 출력
    // opendir 실패는 권한/open_basedir 제한이 가장 유력한 원인입니다.
    echo json_encode([
        'success' => false,
        'message' => '폴더를 열 수 없습니다 (open_basedir 또는 권한 오류)',
        'path'    => $baseDir,
        'hint'    => 'NAS Web Station에서 PHP 프로필의 open_basedir 설정을 확인하고 이 경로를 추가해야 합니다.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

while (($file = readdir($dh)) !== false) {
    if ($file === '.' || $file === '..') continue;

    $path = $baseDir . $file;
    if (!is_file($path)) continue;

    $files[] = [
        // 파일 정보 추출
        'id'        => sha1('coord|' . $file),
        'name'      => $file,
        'size'      => filesize($path),
        'type'      => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'savedAt'   => date('c', filemtime($path)), // ISO8601
        'updatedAt' => null,
        'url'       => $baseUrl . rawurlencode($file),
    ];
}

closedir($dh);

echo json_encode([
    'success' => true,
    'files'   => $files,
], JSON_UNESCAPED_UNICODE);