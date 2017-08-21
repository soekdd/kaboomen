<?php
require 'settings.php';
function directoryToArray($directory,$extension) {
    $filter = '/.+\.'.$extension.'/i';
    $arrayItems = array();
    $handler = opendir($directory);
    if ($handler) {
        while (false !== ($file = readdir($handler))) {
            preg_match_all($filter, $file, $matches);
            if ($matches) {
                if (!is_dir($directory . DIRECTORY_SEPARATOR . $file)) {
                    $arrayItems[] = substr($file,0,-(strlen($extension)+1));
                }
            }
        }
        closedir($handler);
    }
    return $arrayItems;
}

echo json_encode(directoryToArray($c['levelFolder'],$c['levelExtension']));
?>