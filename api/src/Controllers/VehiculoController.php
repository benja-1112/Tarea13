<?php
namespace App\Controllers;

use App\Models\MarcaModel;
use App\Models\VehiculoModel;

class VehiculoController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function listar() {
        $modelo = new VehiculoModel($this->db);
        $porPagina = isset($_GET['por_pagina']) ? (int) $_GET['por_pagina'] : 4;
        if ($porPagina < 1) {
            $porPagina = 4;
        }
        if ($porPagina > 20) {
            $porPagina = 20;
        }

        $total = $modelo->contar();
        $paginas = $total === 0 ? 0 : (int) ceil($total / $porPagina);
        $pagina = isset($_GET['pagina']) ? (int) $_GET['pagina'] : 1;
        if (isset($_GET['ultima']) && $_GET['ultima'] === '1' && $paginas > 0) {
            $pagina = $paginas;
        }
        if ($pagina < 1) {
            $pagina = 1;
        }
        if ($paginas > 0 && $pagina > $paginas) {
            $pagina = $paginas;
        }

        $data = $total === 0 ? [] : $modelo->listarPagina($porPagina, ($pagina - 1) * $porPagina);

        echo json_encode([
            'status' => 'ok',
            'data' => $data,
            'paginacion' => [
                'pagina' => $paginas === 0 ? 0 : $pagina,
                'por_pagina' => $porPagina,
                'total' => $total,
                'paginas' => $paginas,
            ],
        ], JSON_UNESCAPED_UNICODE);
    }

    public function ver($id) {
        $modelo = new VehiculoModel($this->db);
        $vehiculo = $modelo->obtener($id);

        if (!$vehiculo) {
            http_response_code(404);
            echo json_encode([
                'status' => 'error',
                'message' => 'No se encontró el vehículo',
            ], JSON_UNESCAPED_UNICODE);
            return;
        }

        echo json_encode([
            'status' => 'ok',
            'data' => $vehiculo,
        ], JSON_UNESCAPED_UNICODE);
    }

    public function crear() {
        $body = $this->leerJson();
        $errores = $this->validar($body);

        if ($errores) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => 'Revisá los datos del vehículo',
                'errores' => $errores,
            ], JSON_UNESCAPED_UNICODE);
            return;
        }

        $modelo = new VehiculoModel($this->db);
        $id = $modelo->crear($this->normalizar($body));
        $vehiculo = $modelo->obtener($id);

        http_response_code(201);
        echo json_encode([
            'status' => 'ok',
            'message' => 'El auto se guardó correctamente',
            'data' => $vehiculo,
        ], JSON_UNESCAPED_UNICODE);
    }

    public function actualizar($id) {
        $modelo = new VehiculoModel($this->db);
        if (!$modelo->obtener($id)) {
            http_response_code(404);
            echo json_encode([
                'status' => 'error',
                'message' => 'No se encontró el vehículo',
            ], JSON_UNESCAPED_UNICODE);
            return;
        }

        $body = $this->leerJson();
        $errores = $this->validar($body);

        if ($errores) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => 'Revisá los datos del vehículo',
                'errores' => $errores,
            ], JSON_UNESCAPED_UNICODE);
            return;
        }

        $modelo->actualizar($id, $this->normalizar($body));
        $vehiculo = $modelo->obtener($id);

        echo json_encode([
            'status' => 'ok',
            'message' => 'Los datos se modificaron correctamente',
            'data' => $vehiculo,
        ], JSON_UNESCAPED_UNICODE);
    }

    public function eliminar($id) {
        $modelo = new VehiculoModel($this->db);
        $vehiculo = $modelo->obtener($id);

        if (!$vehiculo) {
            http_response_code(404);
            echo json_encode([
                'status' => 'error',
                'message' => 'No se encontró el vehículo',
            ], JSON_UNESCAPED_UNICODE);
            return;
        }

        $modelo->eliminar($id);
        echo json_encode([
            'status' => 'ok',
            'message' => 'El auto se eliminó correctamente',
        ], JSON_UNESCAPED_UNICODE);
    }

    private function leerJson() {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
        return is_array($data) ? $data : [];
    }

    private function validar($body) {
        $errores = [];

        $modelo = isset($body['modelo']) ? trim((string) $body['modelo']) : '';
        if ($modelo === '') {
            $errores['modelo'] = 'El modelo es obligatorio';
        } elseif (preg_match('/^.{51,}$/us', $modelo)) {
            $errores['modelo'] = 'El modelo no puede superar los 50 caracteres';
        }

        $idMarca = isset($body['id_marca']) ? $body['id_marca'] : '';
        if ($idMarca === '' || $idMarca === null || !ctype_digit((string) $idMarca)) {
            $errores['id_marca'] = 'Tenés que elegir una marca';
        } else {
            $marcas = new MarcaModel($this->db);
            if (!$marcas->existe($idMarca)) {
                $errores['id_marca'] = 'La marca elegida no existe';
            }
        }

        $estado = isset($body['estado']) ? trim((string) $body['estado']) : '';
        if ($estado === '') {
            $errores['estado'] = 'El estado es obligatorio';
        } elseif (!in_array($estado, ['Nuevo', 'Usado'], true)) {
            $errores['estado'] = 'El estado tiene que ser Nuevo o Usado';
        }

        if (array_key_exists('anio', $body) && $body['anio'] !== '' && $body['anio'] !== null) {
            $anio = $body['anio'];
            $max = (int) date('Y') + 1;
            if (!ctype_digit((string) $anio) || (int) $anio < 1900 || (int) $anio > $max) {
                $errores['anio'] = 'El año tiene que estar entre 1900 y ' . $max;
            }
        }

        if (array_key_exists('precio', $body) && $body['precio'] !== '' && $body['precio'] !== null) {
            if (!is_numeric($body['precio']) || (float) $body['precio'] < 0) {
                $errores['precio'] = 'El precio tiene que ser un número mayor o igual a 0';
            } elseif ((float) $body['precio'] > 99999999.99) {
                $errores['precio'] = 'El precio no puede superar 99999999.99';
            }
        }

        return $errores;
    }

    private function normalizar($body) {
        $anio = (isset($body['anio']) && $body['anio'] !== '' && $body['anio'] !== null)
            ? (int) $body['anio']
            : null;
        $precio = (isset($body['precio']) && $body['precio'] !== '' && $body['precio'] !== null)
            ? number_format((float) $body['precio'], 2, '.', '')
            : null;

        return [
            'id_marca' => (int) $body['id_marca'],
            'modelo' => trim((string) $body['modelo']),
            'anio' => $anio,
            'precio' => $precio,
            'estado' => trim((string) $body['estado']),
        ];
    }
}
