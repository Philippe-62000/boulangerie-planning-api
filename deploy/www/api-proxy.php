<?php
// Proxy API pour rediriger les appels vers Render
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Gérer les requêtes OPTIONS (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// URL de base de l'API Render
$render_api_url = 'https://boulangerie-planning-api.onrender.com';

// Récupérer le chemin de l'API depuis l'URL
$request_uri = $_SERVER['REQUEST_URI'];
$api_path = '';

// Extraire le chemin après /api/
if (preg_match('/\/api\/(.*)/', $request_uri, $matches)) {
    $api_path = $matches[1];
}

// Construire l'URL complète vers Render
$target_url = $render_api_url . '/api/' . $api_path;

// Ajouter les paramètres de requête
if (!empty($_SERVER['QUERY_STRING'])) {
    $target_url .= '?' . $_SERVER['QUERY_STRING'];
}

// Préparer les headers
$headers = [];
foreach (getallheaders() as $name => $value) {
    if (strtolower($name) !== 'host') {
        $headers[] = "$name: $value";
    }
}

// Préparer les données POST/PUT
$post_data = null;
if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'PATCH'])) {
    $post_data = file_get_contents('php://input');
}

// Configuration cURL
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $target_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

// Méthode HTTP
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD']);

// Données POST/PUT
if ($post_data !== null) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, $post_data);
}

// Exécuter la requête
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$content_type = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);

// Gérer les erreurs cURL
if (curl_errno($ch)) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Erreur de connexion à l\'API',
        'message' => curl_error($ch),
        'target_url' => $target_url
    ]);
    curl_close($ch);
    exit();
}

curl_close($ch);

// Définir le code de statut HTTP
http_response_code($http_code);

// Définir le Content-Type
if ($content_type) {
    header('Content-Type: ' . $content_type);
}

// Retourner la réponse
echo $response;
?>
