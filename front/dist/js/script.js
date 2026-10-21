// front/dist/js/script.js
// Lógica de cada pantalla: listado, ficha y alta.

const ANIO_MIN = 1900;
const ANIO_MAX = new Date().getFullYear() + 1;

document.addEventListener('DOMContentLoaded', () => {
    const pagina = document.body.dataset.pagina;
    if (pagina === 'listado') iniciarListado();
    if (pagina === 'vehiculo') iniciarFicha();
    if (pagina === 'agregar') iniciarAlta();
});

function iniciarListado() {
    const aviso = document.querySelector('#aviso');
    const params = new URLSearchParams(window.location.search);
    if (params.get('agregado') === '1') {
        mostrarAviso(aviso, 'ok', 'El auto se guardó correctamente y ya figura en el listado.');
        params.delete('agregado');
        const limpia = params.toString();
        history.replaceState({}, '', window.location.pathname + (limpia ? '?' + limpia : ''));
    }
    cargarListado();
}

async function cargarListado() {
    const contenedor = document.querySelector('#listado');
    const aviso = document.querySelector('#aviso');
    contenedor.replaceChildren();
    contenedor.append(mensajeEstado('Cargando autos...'));

    const respuesta = await API.vehiculos();
    contenedor.replaceChildren();

    if (respuesta.status !== 'ok' || !Array.isArray(respuesta.data)) {
        mostrarAviso(aviso, 'error', respuesta.message || 'No se pudo cargar el listado.');
        return;
    }

    if (respuesta.data.length === 0) {
        contenedor.append(mensajeEstado('Todavía no hay autos cargados.'));
        return;
    }

    respuesta.data.forEach((auto) => {
        contenedor.append(tarjetaAuto(auto));
    });
}

function tarjetaAuto(auto) {
    const enlace = document.createElement('a');
    enlace.className = 'auto-card';
    enlace.href = './dist/pages/vehiculo.html?id=' + encodeURIComponent(auto.id_vehiculo);

    const marca = document.createElement('p');
    marca.className = 'auto-card__marca';
    marca.textContent = auto.nombre_marca || 'Sin marca';

    const modelo = document.createElement('h2');
    modelo.className = 'auto-card__modelo';
    modelo.textContent = auto.modelo || 'Sin modelo';

    const datos = document.createElement('ul');
    datos.className = 'auto-card__datos';
    datos.append(dato('Año', auto.anio ? String(auto.anio) : 'Sin año'));
    datos.append(dato('Precio', formatoPrecio(auto.precio)));

    const estado = document.createElement('span');
    estado.className = 'estado estado--' + (auto.estado === 'Nuevo' ? 'nuevo' : 'usado');
    estado.textContent = auto.estado || 'Sin estado';

    enlace.append(marca, modelo, datos, estado);
    return enlace;
}

function dato(etiqueta, valor) {
    const item = document.createElement('li');
    const nombre = document.createElement('span');
    nombre.textContent = etiqueta;
    const contenido = document.createElement('strong');
    contenido.textContent = valor;
    item.append(nombre, contenido);
    return item;
}

async function iniciarFicha() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const aviso = document.querySelector('#aviso');
    const ficha = document.querySelector('#ficha');

    if (!id) {
        mostrarAviso(aviso, 'error', 'Falta el identificador del auto.');
        return;
    }

    const [autoRes, marcasRes] = await Promise.all([API.vehiculo(id), API.marcas()]);

    if (autoRes.status !== 'ok' || !autoRes.data) {
        mostrarAviso(aviso, 'error', autoRes.message || 'No se encontró el auto.');
        return;
    }
    if (marcasRes.status !== 'ok' || !Array.isArray(marcasRes.data)) {
        mostrarAviso(aviso, 'error', marcasRes.message || 'No se pudieron cargar las marcas.');
        return;
    }

    pintarResumen(autoRes.data);
    const form = document.querySelector('#form-vehiculo');
    form.elements.anio.max = ANIO_MAX;
    llenarMarcas(form.querySelector('[name="id_marca"]'), marcasRes.data, autoRes.data.id_marca);
    llenarFormulario(form, autoRes.data);
    ficha.hidden = false;

    form.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        limpiarErrores(form);
        const datos = leerFormulario(form);
        const errores = validarVehiculo(datos);
        if (Object.keys(errores).length) {
            pintarErrores(form, errores);
            mostrarAviso(aviso, 'error', 'Revisá los campos marcados.');
            return;
        }

        const respuesta = await API.actualizarVehiculo(id, datos);
        if (respuesta.status !== 'ok') {
            if (respuesta.errores) pintarErrores(form, respuesta.errores);
            mostrarAviso(aviso, 'error', respuesta.message || 'No se pudieron guardar los cambios.');
            return;
        }

        pintarResumen(respuesta.data);
        llenarFormulario(form, respuesta.data);
        mostrarAviso(aviso, 'ok', respuesta.message || 'Los datos se modificaron correctamente.');
    });
}

async function iniciarAlta() {
    const aviso = document.querySelector('#aviso');
    const form = document.querySelector('#form-vehiculo');
    form.elements.anio.max = ANIO_MAX;
    const marcasRes = await API.marcas();

    if (marcasRes.status !== 'ok' || !Array.isArray(marcasRes.data) || marcasRes.data.length === 0) {
        mostrarAviso(aviso, 'error', marcasRes.message || 'No hay marcas para asignar al auto.');
        form.querySelector('button[type="submit"]').disabled = true;
        return;
    }

    llenarMarcas(form.querySelector('[name="id_marca"]'), marcasRes.data, '');

    form.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        limpiarErrores(form);
        const datos = leerFormulario(form);
        const errores = validarVehiculo(datos);
        if (Object.keys(errores).length) {
            pintarErrores(form, errores);
            mostrarAviso(aviso, 'error', 'Revisá los campos marcados.');
            return;
        }

        const respuesta = await API.crearVehiculo(datos);
        if (respuesta.status !== 'ok') {
            if (respuesta.errores) pintarErrores(form, respuesta.errores);
            mostrarAviso(aviso, 'error', respuesta.message || 'No se pudo guardar el auto.');
            return;
        }

        window.location.href = '/front/index.html?agregado=1';
    });
}

function pintarResumen(auto) {
    document.querySelector('#resumen-marca').textContent = auto.nombre_marca || 'Sin marca';
    document.querySelector('#resumen-pais').textContent = auto.pais_origen || 'Sin país';
    document.querySelector('#resumen-modelo').textContent = auto.modelo || 'Sin modelo';
    document.querySelector('#resumen-anio').textContent = auto.anio ? String(auto.anio) : 'Sin año';
    document.querySelector('#resumen-precio').textContent = formatoPrecio(auto.precio);
    document.querySelector('#resumen-estado').textContent = auto.estado || 'Sin estado';
}

function llenarMarcas(select, marcas, seleccionada) {
    select.replaceChildren();
    const vacio = document.createElement('option');
    vacio.value = '';
    vacio.textContent = 'Elegí una marca';
    select.append(vacio);

    marcas.forEach((marca) => {
        const opcion = document.createElement('option');
        opcion.value = String(marca.id_marca);
        const pais = marca.pais_origen ? ' (' + marca.pais_origen + ')' : '';
        opcion.textContent = marca.nombre_marca + pais;
        if (String(marca.id_marca) === String(seleccionada)) opcion.selected = true;
        select.append(opcion);
    });
}

function llenarFormulario(form, auto) {
    form.elements.modelo.value = auto.modelo || '';
    form.elements.anio.value = auto.anio || '';
    form.elements.precio.value = auto.precio !== null && auto.precio !== undefined ? auto.precio : '';
    form.elements.estado.value = auto.estado || '';
    if (auto.id_marca) form.elements.id_marca.value = String(auto.id_marca);
}

function leerFormulario(form) {
    return {
        id_marca: form.elements.id_marca.value,
        modelo: form.elements.modelo.value.trim(),
        anio: form.elements.anio.value.trim(),
        precio: form.elements.precio.value.trim(),
        estado: form.elements.estado.value
    };
}

function validarVehiculo(datos) {
    const errores = {};

    if (!datos.modelo) {
        errores.modelo = 'El modelo es obligatorio';
    } else if ([...datos.modelo].length > 50) {
        errores.modelo = 'El modelo no puede superar los 50 caracteres';
    }

    if (!datos.id_marca) {
        errores.id_marca = 'Tenés que elegir una marca';
    }

    if (!datos.estado) {
        errores.estado = 'El estado es obligatorio';
    } else if (datos.estado !== 'Nuevo' && datos.estado !== 'Usado') {
        errores.estado = 'El estado tiene que ser Nuevo o Usado';
    }

    if (datos.anio !== '') {
        const anio = Number(datos.anio);
        if (!Number.isInteger(anio) || anio < ANIO_MIN || anio > ANIO_MAX) {
            errores.anio = 'El año tiene que estar entre ' + ANIO_MIN + ' y ' + ANIO_MAX;
        }
    }

    if (datos.precio !== '') {
        const precio = Number(datos.precio);
        if (!Number.isFinite(precio) || precio < 0) {
            errores.precio = 'El precio tiene que ser un número mayor o igual a 0';
        } else if (precio > 99999999.99) {
            errores.precio = 'El precio no puede superar 99999999.99';
        }
    }

    return errores;
}

function pintarErrores(form, errores) {
    Object.keys(errores).forEach((campo) => {
        const input = form.elements[campo];
        if (!input) return;
        input.classList.add('is-invalid');
        input.setAttribute('aria-invalid', 'true');
        const ayuda = form.querySelector('[data-error-for="' + campo + '"]');
        if (ayuda) ayuda.textContent = errores[campo];
    });
}

function limpiarErrores(form) {
    form.querySelectorAll('.is-invalid').forEach((input) => {
        input.classList.remove('is-invalid');
        input.removeAttribute('aria-invalid');
    });
    form.querySelectorAll('[data-error-for]').forEach((ayuda) => {
        ayuda.textContent = '';
    });
}

function mostrarAviso(contenedor, tipo, mensaje) {
    if (!contenedor) return;
    contenedor.hidden = false;
    contenedor.className = 'aviso aviso--' + (tipo === 'ok' ? 'ok' : 'error');
    contenedor.textContent = mensaje;
}

function mensajeEstado(texto) {
    const parrafo = document.createElement('p');
    parrafo.className = 'estado-vacio';
    parrafo.textContent = texto;
    return parrafo;
}

function formatoPrecio(valor) {
    if (valor === null || valor === undefined || valor === '') return 'Sin precio';
    const numero = Number(valor);
    if (!Number.isFinite(numero)) return 'Sin precio';
    return new Intl.NumberFormat('es-UY', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(numero);
}
