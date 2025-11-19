<?php
// signup.php : index.html의 회원가입 폼에서 POST로 호출되는 백엔드

error_reporting(E_ALL);
ini_set('display_errors', 1);

// 1) GET으로 접근하면 그냥 메인으로 돌려보내기
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: index.html');
    exit;
}

// 2) DB 연결 정보
$host = "localhost";
$user = "root";          // 실제 MariaDB 사용자
$pass = "Bb83205959!"; // 실제 비밀번호
$db   = "saerp";

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    // 에러 시 간단히 메인으로 돌려보내되, 로그만 남겨도 됨
    die("DB 연결 실패: " . $conn->connect_error);
}

// 3) 폼 값 받기 (index.html에서 보낸 name과 반드시 같아야 함)
$userid   = trim($_POST['userid']   ?? '');
$company  = trim($_POST['company']  ?? '');
$phone    = trim($_POST['phone']    ?? '');
$email    = trim($_POST['email']    ?? '');
$password = $_POST['password']      ?? '';

// 기본 체크
if ($userid === '' || $company === '' || $phone === '' || $email === '' || $password === '') {
    header('Location: index.html?join=fail');
    exit;
}

// 비밀번호 해시
$hash = password_hash($password, PASSWORD_DEFAULT);

// 4) INSERT (아이디 중복이면 에러)
$stmt = $conn->prepare("
    INSERT INTO users (userid, company, phone, email, password_hash)
    VALUES (?, ?, ?, ?, ?)
");
$stmt->bind_param("sssss", $userid, $company, $phone, $email, $hash);

if ($stmt->execute()) {
    // 성공 → index.html로 돌려보내면서 ?join=ok 파라미터 붙이기
    header('Location: index.html?join=ok');
    exit;
} else {
    // 중복아이디 등 에러
    header('Location: index.html?join=dup');
    exit;
}
