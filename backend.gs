/**
 * Sistema de Gestión Escolar - Backend en Google Apps Script
 * 
 * INSTRUCCIONES DE INSTALACIÓN:
 * 1. Crea un nuevo Google Sheets.
 * 2. Renombra la primera hoja ("Hoja 1") a "Transacciones".
 * 3. En la fila 1 de "Transacciones", pon los encabezados: 
 *    A1: ID | B1: Fecha | C1: Tipo | D1: Categoria | E1: Monto | F1: Descripcion
 * 4. Ve al menú: Extensiones > Apps Script.
 * 5. Borra todo el código que aparece y pega este código completo.
 * 6. Guarda el proyecto.
 * 7. Haz clic en "Implementar" (Deploy) > "Nueva implementación".
 * 8. Tipo: "Aplicación web".
 * 9. Ejecutar como: "Yo".
 * 10. Quién tiene acceso: "Cualquier persona" (para que GitHub Pages pueda comunicarse).
 *     (Nota: La seguridad se manejará en Google Sites al incrustar el iframe).
 * 11. Copia la "URL de la aplicación web" resultante y pégala en app.js (SCRIPT_URL).
 */

const SHEET_NAME = "Transacciones";

// Función GET para leer los datos
function doGet(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    
    // Obtener las filas, ignorando el encabezado
    const rows = data.slice(1);
    
    const records = rows.map(row => {
      return {
        id: row[0],
        fecha: row[1],
        tipo: row[2],
        categoria: row[3],
        monto: row[4],
        descripcion: row[5]
      };
    });
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success", data: records }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Manejar opciones preflight (CORS) para peticiones POST desde un navegador
function doOptions(e) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400"
  };
  
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders(headers);
}

// Función POST para insertar nuevos datos
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    
    // Parsear el JSON recibido
    const requestData = JSON.parse(e.postData.contents);
    
    const id = Utilities.getUuid(); // Generar ID único
    const fecha = requestData.fecha || new Date().toLocaleString();
    const tipo = requestData.tipo;
    const categoria = requestData.categoria;
    const monto = requestData.monto;
    const descripcion = requestData.descripcion;
    
    // Insertar en la primera fila vacía al final
    sheet.appendRow([id, fecha, tipo, categoria, monto, descripcion]);
    
    // Retornar éxito con cabeceras CORS
    const response = { status: "success", message: "Registro guardado correctamente" };
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    const response = { status: "error", message: error.toString() };
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
