// =======================================================
// IMPORTANTE: REEMPLAZA ESTA URL POR LA QUE TE DÉ GOOGLE
// =======================================================
const SCRIPT_URL = 'AQUI_PEGAR_URL_DE_LA_WEB_APP'; 

// ── Categorías ──────────────────────────────────────────
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

// ── DOM References ──────────────────────────────────────
const form = document.getElementById('transaccionForm');
const selectTipo = document.getElementById('tipo');
const selectCategoria = document.getElementById('categoria');
const btnGuardar = document.getElementById('btnGuardar');
const btnActualizar = document.getElementById('btnActualizar');
const tbody = document.getElementById('tablaTransacciones');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

// Sidebar navigation
const navItems = document.querySelectorAll('.nav-item[data-section]');
const sectionDashboard = document.getElementById('sectionDashboard');
const sectionNueva = document.getElementById('sectionNueva');
const sectionHistorial = document.getElementById('sectionHistorial');
const pageTitle = document.querySelector('.page-title');
const pageSubtitle = document.querySelector('.page-subtitle');

// Mobile menu
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

let datosGlobales = [];

// ── Sidebar Navigation ─────────────────────────────────
const sectionConfig = {
    dashboard: {
        title: 'Dashboard',
        subtitle: 'Resumen general de las finanzas del colegio',
        sections: [sectionDashboard, sectionHistorial]
    },
    nueva: {
        title: 'Nueva Transacción',
        subtitle: 'Registra un nuevo movimiento financiero',
        sections: [sectionNueva]
    },
    historial: {
        title: 'Historial',
        subtitle: 'Listado completo de los movimientos registrados',
        sections: [sectionHistorial]
    }
};

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = item.dataset.section;
        
        // Update active nav
        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        
        // Update page header
        pageTitle.textContent = sectionConfig[section].title;
        pageSubtitle.textContent = sectionConfig[section].subtitle;
        
        // Show/hide sections
        [sectionDashboard, sectionNueva, sectionHistorial].forEach(s => s.style.display = 'none');
        sectionConfig[section].sections.forEach(s => s.style.display = '');
        
        // Close mobile sidebar
        closeMobileSidebar();
    });
});

// ── Mobile Menu ─────────────────────────────────────────
menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('active');
});

sidebarOverlay.addEventListener('click', closeMobileSidebar);

function closeMobileSidebar() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
}

// ── Toast ───────────────────────────────────────────────
function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── Category Select ─────────────────────────────────────
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

// ── Currency Format ─────────────────────────────────────
const formatearMoneda = (monto) => {
    return new Intl.NumberFormat('es-US', { style: 'currency', currency: 'USD' }).format(monto);
};

// ── Load Data ───────────────────────────────────────────
async function cargarDatos() {
    if (SCRIPT_URL === 'AQUI_PEGAR_URL_DE_LA_WEB_APP') {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">⚠️ Falta configurar la URL de Apps Script en app.js</td></tr>';
        return;
    }

    tbody.innerHTML = '<tr><td colspan="5" class="empty-state"><span class="spinner spinner--dark"></span> Cargando datos...</td></tr>';
    
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
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Error de conexión. Verifica la consola.</td></tr>';
    }
}

// ── Render Table ────────────────────────────────────────
function renderizarTabla() {
    tbody.innerHTML = '';
    
    if (datosGlobales.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No hay registros aún.</td></tr>';
        calcularTotales();
        return;
    }
    
    const registrosInvertidos = [...datosGlobales].reverse();

    registrosInvertidos.forEach(reg => {
        const tr = document.createElement('tr');
        
        const isIncome = reg.tipo === 'Ingreso';
        const badgeClass = isIncome ? 'type-badge--income' : 'type-badge--expense';
        const amountClass = isIncome ? 'amount--income' : 'amount--expense';
        const sign = isIncome ? '+' : '-';
        
        const fechaCorta = new Date(reg.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
        
        tr.innerHTML = `
            <td>${fechaCorta !== 'Invalid Date' ? fechaCorta : reg.fecha}</td>
            <td><span class="type-badge ${badgeClass}">${reg.tipo}</span></td>
            <td>${reg.categoria}</td>
            <td>${reg.descripcion}</td>
            <td class="text-right ${amountClass}">${sign} ${formatearMoneda(reg.monto)}</td>
        `;
        tbody.appendChild(tr);
    });

    calcularTotales();
}

// ── Calculate Totals ────────────────────────────────────
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

// ── Form Submit ─────────────────────────────────────────
form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (SCRIPT_URL === 'AQUI_PEGAR_URL_DE_LA_WEB_APP') {
        showToast("⚠️ Primero configura la URL de Apps Script.");
        return;
    }
    
    const originalBtnHtml = btnGuardar.innerHTML;
    btnGuardar.innerHTML = '<span class="spinner"></span> <span>Guardando...</span>';
    btnGuardar.disabled = true;

    const nuevoRegistro = {
        fecha: new Date().toISOString(),
        tipo: selectTipo.value,
        categoria: selectCategoria.value,
        monto: parseFloat(document.getElementById('monto').value),
        descripcion: document.getElementById('descripcion').value
    };

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(nuevoRegistro)
        });
        
        const result = await response.json();
        
        if (result.status === "success") {
            form.reset();
            selectCategoria.innerHTML = '<option value="" disabled selected>Seleccione el tipo primero...</option>';
            showToast("Registro guardado correctamente.");
            await cargarDatos();
        } else {
            showToast("Error al guardar: " + result.message);
        }
    } catch (error) {
        console.error("Error en POST:", error);
        showToast("Error de conexión al guardar.");
    } finally {
        btnGuardar.innerHTML = originalBtnHtml;
        btnGuardar.disabled = false;
        // Re-create icons inside the button
        lucide.createIcons();
    }
});

// ── Refresh Button ──────────────────────────────────────
btnActualizar.addEventListener('click', () => {
    cargarDatos();
});

// ── Init ────────────────────────────────────────────────
cargarDatos();
