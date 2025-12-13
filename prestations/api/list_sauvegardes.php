<?php
// Point d'entrée minimal pour lister les fichiers JSON dans le dossier Sauvegarde.
// Nécessaire car les navigateurs ne peuvent pas lister un répertoire via JavaScript côté client.
// Compatible avec un hébergement classique (Apache/Nginx + PHP).

header('Content-Type: application/json; charset=utf-8');

$dir = realpath(__DIR__ . '/../Sauvegarde');
if ($dir === false || !is_dir($dir)) {
    http_response_code(500);
    echo json_encode(['error' => 'Dossier Sauvegarde introuvable.']);
    exit;
}

$pattern = $dir . DIRECTORY_SEPARATOR . '*.json';
$files = glob($pattern) ?: [];
$files = array_filter($files, 'is_file');

if (empty($files)) {
    echo json_encode([
        'latest' => null,
        'files' => [],
    ]);
    exit;
}

usort($files, function ($a, $b) {
    return filemtime($b) <=> filemtime($a);
});

$latest = basename($files[0]);
$basenames = array_map('basename', $files);

echo json_encode([
    'latest' => $latest,
    'files' => $basenames,
], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
