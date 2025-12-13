<?php
// Listing minimal des sauvegardes JSON dans /prestations/Sauvegarde
// Compatible NAS Synology / Apache

header('Content-Type: application/json; charset=utf-8');

$saveDir = __DIR__;
$files = [];

foreach (glob($saveDir . DIRECTORY_SEPARATOR . '*.json') ?: [] as $filepath) {
    if (is_file($filepath)) {
        $files[] = basename($filepath);
    }
}

$latestFile = null;
$latestMtime = 0;

foreach ($files as $file) {
    $fullPath = $saveDir . DIRECTORY_SEPARATOR . $file;
    $mtime = @filemtime($fullPath);
    if ($mtime !== false && $mtime >= $latestMtime) {
        $latestMtime = $mtime;
        $latestFile = $file;
    }
}

echo json_encode([
    'latest' => $latestFile,
    'files'  => $files,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

