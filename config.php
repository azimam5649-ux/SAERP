<?php
// config.php - MariaDB 공통 접속 설정

ini_set('display_errors', 1);
error_reporting(E_ALL);

// DB 접속 정보 (db_test.php에서 사용한 값 그대로)
$DB_HOST = '127.0.0.1';   // 또는 localhost
$DB_PORT = 3307;          // MariaDB 10 포트
$DB_NAME = 'saerp';       // 사용 중인 DB 이름
$DB_USER = 'saerp_web';   // phpMyAdmin에서 만든 계정
$DB_PASS = 'Bb83205959!';  // 그 계정 비밀번호

$dsn = "mysql:host=$DB_HOST;port=$DB_PORT;dbname=$DB_NAME;charset=utf8mb4";

try {
    $pdo = new PDO($dsn, $DB_USER, $DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo "DB 연결 실패: " . $e->getMessage();
    exit;
}
