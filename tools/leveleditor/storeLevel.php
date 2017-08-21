<?php
require 'settings.php';
$file = isset($_GET['level']) ? $_GET['level'] : '';
$content = isset($_GET['content']) ? $_GET['content'] : '';
$file = $c['levelFolder'] . DIRECTORY_SEPARATOR . $file . '.' . $c['levelExtension'];
$content = json_encode(json_decode($content));
if ($file!='' && $content!='' && $content!='[]' && $content!='{}') {
    file_put_contents($file,$content);
    die("Successfully stored at ".$file);
} else { 
    die("Missing parameter");
}
?>
