<?php
namespace App\Controllers;

use App\Models\MarcaModel;

class MarcaController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function listar() {
        $modelo = new MarcaModel($this->db);
        echo json_encode([
            'status' => 'ok',
            'data' => $modelo->listar(),
        ], JSON_UNESCAPED_UNICODE);
    }
}
