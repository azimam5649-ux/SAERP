<?php
require_once 'config.php';

if (!isset($_FILES['file'])) {
    echo json_encode(['ok' => false, 'msg' => '업로드된 파일이 없습니다.']);
    exit;
}

$name = basename($_FILES['file']['name']);
$target = PATH_COORD . $name;

if (move_uploaded_file($_FILES['file']['tmp_name'], $target)) {
    echo json_encode(['ok' => true, 'msg' => '좌표데이터 저장 완료']);
} else {
    echo json_encode(['ok' => false, 'msg' => '좌표데이터 저장 실패']);
}
?>
