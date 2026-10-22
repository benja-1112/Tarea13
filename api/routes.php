<?php
// api/routes.php
// Acá se anota: "cuando pidan ESTA url, ejecutá ESTE controlador@método"

$router->get('/estado', 'EstadoController@ver');

$router->get('/marcas', 'MarcaController@listar');

$router->get('/vehiculos', 'VehiculoController@listar');
$router->get('/vehiculos/:id', 'VehiculoController@ver');
$router->post('/vehiculos', 'VehiculoController@crear');
$router->put('/vehiculos/:id', 'VehiculoController@actualizar');
$router->delete('/vehiculos/:id', 'VehiculoController@eliminar');
