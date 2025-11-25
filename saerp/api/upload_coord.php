<?php
// upload_coord.php: 클라이언트에서 받은 파일을 NAS에 저장하고 DB에 기록

require_once __DIR__ . '/config.php'; // config.php 포함

// 405 Method Not Allowed 오류 방지를 위해 POST 요청인지 확인
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => '잘못된 요청입니다. POST 메서드를 사용하세요.'], JSON_UNESCAPED_UNICODE);
    exit;
}

// 1. 파일이 전송되었는지 확인
if (!isset($_FILES['coordFile'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => '파일(coordFile)이 전송되지 않았습니다.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$file = $_FILES['coordFile'];
$fileName = basename($file['name']);
$targetDir = PATH_COORD;
$targetPath = $targetDir . $fileName;
$tempPath = $file['tmp_name'];

// 2. 폴더 존재 여부 확인 (list_coord.php와 동일)
if (!is_dir($targetDir)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => '저장 폴더를 찾을 수 없습니다: ' . $targetDir], JSON_UNESCAPED_UNICODE);
    exit;
}

// 3. 파일 크기 및 오류 확인
if ($file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => '파일 업로드 오류: ' . $file['error']], JSON_UNESCAPED_UNICODE);
    exit;
}

// 4. 파일을 임시 위치에서 최종 위치로 이동
// 이 단계가 실패하면 권한(405 오류의 근본 원인) 또는 용량 문제가 있을 수 있습니다.
if (!move_uploaded_file($tempPath, $targetPath)) {
    http_response_code(500);
    // NAS 폴더의 http 사용자 쓰기 권한 및 PHP upload_tmp_dir 설정을 확인하세요.
    echo json_encode(['success' => false, 'message' => '파일을 최종 경로로 이동하는 데 실패했습니다. 권한 문제를 확인하세요.'], JSON_UNESCAPED_UNICODE);
    exit;
}

// 5. DB에 파일 정보 기록 (예시)
// ★ MariaDB에 'saerp_files' 테이블이 있다고 가정합니다.
$file_id = sha1('coord|' . $fileName);
$file_size = $file['size'];
$file_type = 'coord'; // coord 또는 bom
$now = date('Y-m-d H:i:s');

$stmt = $mysqli->prepare("INSERT INTO saerp_files (id, name, type, size, saved_at) VALUES (?, ?, ?, ?, ?) 
                         ON DUPLICATE KEY UPDATE size=?, saved_at=?");

if ($stmt) {
    $stmt->bind_param("sssisss", $file_id, $fileName, $file_type, $file_size, $now, $file_size, $now);
    $stmt->execute();
    $stmt->close();
}
// DB 기록 실패 시에도 파일 저장은 성공했으므로 성공 응답을 보냅니다.

http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => '파일 업로드 및 저장 성공',
    'fileName' => $fileName,
], JSON_UNESCAPED_UNICODE);