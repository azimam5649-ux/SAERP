<?php
// signup.php

header('Content-Type: application/json');
// CORS 허용 설정 (필요한 경우, 실제 환경에 맞게 수정)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$response = ['success' => false, 'message' => '알 수 없는 오류'];

// 1. POST 요청 데이터 수신
$json_data = file_get_contents('php://input');
$data = json_decode($json_data, true);

if (!isset($data['id'], $data['company'], $data['phone'], $data['email'], $data['pw'])) {
    $response['message'] = '필수 데이터가 누락되었습니다.';
    echo json_encode($response);
    exit();
}

// 2. 데이터 정리 및 비밀번호 해시 처리
$id      = trim($data['id']);
$company = trim($data['company']);
$phone   = trim($data['phone']);
$email   = trim($data['email']);
$password_plain = $data['pw'];

// ⚠️ 보안을 위해 비밀번호는 반드시 해시 처리해야 합니다.
$password_hash = password_hash($password_plain, PASSWORD_DEFAULT); 
// 현재 DB 스키마(image_9eb57f.jpg)에 'password_hash' 컬럼이 있으므로 해당 이름을 사용해야 합니다.

// 3. DB 연결 및 저장 (MariaDB 연결 정보는 NAS 설정에 따라 변경해야 함)
$servername = "localhost";
$username   = "root";     // ⚠️ NAS DB 사용자 이름으로 변경하세요
$db_password = "Bb83205959!"; // ⚠️ NAS DB 비밀번호로 변경하세요
$dbname     = "saerp";

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8mb4", $username, $db_password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 3-1. ID 중복 검사
    $stmt = $conn->prepare("SELECT id FROM users WHERE userid = ?");
    $stmt->execute([$id]);
    if ($stmt->rowCount() > 0) {
        $response['message'] = '이미 존재하는 아이디입니다.';
        echo json_encode($response);
        exit();
    }

    // 3-2. 데이터 삽입 (Prepared Statement 사용으로 SQL 인젝션 방어)
    $sql = "INSERT INTO users (userid, company, phone, email, password_hash, created_at) 
            VALUES (?, ?, ?, ?, ?, NOW())";
    $stmt = $conn->prepare($sql);
    
    // image_9eb57f.jpg에서 id 컬럼은 자동 증가하는 PK이므로 제외하고,
    // 'userid', 'company', 'phone', 'email', 'password_hash'에 매핑합니다.
    $stmt->execute([$id, $company, $phone, $email, $password_hash]);

    // 4. 응답 전송
    $response['success'] = true;
    $response['message'] = '회원가입이 성공적으로 완료되었습니다.';

} catch (PDOException $e) {
    $response['message'] = "DB 오류: " . $e->getMessage();
    error_log("Signup DB Error: " . $e->getMessage()); // 서버 로그에 기록
}

// 5. 최종 응답 출력
echo json_encode($response);

?>