/**
 * ============================================================
 * Sistema de Gestión Escolar - Backend Profesional
 * Google Apps Script (Web App)
 * ============================================================
 * 
 * ESTRUCTURA DEL GOOGLE SHEETS:
 * 
 * Hoja "Transacciones" (encabezados fila 1):
 *   A: ID | B: Fecha | C: Tipo | D: Categoria | E: Monto | F: Descripcion | G: FechaRegistro
 * 
 * Hoja "Estudiantes" (encabezados fila 1):
 *   A: ID | B: Nombre | C: Cedula | D: Grado | E: Seccion | F: Representante | G: Telefono | H: Estado
 * 
 * Hoja "Personal" (encabezados fila 1):
 *   A: ID | B: Nombre | C: Cedula | D: Cargo | E: SueldoBase | F: Telefono | G: Estado
 * 
 * INSTRUCCIONES:
 * 1. Crea las 3 hojas en tu Google Sheets con los encabezados indicados.
 * 2. Pega este código completo en Extensiones > Apps Script.
 * 3. Implementa como Aplicación Web (Ejecutar como: Yo / Acceso: Cualquier persona).
 * 4. Copia la URL y pégala en app.js.
 */

// ── Configuración ───────────────────────────────────────
const CONFIG = {
  HOJAS: {
    TRANSACCIONES: "Transacciones",
    ESTUDIANTES: "Estudiantes",
    PERSONAL: "Personal"
  },
  TIPOS_VALIDOS: ["Ingreso", "Egreso"],
  CATEGORIAS_INGRESO: [
    "Mensualidad de Estudiante",
    "Inscripción",
    "Donación",
    "Otros Ingresos"
  ],
  CATEGORIAS_EGRESO: [
    "Pago a Maestro",
    "Pago a Personal",
    "Servicios (Agua, Luz, Gas)",
    "Mantenimiento e Infraestructura",
    "Material Escolar / Oficina",
    "Viáticos",
    "Otros Gastos"
  ],
  ESTADOS_VALIDOS: ["Activo", "Inactivo"]
};

// ── Utilidades ──────────────────────────────────────────

/**
 * Obtiene una hoja por nombre. Lanza error si no existe.
 */
function obtenerHoja(nombre) {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nombre);
  if (!hoja) {
    throw new Error("No se encontró la hoja: " + nombre);
  }
  return hoja;
}

/**
 * Genera una respuesta JSON estandarizada.
 */
function respuestaJSON(datos) {
  return ContentService
    .createTextOutput(JSON.stringify(datos))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Respuesta de éxito.
 */
function exito(data, mensaje) {
  return respuestaJSON({
    status: "success",
    message: mensaje || "Operación exitosa",
    data: data || null
  });
}

/**
 * Respuesta de error.
 */
function errorResp(mensaje) {
  return respuestaJSON({
    status: "error",
    message: mensaje || "Error desconocido",
    data: null
  });
}

/**
 * Busca la fila de un registro por ID en una hoja.
 * Retorna el número de fila (1-indexed) o -1 si no se encuentra.
 */
function buscarFilaPorId(hoja, id) {
  const datos = hoja.getDataRange().getValues();
  for (let i = 1; i < datos.length; i++) { // Empieza en 1 para saltar encabezado
    if (String(datos[i][0]) === String(id)) {
      return i + 1; // Fila real en la hoja (1-indexed)
    }
  }
  return -1;
}

/**
 * Convierte los datos de una hoja a un arreglo de objetos.
 */
function hojaAObjetos(hoja) {
  const datos = hoja.getDataRange().getValues();
  if (datos.length <= 1) return []; // Solo tiene encabezados

  const encabezados = datos[0].map(h => String(h).trim().toLowerCase().replace(/\s+/g, '_'));
  const filas = datos.slice(1);

  return filas.map(fila => {
    const obj = {};
    encabezados.forEach((header, index) => {
      obj[header] = fila[index];
    });
    return obj;
  });
}

// ── Validaciones ────────────────────────────────────────

function validarTransaccion(datos) {
  const errores = [];

  if (!datos.tipo || !CONFIG.TIPOS_VALIDOS.includes(datos.tipo)) {
    errores.push("El tipo debe ser 'Ingreso' o 'Egreso'.");
  }

  const categoriasValidas = datos.tipo === "Ingreso"
    ? CONFIG.CATEGORIAS_INGRESO
    : CONFIG.CATEGORIAS_EGRESO;

  if (!datos.categoria || !categoriasValidas.includes(datos.categoria)) {
    errores.push("La categoría '" + datos.categoria + "' no es válida para el tipo '" + datos.tipo + "'.");
  }

  const monto = parseFloat(datos.monto);
  if (isNaN(monto) || monto <= 0) {
    errores.push("El monto debe ser un número mayor a 0.");
  }

  if (!datos.descripcion || String(datos.descripcion).trim().length < 3) {
    errores.push("La descripción debe tener al menos 3 caracteres.");
  }

  return errores;
}

function validarEstudiante(datos) {
  const errores = [];
  if (!datos.nombre || String(datos.nombre).trim().length < 2) errores.push("El nombre es obligatorio (mínimo 2 caracteres).");
  if (!datos.grado) errores.push("El grado es obligatorio.");
  return errores;
}

function validarPersonal(datos) {
  const errores = [];
  if (!datos.nombre || String(datos.nombre).trim().length < 2) errores.push("El nombre es obligatorio (mínimo 2 caracteres).");
  if (!datos.cargo) errores.push("El cargo es obligatorio.");
  const sueldo = parseFloat(datos.sueldo_base);
  if (isNaN(sueldo) || sueldo < 0) errores.push("El sueldo base debe ser un número positivo.");
  return errores;
}

// ── CRUD: Transacciones ─────────────────────────────────

function crearTransaccion(datos) {
  const errores = validarTransaccion(datos);
  if (errores.length > 0) return errorResp("Validación fallida: " + errores.join(" | "));

  const hoja = obtenerHoja(CONFIG.HOJAS.TRANSACCIONES);
  const id = Utilities.getUuid();
  const fecha = datos.fecha || new Date().toISOString();
  const fechaRegistro = new Date().toISOString();

  hoja.appendRow([
    id,
    fecha,
    datos.tipo,
    datos.categoria,
    parseFloat(datos.monto),
    String(datos.descripcion).trim(),
    fechaRegistro
  ]);

  return exito({ id: id }, "Transacción registrada correctamente.");
}

function editarTransaccion(datos) {
  if (!datos.id) return errorResp("Se requiere el ID de la transacción a editar.");

  const hoja = obtenerHoja(CONFIG.HOJAS.TRANSACCIONES);
  const fila = buscarFilaPorId(hoja, datos.id);
  if (fila === -1) return errorResp("No se encontró la transacción con ID: " + datos.id);

  const errores = validarTransaccion(datos);
  if (errores.length > 0) return errorResp("Validación fallida: " + errores.join(" | "));

  // Actualizar celdas (mantener ID y FechaRegistro originales)
  hoja.getRange(fila, 2).setValue(datos.fecha || hoja.getRange(fila, 2).getValue());
  hoja.getRange(fila, 3).setValue(datos.tipo);
  hoja.getRange(fila, 4).setValue(datos.categoria);
  hoja.getRange(fila, 5).setValue(parseFloat(datos.monto));
  hoja.getRange(fila, 6).setValue(String(datos.descripcion).trim());

  return exito({ id: datos.id }, "Transacción actualizada correctamente.");
}

function eliminarTransaccion(datos) {
  if (!datos.id) return errorResp("Se requiere el ID de la transacción a eliminar.");

  const hoja = obtenerHoja(CONFIG.HOJAS.TRANSACCIONES);
  const fila = buscarFilaPorId(hoja, datos.id);
  if (fila === -1) return errorResp("No se encontró la transacción con ID: " + datos.id);

  hoja.deleteRow(fila);
  return exito(null, "Transacción eliminada correctamente.");
}

function obtenerTransacciones(params) {
  const hoja = obtenerHoja(CONFIG.HOJAS.TRANSACCIONES);
  let registros = hojaAObjetos(hoja);

  // Filtro por tipo
  if (params.tipo) {
    registros = registros.filter(r => r.tipo === params.tipo);
  }

  // Filtro por categoría
  if (params.categoria) {
    registros = registros.filter(r => r.categoria === params.categoria);
  }

  // Filtro por rango de fechas
  if (params.fecha_desde) {
    const desde = new Date(params.fecha_desde);
    registros = registros.filter(r => new Date(r.fecha) >= desde);
  }
  if (params.fecha_hasta) {
    const hasta = new Date(params.fecha_hasta);
    hasta.setHours(23, 59, 59, 999);
    registros = registros.filter(r => new Date(r.fecha) <= hasta);
  }

  // Búsqueda por texto en descripción
  if (params.busqueda) {
    const termino = String(params.busqueda).toLowerCase();
    registros = registros.filter(r =>
      String(r.descripcion).toLowerCase().includes(termino) ||
      String(r.categoria).toLowerCase().includes(termino)
    );
  }

  return registros;
}

// ── CRUD: Estudiantes ───────────────────────────────────

function crearEstudiante(datos) {
  const errores = validarEstudiante(datos);
  if (errores.length > 0) return errorResp("Validación fallida: " + errores.join(" | "));

  const hoja = obtenerHoja(CONFIG.HOJAS.ESTUDIANTES);
  const id = Utilities.getUuid();

  hoja.appendRow([
    id,
    String(datos.nombre).trim(),
    String(datos.cedula || "").trim(),
    String(datos.grado).trim(),
    String(datos.seccion || "").trim(),
    String(datos.representante || "").trim(),
    String(datos.telefono || "").trim(),
    datos.estado || "Activo"
  ]);

  return exito({ id: id }, "Estudiante registrado correctamente.");
}

function editarEstudiante(datos) {
  if (!datos.id) return errorResp("Se requiere el ID del estudiante.");

  const hoja = obtenerHoja(CONFIG.HOJAS.ESTUDIANTES);
  const fila = buscarFilaPorId(hoja, datos.id);
  if (fila === -1) return errorResp("No se encontró el estudiante con ID: " + datos.id);

  const errores = validarEstudiante(datos);
  if (errores.length > 0) return errorResp("Validación fallida: " + errores.join(" | "));

  hoja.getRange(fila, 2).setValue(String(datos.nombre).trim());
  hoja.getRange(fila, 3).setValue(String(datos.cedula || "").trim());
  hoja.getRange(fila, 4).setValue(String(datos.grado).trim());
  hoja.getRange(fila, 5).setValue(String(datos.seccion || "").trim());
  hoja.getRange(fila, 6).setValue(String(datos.representante || "").trim());
  hoja.getRange(fila, 7).setValue(String(datos.telefono || "").trim());
  hoja.getRange(fila, 8).setValue(datos.estado || "Activo");

  return exito({ id: datos.id }, "Estudiante actualizado correctamente.");
}

function eliminarEstudiante(datos) {
  if (!datos.id) return errorResp("Se requiere el ID del estudiante.");

  const hoja = obtenerHoja(CONFIG.HOJAS.ESTUDIANTES);
  const fila = buscarFilaPorId(hoja, datos.id);
  if (fila === -1) return errorResp("No se encontró el estudiante con ID: " + datos.id);

  hoja.deleteRow(fila);
  return exito(null, "Estudiante eliminado correctamente.");
}

function obtenerEstudiantes(params) {
  const hoja = obtenerHoja(CONFIG.HOJAS.ESTUDIANTES);
  let registros = hojaAObjetos(hoja);

  if (params.estado) {
    registros = registros.filter(r => r.estado === params.estado);
  }
  if (params.grado) {
    registros = registros.filter(r => r.grado === params.grado);
  }
  if (params.busqueda) {
    const termino = String(params.busqueda).toLowerCase();
    registros = registros.filter(r =>
      String(r.nombre).toLowerCase().includes(termino) ||
      String(r.cedula).toLowerCase().includes(termino) ||
      String(r.representante).toLowerCase().includes(termino)
    );
  }

  return registros;
}

// ── CRUD: Personal ──────────────────────────────────────

function crearPersonal(datos) {
  const errores = validarPersonal(datos);
  if (errores.length > 0) return errorResp("Validación fallida: " + errores.join(" | "));

  const hoja = obtenerHoja(CONFIG.HOJAS.PERSONAL);
  const id = Utilities.getUuid();

  hoja.appendRow([
    id,
    String(datos.nombre).trim(),
    String(datos.cedula || "").trim(),
    String(datos.cargo).trim(),
    parseFloat(datos.sueldo_base) || 0,
    String(datos.telefono || "").trim(),
    datos.estado || "Activo"
  ]);

  return exito({ id: id }, "Personal registrado correctamente.");
}

function editarPersonal(datos) {
  if (!datos.id) return errorResp("Se requiere el ID del personal.");

  const hoja = obtenerHoja(CONFIG.HOJAS.PERSONAL);
  const fila = buscarFilaPorId(hoja, datos.id);
  if (fila === -1) return errorResp("No se encontró el personal con ID: " + datos.id);

  const errores = validarPersonal(datos);
  if (errores.length > 0) return errorResp("Validación fallida: " + errores.join(" | "));

  hoja.getRange(fila, 2).setValue(String(datos.nombre).trim());
  hoja.getRange(fila, 3).setValue(String(datos.cedula || "").trim());
  hoja.getRange(fila, 4).setValue(String(datos.cargo).trim());
  hoja.getRange(fila, 5).setValue(parseFloat(datos.sueldo_base) || 0);
  hoja.getRange(fila, 6).setValue(String(datos.telefono || "").trim());
  hoja.getRange(fila, 7).setValue(datos.estado || "Activo");

  return exito({ id: datos.id }, "Personal actualizado correctamente.");
}

function eliminarPersonal(datos) {
  if (!datos.id) return errorResp("Se requiere el ID del personal.");

  const hoja = obtenerHoja(CONFIG.HOJAS.PERSONAL);
  const fila = buscarFilaPorId(hoja, datos.id);
  if (fila === -1) return errorResp("No se encontró el personal con ID: " + datos.id);

  hoja.deleteRow(fila);
  return exito(null, "Personal eliminado correctamente.");
}

function obtenerPersonal(params) {
  const hoja = obtenerHoja(CONFIG.HOJAS.PERSONAL);
  let registros = hojaAObjetos(hoja);

  if (params.estado) {
    registros = registros.filter(r => r.estado === params.estado);
  }
  if (params.cargo) {
    registros = registros.filter(r => r.cargo === params.cargo);
  }
  if (params.busqueda) {
    const termino = String(params.busqueda).toLowerCase();
    registros = registros.filter(r =>
      String(r.nombre).toLowerCase().includes(termino) ||
      String(r.cedula).toLowerCase().includes(termino)
    );
  }

  return registros;
}

// ── Reportes y Estadísticas ─────────────────────────────

function obtenerResumen(params) {
  const registros = obtenerTransacciones(params);

  let totalIngresos = 0;
  let totalEgresos = 0;
  const porCategoria = {};
  const porMes = {};

  registros.forEach(r => {
    const monto = parseFloat(r.monto) || 0;

    if (r.tipo === "Ingreso") {
      totalIngresos += monto;
    } else if (r.tipo === "Egreso") {
      totalEgresos += monto;
    }

    // Agrupar por categoría
    if (!porCategoria[r.categoria]) {
      porCategoria[r.categoria] = { tipo: r.tipo, total: 0, cantidad: 0 };
    }
    porCategoria[r.categoria].total += monto;
    porCategoria[r.categoria].cantidad += 1;

    // Agrupar por mes
    try {
      const fecha = new Date(r.fecha);
      const mesKey = fecha.getFullYear() + "-" + String(fecha.getMonth() + 1).padStart(2, "0");
      if (!porMes[mesKey]) {
        porMes[mesKey] = { ingresos: 0, egresos: 0 };
      }
      if (r.tipo === "Ingreso") {
        porMes[mesKey].ingresos += monto;
      } else {
        porMes[mesKey].egresos += monto;
      }
    } catch (e) {
      // Fecha inválida, ignorar para agrupación por mes
    }
  });

  return {
    totalIngresos: totalIngresos,
    totalEgresos: totalEgresos,
    balance: totalIngresos - totalEgresos,
    totalRegistros: registros.length,
    porCategoria: porCategoria,
    porMes: porMes
  };
}

// ── Router Principal ────────────────────────────────────

/**
 * GET handler - Lee datos.
 * Parámetros de URL:
 *   ?entidad=transacciones|estudiantes|personal|resumen
 *   &tipo=Ingreso|Egreso
 *   &categoria=...
 *   &fecha_desde=YYYY-MM-DD
 *   &fecha_hasta=YYYY-MM-DD
 *   &busqueda=texto
 *   &estado=Activo|Inactivo
 *   &grado=...
 */
function doGet(e) {
  try {
    const params = e.parameter || {};
    const entidad = params.entidad || "transacciones";

    switch (entidad) {
      case "transacciones":
        return exito(obtenerTransacciones(params));

      case "estudiantes":
        return exito(obtenerEstudiantes(params));

      case "personal":
        return exito(obtenerPersonal(params));

      case "resumen":
        return exito(obtenerResumen(params));

      default:
        return errorResp("Entidad no reconocida: " + entidad + ". Usa: transacciones, estudiantes, personal, resumen.");
    }

  } catch (error) {
    return errorResp("Error en GET: " + error.toString());
  }
}

/**
 * POST handler - Crea, edita o elimina datos.
 * Body JSON esperado:
 * {
 *   "accion": "crear" | "editar" | "eliminar",
 *   "entidad": "transacciones" | "estudiantes" | "personal",
 *   ... campos del registro ...
 * }
 */
function doPost(e) {
  try {
    const datos = JSON.parse(e.postData.contents);
    const accion = datos.accion || "crear";
    const entidad = datos.entidad || "transacciones";

    // Mapa de funciones por entidad y acción
    const operaciones = {
      transacciones: {
        crear: crearTransaccion,
        editar: editarTransaccion,
        eliminar: eliminarTransaccion
      },
      estudiantes: {
        crear: crearEstudiante,
        editar: editarEstudiante,
        eliminar: eliminarEstudiante
      },
      personal: {
        crear: crearPersonal,
        editar: editarPersonal,
        eliminar: eliminarPersonal
      }
    };

    if (!operaciones[entidad]) {
      return errorResp("Entidad no reconocida: " + entidad);
    }

    if (!operaciones[entidad][accion]) {
      return errorResp("Acción no reconocida: " + accion + " para la entidad: " + entidad);
    }

    return operaciones[entidad][accion](datos);

  } catch (error) {
    return errorResp("Error en POST: " + error.toString());
  }
}
