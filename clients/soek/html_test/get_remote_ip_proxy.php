<?php
phpinfo();
error_reporting(0);
if (array_key_exists("HTTP_X_FORWARDED_FOR",$_SERVER)) {
    $parts = split(', ',$_SERVER["HTTP_X_FORWARDED_FOR"]);
    $ip = end($parts);
} else {
    $ip = $_SERVER["REMOTE_ADDR"];
}
header('Content-Type: application/json');
echo file_get_contents("http://ip-api.com/json/".$ip, true);
?>