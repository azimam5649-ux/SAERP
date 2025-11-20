<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

echo "<pre>";
echo "PHP Version: " . PHP_VERSION . "\n";
echo "mysqli 확장 로딩 여부: ";
var_dump(function_exists('mysqli_connect'));
echo "</pre>";
