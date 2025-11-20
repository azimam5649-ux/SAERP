<?php
require_once 'config.php';

if (!isset($_FILES['file'])) {
    echo json_encode(['ok' => false, 'msg' => '엑셀 파일이 없습니다.']);
    exit;
}

$name = basename($_FILES['file']['name']);
$target = PATH_RESULT_EXCEL . $name;

if (move_uploaded_file($_FILES['file']['tmp_name'], $target)) {
    echo json_encode(['ok' => true, 'msg' => '결과값 엑셀 저장 완료']);
} else {
    echo json_encode(['ok' => false, 'msg' => '엑셀 저장 실패']);
}
?>
