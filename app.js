// =======================================================
// IMPORTANTE: REEMPLAZA ESTA URL POR LA QUE TE DÉ GOOGLE
// =======================================================
const SCRIPT_URL = 'AQUI_PEGAR_URL_DE_LA_WEB_APP'; 

// Categorías según el tipo de transacción
const categorias = {
    Ingreso: [
        'Mensualidad de Estudiante',
        'Inscripción',
        'Donación',
        'Otros Ingresos'
    ],
    Egreso: [
        'Pago a Maestro',
        'Pago a Personal',
        'Servicios (Agua, Luz, Gas)',
        'Mantenimiento e Infraestructura',
        'Material Escolar / Oficina',
        'Viáticos',
        'Otros Gastos'
    ]
};

// Referencias al DOM
const form = document.getElementById('transaccionForm');
const selectTipo = document.getElementById('tipo');
const selectCategoria = document.getElementById('categoria');
const btnGuardar = document.getElementById('btnGuardar');
const btnActualizar = document.getElementById('btnActualizar');
const tbody = document.getElementById('tablaTransacciones');

let datosGlobales = [];

// Evento: Cambiar las categorías según el tipo seleccionado
selectTipo.addEventListener('change', function() {
    const tipo = this.value;
    selectCategoria.innerHTML = '<option value="" disabled selected>Seleccione una categoría...</option>';
    
    if (categorias[tipo]) {
        categorias[tipo].forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            selectCategoria.appendChild(option);
        });
    }
});

// Función para formatear moneda
const formatearMoneda = (monto) => {
    return new Intl.NumberFormat('es-US', { style: 'currency', currency: 'USD' }).format(monto);
};

// Función principal para cargar datos desde Google Apps Script
async function cargarDatos() {
    if (SCRIPT_URL === 'AQUI_PEGAR_URL_DE_LA_WEB_APP') {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-warning"><i class="fa-solid fa-triangle-exclamation"></i> Falta configurar la URL de Apps Script.</td></tr>';
        return;
    }

    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted"><div class="spinner-border spinner-border-sm text-primary" role="status"></div> Cargando datos desde Google Sheets...</td></tr>';
    
    try {
        const response = await fetch(SCRIPT_URL);
        const result = await response.json();
        
        if (result.status === "success") {
            datosGlobales = result.data;
            renderizarTabla();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error("Error al cargar datos:", error);
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-danger">Error de conexión. Verifica la consola.</td></tr>`;
    }
}

// Función para mostrar los datos en la tabla
function renderizarTabla() {
    tbody.innerHTML = '';
    
    if (datosGlobales.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">No hay registros aún.</td></tr>';
        calcularTotales();
        return;
    }
    
    // Ordenar de más reciente a más antiguo
    const registrosInvertidos = [...datosGlobales].reverse();

    registrosInvertidos.forEach(reg => {
        const tr = document.createElement('tr');
        tr.className = reg.tipo === 'Ingreso' ? 'fila-ingreso' : 'fila-egreso';
        
        const montoHtml = reg.tipo === 'Ingreso' 
            ? `<span class="text-success">+ ${formatearMoneda(reg.monto)}</span>`
            : `<span class="text-danger">- ${formatearMoneda(reg.monto)}</span>`;

        // Formatear la fecha para que sea más legible si viene como string largo
        const fechaCorta = new Date(reg.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
        
        tr.innerHTML = `
            <td>${fechaCorta !== 'Invalid Date' ? fechaCorta : reg.fecha}</td>
            <td><span class="badge ${reg.tipo === 'Ingreso' ? 'bg-success' : 'bg-danger'}">${reg.tipo}</span></td>
            <td>${reg.categoria}</td>
            <td>${reg.descripcion}</td>
            <td class="text-end fw-bold">${montoHtml}</td>
        `;
        tbody.appendChild(tr);
    });

    calcularTotales();
}

// Función para calcular los totales y balance
function calcularTotales() {
    let ingresos = 0;
    let egresos = 0;

    datosGlobales.forEach(reg => {
        if (reg.tipo === 'Ingreso') ingresos += Number(reg.monto);
        if (reg.tipo === 'Egreso') egresos += Number(reg.monto);
    });

    const balance = ingresos - egresos;

    document.getElementById('totalIngresos').textContent = formatearMoneda(ingresos);
    document.getElementById('totalEgresos').textContent = formatearMoneda(egresos);
    document.getElementById('balanceActual').textContent = formatearMoneda(balance);
}

// Evento: Enviar el formulario
form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (SCRIPT_URL === 'AQUI_PEGAR_URL_DE_LA_WEB_APP') {
        alert("Primero debes configurar la URL de tu Web App de Google Apps Script.");
        return;
    }
    
    // Cambiar estado del botón a cargando
    const originalBtnText = btnGuardar.innerHTML;
    btnGuardar.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...';
    btnGuardar.disabled = true;

    // Obtener los datos
    const nuevoRegistro = {
        fecha: new Date().toISOString(),
        tipo: selectTipo.value,
        categoria: selectCategoria.value,
        monto: parseFloat(document.getElementById('monto').value),
        descripcion: document.getElementById('descripcion').value
    };

    try {
        // Enviar POST a Google Apps Script usando no-cors para evitar bloqueos si no está bien configurado el CORS del lado del servidor
        // NOTA: POST simple enviando JSON
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(nuevoRegistro)
        });
        
        const result = await response.json();
        
        if (result.status === "success") {
            form.reset();
            selectCategoria.innerHTML = '<option value="" disabled selected>Seleccione el tipo primero...</option>';
            // Recargar datos para mostrar el nuevo
            await cargarDatos(); 
        } else {
            alert("Error al guardar: " + result.message);
        }
    } catch (error) {
        console.error("Error en POST:", error);
        alert("Ocurrió un error al intentar guardar. Revisa la consola.");
    } finally {
        // Restaurar botón
        btnGuardar.innerHTML = originalBtnText;
        btnGuardar.disabled = false;
    }
});

// Evento: Botón actualizar
btnActualizar.addEventListener('click', () => {
    cargarDatos();
});

// Inicialización
cargarDatos();
