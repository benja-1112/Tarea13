// front/dist/js/api.js
// El mensajero: el HTML nunca habla con PHP directo. Pasa por acá.

const API = {
    // En Docker: http://localhost:8080/api
    urlBase: '/api',

    async request(endpoint, method = 'GET', data = null) {
        const url = this.urlBase + endpoint;

        const opciones = {
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };

        // GET no lleva body. POST/PUT sí.
        if (data) {
            opciones.body = JSON.stringify(data);
        }

        try {
            const respuesta = await fetch(url, opciones);
            const json = await respuesta.json();
            return json;
        } catch (error) {
            console.error('Error de conexión con la API:', error);
            return { status: 'error', message: 'No se pudo conectar con la API' };
        }
    },

    marcas() {
        return this.request('/marcas');
    },

    vehiculos(pagina = 1, ultima = false) {
        const params = new URLSearchParams({
            pagina: String(pagina),
            por_pagina: '4'
        });
        if (ultima) {
            params.set('ultima', '1');
        }
        return this.request('/vehiculos?' + params.toString());
    },

    vehiculo(id) {
        return this.request('/vehiculos/' + encodeURIComponent(id));
    },

    crearVehiculo(datos) {
        return this.request('/vehiculos', 'POST', datos);
    },

    actualizarVehiculo(id, datos) {
        return this.request('/vehiculos/' + encodeURIComponent(id), 'PUT', datos);
    },

    eliminarVehiculo(id) {
        return this.request('/vehiculos/' + encodeURIComponent(id), 'DELETE');
    }
};
