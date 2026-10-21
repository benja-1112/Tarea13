# Tarea 13 — Gestión de autos

Página para ver, modificar y agregar vehículos de la automotora. La aplicación usa la estructura de la clase: PHP, MySQL y Docker Compose.

Integrantes: completar nombre y apellido.

## Requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) en ejecución.

## Cómo levantarla

En esta carpeta:

```bash
docker compose up -d --build
```

Si ya habías levantado el proyecto antes y la base no muestra los autos de prueba, hay que recrear el volumen para que vuelva a correr `api/config/init.sql`:

```bash
docker compose down -v
docker compose up -d --build
```

Cuando los contenedores estén listos:

- Aplicación: http://localhost:8080
- phpMyAdmin: http://localhost:8081

## Qué se puede hacer

- Ver el listado de autos con su marca, modelo, año, precio y estado.
- Abrir un auto, ver todos sus datos y modificarlos. Al guardar aparece un mensaje de confirmación.
- Agregar un auto eligiendo una marca que ya existe en la base. El auto nuevo queda en el listado.

## Base de datos

Las credenciales están en `.env` y `api/.env`.

| Dato | Valor |
| --- | --- |
| Host dentro de Docker | `db` |
| Base | `mi_base_de_datos` |
| Usuario root | `root` / `root_password` |
| Usuario de la app en Compose | `usuario` / `password` |

La API se conecta con el usuario de `api/.env`. Las tablas `MARCAS` y `VEHICULOS` se crean con el script de prueba y no hay que modificar su estructura.

## Para detenerla

```bash
docker compose down
```
