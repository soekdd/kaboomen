<?php
require 'settings.php';
$file = isset($_GET['level']) ? $_GET['level'] : '';
$file = $c['levelFolder'] . DIRECTORY_SEPARATOR . $file . '.' . $c['levelExtension'];
if (file_exists($file)) {
    echo json_encode(json_decode(file_get_contents($file)));
    die();
} else { 
    die("Level doesnt exist!");
}
?>
