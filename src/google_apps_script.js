/**
 * Google Apps Script Backend para PWA de Levantamiento en Expo
 * Vincula la hoja de Google Sheets con la aplicación web.
 */

function doGet(e) {
  var action = e.parameter.action || 'GET_ALL';
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Garantizar existencia de hojas
  var respSheet = getOrCreateSheet(ss, "Respuestas");
  var configSheet = getOrCreateSheet(ss, "Config");
  var brandingSheet = getOrCreateSheet(ss, "Branding");
  
  if (action === 'GET_SCHEMA' || action === 'GET_ALL') {
    var configData = getConfigData(configSheet);
    var brandingData = getBrandingData(brandingSheet);
    
    return responseJSON({
      status: "success",
      schema: configData,
      branding: brandingData
    });
  }
  
  return responseJSON({ status: "error", message: "Acción GET no válida" });
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    var respSheet = getOrCreateSheet(ss, "Respuestas");
    var configSheet = getOrCreateSheet(ss, "Config");
    var brandingSheet = getOrCreateSheet(ss, "Branding");
    
    if (action === 'SUBMIT_RESPONSE') {
      var answers = data.answers; // Objeto { field_id: val }
      var schema = getConfigData(configSheet);
      
      // Asegurar encabezados en pestaña Respuestas
      var headers = ["Timestamp", "ID Registro"];
      schema.forEach(function(item) {
        headers.push(item.label);
      });
      
      if (respSheet.getLastRow() === 0) {
        respSheet.appendRow(headers);
        formatHeaderRow(respSheet);
      } else {
        // Actualizar encabezados si cambiaron
        respSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      }
      
      var row = [new Date(), "REC-" + new Date().getTime()];
      schema.forEach(function(item) {
        var val = answers[item.id];
        if (Array.isArray(val)) {
          val = val.join(", ");
        }
        row.push(val !== undefined ? val : "");
      });
      
      respSheet.appendRow(row);
      return responseJSON({ status: "success", message: "Respuesta guardada con éxito" });
    }
    
    if (action === 'UPDATE_SCHEMA') {
      var newSchema = data.schema;
      configSheet.clear();
      configSheet.appendRow(["ID", "Label", "Type", "Required", "Options", "Order"]);
      formatHeaderRow(configSheet);
      
      newSchema.forEach(function(item, idx) {
        configSheet.appendRow([
          item.id,
          item.label,
          item.type,
          item.required ? "SI" : "NO",
          Array.isArray(item.options) ? item.options.join("|") : (item.options || ""),
          idx + 1
        ]);
      });
      
      return responseJSON({ status: "success", message: "Cuestionario actualizado correctamente" });
    }
    
    if (action === 'UPDATE_BRANDING') {
      var logoUrl = data.logoUrl || "";
      var eventTitle = data.eventTitle || "Levantamiento Expo";
      brandingSheet.clear();
      brandingSheet.appendRow(["Key", "Value"]);
      formatHeaderRow(brandingSheet);
      brandingSheet.appendRow(["logoUrl", logoUrl]);
      brandingSheet.appendRow(["eventTitle", eventTitle]);
      
      return responseJSON({ status: "success", message: "Branding actualizado" });
    }
    
    return responseJSON({ status: "error", message: "Acción POST no válida" });
    
  } catch (err) {
    return responseJSON({ status: "error", message: err.toString() });
  }
}

// Helpers
function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (name === "Config") {
      sheet.appendRow(["ID", "Label", "Type", "Required", "Options", "Order"]);
      formatHeaderRow(sheet);
      // Inicializar preguntas por defecto
      var defaultQuestions = [
        ["q1", "Expo", "text", "SI", "", 1],
        ["q2", "Empresa", "text", "SI", "", 2],
        ["q3", "Nombre del Contacto", "text", "SI", "", 3],
        ["q4", "Correo Electrónico", "email", "SI", "", 4],
        ["q5", "Origen (Ciudad/País)", "text", "NO", "", 5],
        ["q6", "Hotel donde se hospeda", "text", "SI", "", 6],
        ["q7", "Número de personas", "number", "SI", "", 7],
        ["q8", "Fechas de estancia", "text", "NO", "", 8],
        ["q9", "¿Por qué eligieron este hotel?", "textarea", "NO", "", 9]
      ];
      defaultQuestions.forEach(function(q) { sheet.appendRow(q); });
    } else if (name === "Branding") {
      sheet.appendRow(["Key", "Value"]);
      formatHeaderRow(sheet);
      sheet.appendRow(["logoUrl", ""]);
      sheet.appendRow(["eventTitle", "Levantamiento Expo 2026"]);
    }
  }
  return sheet;
}

function getConfigData(sheet) {
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return getDefaultSchema();
  
  var schema = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (!r[0]) continue;
    schema.push({
      id: String(r[0]),
      label: String(r[1]),
      type: String(r[2]),
      required: String(r[3]).toUpperCase() === 'SI',
      options: r[4] ? String(r[4]).split("|").map(function(s){ return s.trim(); }) : [],
      order: Number(r[5]) || i
    });
  }
  return schema;
}

function getBrandingData(sheet) {
  var rows = sheet.getDataRange().getValues();
  var branding = { logoUrl: "", eventTitle: "Levantamiento Expo 2026" };
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === "logoUrl") branding.logoUrl = rows[i][1];
    if (rows[i][0] === "eventTitle") branding.eventTitle = rows[i][1];
  }
  return branding;
}

function getDefaultSchema() {
  return [
    { id: "q1", label: "Expo", type: "text", required: true, options: [] },
    { id: "q2", label: "Empresa", type: "text", required: true, options: [] },
    { id: "q3", label: "Nombre", type: "text", required: true, options: [] },
    { id: "q4", label: "Correo", type: "email", required: true, options: [] },
    { id: "q5", label: "Origen", type: "text", required: false, options: [] },
    { id: "q6", label: "Hotel", type: "text", required: true, options: [] },
    { id: "q7", label: "Número de personas", type: "number", required: true, options: [] },
    { id: "q8", label: "Fechas", type: "text", required: false, options: [] },
    { id: "q9", label: "Por qué eligieron este hotel", type: "textarea", required: false, options: [] }
  ];
}

function formatHeaderRow(sheet) {
  var range = sheet.getRange(1, 1, 1, sheet.getLastColumn() || 6);
  range.setBackground("#0F172A").setFontColor("#FFFFFF").setFontWeight("bold");
}

function responseJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
