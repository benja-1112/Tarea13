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

    public function contar() {
        return (int) $this->db->query('SELECT COUNT(*) FROM VEHICULOS')->fetchColumn();
    }

    public function listarPagina($limite, $offset) {
        $limite = (int) $limite;
        $offset = (int) $offset;
        $stmt = $this->db->query(
            $this->sqlConMarca() . " ORDER BY v.id_vehiculo LIMIT $limite OFFSET $offset"
        );
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

    public function eliminar($id) {
        $id = (int) $id;
        $this->db->beginTransaction();
        try {
            $venta = $this->db->prepare('DELETE FROM VENTAS WHERE id_vehiculo = ?');
            $venta->execute([$id]);
            $vehiculo = $this->db->prepare('DELETE FROM VEHICULOS WHERE id_vehiculo = ?');
            $vehiculo->execute([$id]);
            $this->db->commit();
            return $vehiculo->rowCount() > 0;
        } catch (\Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
}
