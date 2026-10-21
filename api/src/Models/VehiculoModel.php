<?php
namespace App\Models;

class VehiculoModel {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    private function sqlConMarca() {
        return 'SELECT v.id_vehiculo, v.id_marca, v.modelo, v.anio, v.precio, v.estado,
                       m.nombre_marca, m.pais_origen
                FROM VEHICULOS v
                LEFT JOIN MARCAS m ON v.id_marca = m.id_marca';
    }

    public function listar() {
        $stmt = $this->db->query($this->sqlConMarca() . ' ORDER BY v.id_vehiculo');
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function obtener($id) {
        $stmt = $this->db->prepare($this->sqlConMarca() . ' WHERE v.id_vehiculo = ?');
        $stmt->execute([(int) $id]);
        $fila = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $fila ?: null;
    }

    public function crear($datos) {
        $stmt = $this->db->prepare(
            'INSERT INTO VEHICULOS (id_marca, modelo, anio, precio, estado)
             VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $datos['id_marca'],
            $datos['modelo'],
            $datos['anio'],
            $datos['precio'],
            $datos['estado'],
        ]);
        return (int) $this->db->lastInsertId();
    }

    public function actualizar($id, $datos) {
        $stmt = $this->db->prepare(
            'UPDATE VEHICULOS
             SET id_marca = ?, modelo = ?, anio = ?, precio = ?, estado = ?
             WHERE id_vehiculo = ?'
        );
        $stmt->execute([
            $datos['id_marca'],
            $datos['modelo'],
            $datos['anio'],
            $datos['precio'],
            $datos['estado'],
            (int) $id,
        ]);
        return $stmt->rowCount() >= 0;
    }
}
