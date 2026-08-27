// =======================================================
// IMPORTANTE: REEMPLAZA ESTA URL POR LA QUE TE DÉ GOOGLE
// =======================================================
const SCRIPT_URL = 'AQUI_PEGAR_URL_DE_LA_WEB_APP';

// ── Variables Globales ──────────────────────────────────
let transacciones = [];
let estudiantes = [];
let personal = [];
let resumen = {};

// ── DOM References ──────────────────────────────────────
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

// Modales
const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const modalFooter = document.getElementById('modalFooter');
const confirmOverlay = document.getElementById('confirmOverlay');
const confirmTitle = document.getElementById('confirmTitle');
const confirmMessage = document.getElementById('confirmMessage');

// ── Sidebar Navigation ─────────────────────────────────
const navItems = document.querySelectorAll('.nav-item[data-section]');
const sections = {
    dashboard: document.getElementById('sectionDashboard'),
    nueva: document.getElementById('sectionNueva'),
    historial: document.getElementById('sectionHistorial'),
    estudiantes: document.getElementById('sectionEstudiantes'),
    personal: document.getElementById('sectionPersonal'),
    reportes: document.getElementById('sectionReportes')
};

const sectionTitles = {
    dashboard: { title: 'Dashboard', sub: 'Resumen general de las finanzas del colegio' },
    nueva: { title: 'Nueva Transacción', sub: 'Registra un nuevo movimiento financiero' },
    historial: { title: 'Historial', sub: 'Listado completo de los movimientos registrados' },
    estudiantes: { title: 'Estudiantes', sub: 'Gestión de estudiantes inscritos en el colegio' },
    personal: { title: 'Personal', sub: 'Gestión de maestros y personal del colegio' },
    reportes: { title: 'Reportes', sub: 'Estadísticas detalladas y resúmenes' }
};

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionId = item.dataset.section;
        
        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        
        document.getElementById('pageTitle').textContent = sectionTitles[sectionId].title;
        document.getElementById('pageSubtitle').textContent = sectionTitles[sectionId].sub;
        
        Object.values(sections).forEach(s => s.style.display = 'none');
        sections[sectionId].style.display = '';
        
        closeMobileSidebar();
        
        // Cargar datos según la sección
        if (sectionId === 'estudiantes' && estudiantes.length === 0) cargarDatos('estudiantes');
        if (sectionId === 'personal' && personal.length === 0) cargarDatos('personal');
        if (sectionId === 'reportes') cargarDatos('resumen');
    });
});

// Mobile menu
document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('sidebarOverlay').classList.add('active');
});

document.getElementById('sidebarOverlay').addEventListener('click', closeMobileSidebar);

function closeMobileSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('active');
}

// ── Categorías ──────────────────────────────────────────
const categorias = {
    Ingreso: ['Mensualidad de Estudiante', 'Inscripción', 'Donación', 'Otros Ingresos'],
    Egreso: ['Pago a Maestro', 'Pago a Personal', 'Servicios (Agua, Luz, Gas)', 'Mantenimiento e Infraestructura', 'Material Escolar / Oficina', 'Viáticos', 'Otros Gastos']
};

const txTipo = document.getElementById('txTipo');
const txCategoria = document.getElementById('txCategoria');

if (txTipo) {
    txTipo.addEventListener('change', function() {
        const tipo = this.value;
        txCategoria.innerHTML = '<option value="" disabled selected>Seleccione una categoría...</option>';
        if (categorias[tipo]) {
            categorias[tipo].forEach(cat => {
                const option = document.createElement('option');
                option.value = cat; option.textContent = cat;
                txCategoria.appendChild(option);
            });
        }
    });
}

// ── Utilidades ──────────────────────────────────────────
const formatearMoneda = (monto) => new Intl.NumberFormat('es-US', { style: 'currency', currency: 'USD' }).format(monto || 0);

function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function showSpinner(tbodyId, cols) {
    document.getElementById(tbodyId).innerHTML = `<tr><td colspan="${cols}" class="empty-state"><span class="spinner spinner--dark"></span> Cargando datos...</td></tr>`;
}

// ── Modales ─────────────────────────────────────────────
document.getElementById('modalClose').addEventListener('click', () => {
    modalOverlay.classList.remove('active');
});

function confirmDialog(title, message, onConfirm) {
    confirmTitle.textContent = title;
    confirmMessage.textContent = message;
    confirmOverlay.classList.add('active');
    
    const btnCancel = document.getElementById('confirmCancel');
    const btnOk = document.getElementById('confirmOk');
    
    // Limpiar eventos previos
    const newBtnCancel = btnCancel.cloneNode(true);
    const newBtnOk = btnOk.cloneNode(true);
    btnCancel.parentNode.replaceChild(newBtnCancel, btnCancel);
    btnOk.parentNode.replaceChild(newBtnOk, btnOk);
    
    newBtnCancel.addEventListener('click', () => confirmOverlay.classList.remove('active'));
    newBtnOk.addEventListener('click', () => {
        confirmOverlay.classList.remove('active');
        onConfirm();
    });
}

// ── API Llamadas ────────────────────────────────────────

async function fetchGET(entidad, params = {}) {
    if (SCRIPT_URL === 'AQUI_PEGAR_URL_DE_LA_WEB_APP') {
        throw new Error("Falta configurar SCRIPT_URL");
    }
    const url = new URL(SCRIPT_URL);
    url.searchParams.append('entidad', entidad);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    
    const response = await fetch(url.toString());
    const result = await response.json();
    if (result.status !== "success") throw new Error(result.message);
    return result.data;
}

async function fetchPOST(entidad, accion, data) {
    if (SCRIPT_URL === 'AQUI_PEGAR_URL_DE_LA_WEB_APP') {
        throw new Error("Falta configurar SCRIPT_URL");
    }
    const payload = { entidad, accion, ...data };
    
    const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    if (result.status !== "success") throw new Error(result.message);
    return result;
}

// ── Cargar Datos ────────────────────────────────────────

async function cargarDatos(entidad = 'transacciones', params = {}) {
    try {
        if (entidad === 'transacciones') {
            showSpinner('tablaRecientes', 5);
            showSpinner('tablaTransacciones', 6);
            transacciones = await fetchGET('transacciones', params);
            renderizarTransacciones();
        } else if (entidad === 'estudiantes') {
            showSpinner('tablaEstudiantes', 8);
            estudiantes = await fetchGET('estudiantes', params);
            renderizarEstudiantes();
        } else if (entidad === 'personal') {
            showSpinner('tablaPersonal', 7);
            personal = await fetchGET('personal', params);
            renderizarPersonal();
        } else if (entidad === 'resumen') {
            showSpinner('tablaReporteCategoria', 5);
            showSpinner('tablaReporteMes', 4);
            resumen = await fetchGET('resumen', params);
            renderizarResumen();
        }
    } catch (error) {
        console.error(error);
        if (entidad === 'transacciones') {
            document.getElementById('tablaRecientes').innerHTML = '<tr><td colspan="5" class="empty-state">Error: ' + error.message + '</td></tr>';
            document.getElementById('tablaTransacciones').innerHTML = '<tr><td colspan="6" class="empty-state">Error: ' + error.message + '</td></tr>';
        }
    }
}

// ── Render: Transacciones ───────────────────────────────

function renderizarTransacciones() {
    const tbodyHistorial = document.getElementById('tablaTransacciones');
    const tbodyRecientes = document.getElementById('tablaRecientes');
    
    tbodyHistorial.innerHTML = '';
    tbodyRecientes.innerHTML = '';
    
    let ingresos = 0; let egresos = 0;
    
    if (transacciones.length === 0) {
        tbodyHistorial.innerHTML = '<tr><td colspan="6" class="empty-state">No hay registros.</td></tr>';
        tbodyRecientes.innerHTML = '<tr><td colspan="5" class="empty-state">No hay registros.</td></tr>';
    } else {
        const trsInvertidos = [...transacciones].reverse();
        
        trsInvertidos.forEach((reg, index) => {
            if (reg.tipo === 'Ingreso') ingresos += Number(reg.monto);
            if (reg.tipo === 'Egreso') egresos += Number(reg.monto);
            
            const isIncome = reg.tipo === 'Ingreso';
            const badgeClass = isIncome ? 'type-badge--income' : 'type-badge--expense';
            const amountClass = isIncome ? 'amount--income' : 'amount--expense';
            const sign = isIncome ? '+' : '-';
            const fechaCorta = new Date(reg.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
            
            // Fila Historial Completo
            const trH = document.createElement('tr');
            trH.innerHTML = `
                <td>${fechaCorta}</td>
                <td><span class="type-badge ${badgeClass}">${reg.tipo}</span></td>
                <td>${reg.categoria}</td>
                <td>${reg.descripcion}</td>
                <td class="text-right ${amountClass}">${sign} ${formatearMoneda(reg.monto)}</td>
                <td class="actions-cell">
                    <button class="btn-icon btn-icon--danger" onclick="borrarRegistro('transacciones', '${reg.id}')" title="Eliminar"><i data-lucide="trash-2"></i></button>
                </td>
            `;
            tbodyHistorial.appendChild(trH);
            
            // Fila Recientes (max 10)
            if (index < 10) {
                const trR = document.createElement('tr');
                trR.innerHTML = `
                    <td>${fechaCorta}</td>
                    <td><span class="type-badge ${badgeClass}">${reg.tipo}</span></td>
                    <td>${reg.categoria}</td>
                    <td>${reg.descripcion}</td>
                    <td class="text-right ${amountClass}">${sign} ${formatearMoneda(reg.monto)}</td>
                `;
                tbodyRecientes.appendChild(trR);
            }
        });
        lucide.createIcons();
    }
    
    document.getElementById('totalIngresos').textContent = formatearMoneda(ingresos);
    document.getElementById('totalEgresos').textContent = formatearMoneda(egresos);
    document.getElementById('balanceActual').textContent = formatearMoneda(ingresos - egresos);
}

// Filtros Historial
document.getElementById('btnFiltrar').addEventListener('click', () => {
    const params = {};
    const d = document.getElementById('filtroDesde').value;
    const h = document.getElementById('filtroHasta').value;
    const t = document.getElementById('filtroTipo').value;
    const b = document.getElementById('filtroBusqueda').value;
    
    if(d) params.fecha_desde = d;
    if(h) params.fecha_hasta = h;
    if(t) params.tipo = t;
    if(b) params.busqueda = b;
    
    cargarDatos('transacciones', params);
});

document.getElementById('btnLimpiarFiltros').addEventListener('click', () => {
    document.getElementById('filtroDesde').value = '';
    document.getElementById('filtroHasta').value = '';
    document.getElementById('filtroTipo').value = '';
    document.getElementById('filtroBusqueda').value = '';
    cargarDatos('transacciones');
});

// Guardar Transacción
document.getElementById('transaccionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnGuardarTx');
    const ogText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span> <span>Guardando...</span>';
    btn.disabled = true;
    
    const data = {
        fecha: document.getElementById('txFecha').value,
        tipo: document.getElementById('txTipo').value,
        categoria: document.getElementById('txCategoria').value,
        monto: document.getElementById('txMonto').value,
        descripcion: document.getElementById('txDescripcion').value
    };
    
    try {
        await fetchPOST('transacciones', 'crear', data);
        showToast('Transacción registrada correctamente');
        document.getElementById('transaccionForm').reset();
        document.getElementById('txCategoria').innerHTML = '<option value="" disabled selected>Seleccione el tipo primero...</option>';
        cargarDatos('transacciones');
        
        // Volver al dashboard
        document.querySelector('[data-section="dashboard"]').click();
    } catch(err) {
        alert("Error: " + err.message);
    } finally {
        btn.innerHTML = ogText;
        btn.disabled = false;
        lucide.createIcons();
    }
});

// ── Render: Estudiantes ───────────────────────────────
function renderizarEstudiantes() {
    const tbody = document.getElementById('tablaEstudiantes');
    tbody.innerHTML = '';
    if(estudiantes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No hay estudiantes registrados.</td></tr>';
        return;
    }
    
    estudiantes.forEach(est => {
        const st = est.estado === 'Activo' ? 'status-badge--active' : 'status-badge--inactive';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${est.nombre}</strong></td>
            <td>${est.cedula || '-'}</td>
            <td>${est.grado}</td>
            <td>${est.seccion || '-'}</td>
            <td>${est.representante || '-'}</td>
            <td>${est.telefono || '-'}</td>
            <td><span class="status-badge ${st}">${est.estado}</span></td>
            <td class="actions-cell">
                <button class="btn-icon btn-icon--danger" onclick="borrarRegistro('estudiantes', '${est.id}')"><i data-lucide="trash-2"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    lucide.createIcons();
}

document.getElementById('btnNuevoEstudiante').addEventListener('click', () => {
    modalTitle.textContent = 'Nuevo Estudiante';
    modalBody.innerHTML = `
        <div class="form-group">
            <label class="form-label">Nombre del Estudiante *</label>
            <input type="text" class="form-control" id="estNombre" required>
        </div>
        <div class="form-grid">
            <div class="form-group">
                <label class="form-label">Cédula Escolar</label>
                <input type="text" class="form-control" id="estCedula">
            </div>
            <div class="form-group">
                <label class="form-label">Grado *</label>
                <input type="text" class="form-control" id="estGrado" placeholder="Ej. 1er Año" required>
            </div>
            <div class="form-group">
                <label class="form-label">Sección</label>
                <input type="text" class="form-control" id="estSeccion">
            </div>
            <div class="form-group">
                <label class="form-label">Estado</label>
                <select class="form-control" id="estEstado">
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                </select>
            </div>
        </div>
        <div class="form-group" style="margin-top:16px">
            <label class="form-label">Representante</label>
            <input type="text" class="form-control" id="estRepresentante">
        </div>
        <div class="form-group">
            <label class="form-label">Teléfono Representante</label>
            <input type="text" class="form-control" id="estTelefono">
        </div>
    `;
    modalFooter.innerHTML = `
        <button class="btn btn-primary" id="btnGuardarEst"><i data-lucide="save"></i> Guardar</button>
    `;
    modalOverlay.classList.add('active');
    lucide.createIcons();
    
    document.getElementById('btnGuardarEst').addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        const nombre = document.getElementById('estNombre').value;
        const grado = document.getElementById('estGrado').value;
        if(!nombre || !grado) return alert("Nombre y Grado son obligatorios");
        
        btn.innerHTML = '<span class="spinner"></span> Guardando...';
        btn.disabled = true;
        
        try {
            await fetchPOST('estudiantes', 'crear', {
                nombre: nombre,
                cedula: document.getElementById('estCedula').value,
                grado: grado,
                seccion: document.getElementById('estSeccion').value,
                representante: document.getElementById('estRepresentante').value,
                telefono: document.getElementById('estTelefono').value,
                estado: document.getElementById('estEstado').value
            });
            modalOverlay.classList.remove('active');
            showToast('Estudiante guardado');
            cargarDatos('estudiantes');
        } catch(err) {
            alert(err.message);
        } finally {
            btn.disabled = false;
        }
    });
});

// ── Render: Personal ──────────────────────────────────
function renderizarPersonal() {
    const tbody = document.getElementById('tablaPersonal');
    tbody.innerHTML = '';
    if(personal.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No hay personal registrado.</td></tr>';
        return;
    }
    
    personal.forEach(p => {
        const st = p.estado === 'Activo' ? 'status-badge--active' : 'status-badge--inactive';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${p.nombre}</strong></td>
            <td>${p.cedula || '-'}</td>
            <td>${p.cargo}</td>
            <td>${formatearMoneda(p.sueldo_base)}</td>
            <td>${p.telefono || '-'}</td>
            <td><span class="status-badge ${st}">${p.estado}</span></td>
            <td class="actions-cell">
                <button class="btn-icon btn-icon--danger" onclick="borrarRegistro('personal', '${p.id}')"><i data-lucide="trash-2"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    lucide.createIcons();
}

document.getElementById('btnNuevoPersonal').addEventListener('click', () => {
    modalTitle.textContent = 'Nuevo Personal';
    modalBody.innerHTML = `
        <div class="form-group">
            <label class="form-label">Nombre Completo *</label>
            <input type="text" class="form-control" id="perNombre" required>
        </div>
        <div class="form-grid">
            <div class="form-group">
                <label class="form-label">Cédula</label>
                <input type="text" class="form-control" id="perCedula">
            </div>
            <div class="form-group">
                <label class="form-label">Cargo *</label>
                <input type="text" class="form-control" id="perCargo" placeholder="Ej. Profesor Matemáticas" required>
            </div>
            <div class="form-group">
                <label class="form-label">Sueldo Base ($)</label>
                <input type="number" class="form-control" id="perSueldo" min="0" step="0.01">
            </div>
            <div class="form-group">
                <label class="form-label">Estado</label>
                <select class="form-control" id="perEstado">
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                </select>
            </div>
        </div>
        <div class="form-group" style="margin-top:16px">
            <label class="form-label">Teléfono</label>
            <input type="text" class="form-control" id="perTelefono">
        </div>
    `;
    modalFooter.innerHTML = `
        <button class="btn btn-primary" id="btnGuardarPer"><i data-lucide="save"></i> Guardar</button>
    `;
    modalOverlay.classList.add('active');
    lucide.createIcons();
    
    document.getElementById('btnGuardarPer').addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        const nombre = document.getElementById('perNombre').value;
        const cargo = document.getElementById('perCargo').value;
        if(!nombre || !cargo) return alert("Nombre y Cargo son obligatorios");
        
        btn.innerHTML = '<span class="spinner"></span> Guardando...';
        btn.disabled = true;
        
        try {
            await fetchPOST('personal', 'crear', {
                nombre: nombre,
                cedula: document.getElementById('perCedula').value,
                cargo: cargo,
                sueldo_base: document.getElementById('perSueldo').value,
                telefono: document.getElementById('perTelefono').value,
                estado: document.getElementById('perEstado').value
            });
            modalOverlay.classList.remove('active');
            showToast('Personal guardado');
            cargarDatos('personal');
        } catch(err) {
            alert(err.message);
        } finally {
            btn.disabled = false;
        }
    });
});

// ── Render: Reportes ──────────────────────────────────
function renderizarResumen() {
    document.getElementById('repTotalRegistros').textContent = resumen.totalRegistros || 0;
    document.getElementById('repEstudiantes').textContent = estudiantes.filter(e => e.estado === 'Activo').length || 0;
    document.getElementById('repPersonal').textContent = personal.filter(p => p.estado === 'Activo').length || 0;
    
    const tbCat = document.getElementById('tablaReporteCategoria');
    tbCat.innerHTML = '';
    
    const maxTotalCat = Math.max(...Object.values(resumen.porCategoria || {}).map(c => c.total), 1);
    
    for(const [cat, data] of Object.entries(resumen.porCategoria || {})) {
        const badge = data.tipo === 'Ingreso' ? 'type-badge--income' : 'type-badge--expense';
        const bar = data.tipo === 'Ingreso' ? 'progress-bar__fill--income' : 'progress-bar__fill--expense';
        const pct = Math.round((data.total / maxTotalCat) * 100);
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${cat}</td>
            <td><span class="type-badge ${badge}">${data.tipo}</span></td>
            <td class="text-right">${data.cantidad}</td>
            <td class="text-right fw-bold">${formatearMoneda(data.total)}</td>
            <td style="width: 30%">
                <div class="progress-bar">
                    <div class="progress-bar__fill ${bar}" style="width: ${pct}%"></div>
                </div>
            </td>
        `;
        tbCat.appendChild(tr);
    }
    
    const tbMes = document.getElementById('tablaReporteMes');
    tbMes.innerHTML = '';
    
    const mesesSorted = Object.keys(resumen.porMes || {}).sort().reverse();
    mesesSorted.forEach(m => {
        const data = resumen.porMes[m];
        const bal = data.ingresos - data.egresos;
        const color = bal >= 0 ? 'var(--color-income)' : 'var(--color-expense)';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${m}</strong></td>
            <td class="text-right amount--income">+${formatearMoneda(data.ingresos)}</td>
            <td class="text-right amount--expense">-${formatearMoneda(data.egresos)}</td>
            <td class="text-right" style="color: ${color}; font-weight: bold">${formatearMoneda(bal)}</td>
        `;
        tbMes.appendChild(tr);
    });
}

// ── Global Actions ────────────────────────────────────
window.borrarRegistro = function(entidad, id) {
    confirmDialog('Eliminar Registro', '¿Seguro que deseas eliminar esto? Se borrará de la base de datos permanentemente.', async () => {
        try {
            await fetchPOST(entidad, 'eliminar', { id: id });
            showToast('Registro eliminado exitosamente');
            cargarDatos(entidad);
            if(entidad === 'transacciones') cargarDatos('resumen');
        } catch (e) {
            alert(e.message);
        }
    });
};

document.getElementById('btnActualizar').addEventListener('click', () => {
    // Actualizar la vista actual
    const sectionActiva = document.querySelector('.nav-item.active').dataset.section;
    if (sectionActiva === 'dashboard' || sectionActiva === 'historial') cargarDatos('transacciones');
    else if (sectionActiva === 'estudiantes') cargarDatos('estudiantes');
    else if (sectionActiva === 'personal') cargarDatos('personal');
    else if (sectionActiva === 'reportes') cargarDatos('resumen');
});

// ── INIT ──────────────────────────────────────────────
document.getElementById('txFecha').valueAsDate = new Date();
cargarDatos('transacciones');
