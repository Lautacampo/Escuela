const encoder = new TextEncoder();

function escaparXML(valor) {
  return String(valor ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function letraColumna(indice) {
  let numero = indice + 1;
  let resultado = "";

  while (numero > 0) {
    numero--;
    resultado = String.fromCharCode(65 + (numero % 26)) + resultado;
    numero = Math.floor(numero / 26);
  }

  return resultado;
}

function celdaXML(valor, columna, fila, cabecera = false) {
  const referencia = `${letraColumna(columna)}${fila}`;
  const estilo = cabecera ? ' s="1"' : "";

  if (typeof valor === "number" && Number.isFinite(valor)) {
    return `<c r="${referencia}"${estilo}><v>${valor}</v></c>`;
  }

  return `<c r="${referencia}"${estilo} t="inlineStr"><is><t xml:space="preserve">${escaparXML(valor)}</t></is></c>`;
}

function checksum(bytes) {
  let crc = 0xffffffff;

  for (const byte of bytes) {
    crc ^= byte;

    for (let i = 0; i < 8; i++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function combinar(bloques) {
  const salida = new Uint8Array(
    bloques.reduce((total, bloque) => total + bloque.length, 0),
  );

  let offset = 0;

  for (const bloque of bloques) {
    salida.set(bloque, offset);
    offset += bloque.length;
  }

  return salida;
}

function empaquetarZIP(archivos) {
  const locales = [];
  const centrales = [];
  let offset = 0;

  for (const [nombre, contenido] of archivos) {
    const path = encoder.encode(nombre);
    const data = encoder.encode(contenido);
    const crc = checksum(data);

    const local = new Uint8Array(30 + path.length);
    const l = new DataView(local.buffer);

    l.setUint32(0, 0x04034b50, true);
    l.setUint16(4, 20, true);
    l.setUint16(6, 0x0800, true);
    l.setUint16(8, 0, true);
    l.setUint32(14, crc, true);
    l.setUint32(18, data.length, true);
    l.setUint32(22, data.length, true);
    l.setUint16(26, path.length, true);
    local.set(path, 30);

    locales.push(local, data);

    const central = new Uint8Array(46 + path.length);
    const c = new DataView(central.buffer);

    c.setUint32(0, 0x02014b50, true);
    c.setUint16(4, 20, true);
    c.setUint16(6, 20, true);
    c.setUint16(8, 0x0800, true);
    c.setUint16(10, 0, true);
    c.setUint32(16, crc, true);
    c.setUint32(20, data.length, true);
    c.setUint32(24, data.length, true);
    c.setUint16(28, path.length, true);
    c.setUint32(42, offset, true);
    central.set(path, 46);

    centrales.push(central);
    offset += local.length + data.length;
  }

  const directorio = combinar(centrales);
  const final = new Uint8Array(22);
  const e = new DataView(final.buffer);

  e.setUint32(0, 0x06054b50, true);
  e.setUint16(8, archivos.length, true);
  e.setUint16(10, archivos.length, true);
  e.setUint32(12, directorio.length, true);
  e.setUint32(16, offset, true);

  return combinar([...locales, directorio, final]);
}

export function crearExcel({ nombreHoja = "Listado", columnas, filas }) {
  if (!Array.isArray(columnas) || columnas.length === 0) {
    throw new Error("La exportación necesita columnas.");
  }

  if (!Array.isArray(filas)) {
    throw new Error("Los datos de exportación no son válidos.");
  }

  if (filas.length >= 1048576) {
    throw new Error("Se excedió el límite de filas de Excel.");
  }

  const nombreSeguro =
    nombreHoja.replace(/[\\/?*\[\]:]/g, " ").slice(0, 31) || "Listado";

  const ultimaCol = letraColumna(columnas.length - 1);
  const ultimaFila = filas.length + 1;

  const xmlFilas = [
    `<row r="1" ht="25" customHeight="1">${columnas
      .map((col, i) => celdaXML(col.titulo, i, 1, true))
      .join("")}</row>`,
  ];

  filas.forEach((datos, i) => {
    xmlFilas.push(
      `<row r="${i + 2}">${columnas
        .map((col, j) => celdaXML(datos[col.clave], j, i + 2))
        .join("")}</row>`,
    );
  });

  const ancho = columnas
    .map(
      (col, i) =>
        `<col min="${i + 1}" max="${i + 1}" width="${Math.max(
          9,
          Math.min(55, col.ancho ?? 20),
        )}" customWidth="1"/>`,
    )
    .join("");

  const hoja = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<dimension ref="A1:${ultimaCol}${ultimaFila}"/>
<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
<sheetFormatPr defaultRowHeight="17"/>
<cols>${ancho}</cols>
<sheetData>${xmlFilas.join("")}</sheetData>
<autoFilter ref="A1:${ultimaCol}${ultimaFila}"/>
</worksheet>`;

  const estilos = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="2"><font><sz val="11"/><name val="Aptos"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Aptos"/></font></fonts>
<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF11284C"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"><alignment vertical="center" wrapText="1"/></xf></cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="${escaparXML(nombreSeguro)}" sheetId="1" r:id="rId1"/></sheets>
</workbook>`;

  const relaciones = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const relLibro = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

  return empaquetarZIP([
    ["[Content_Types].xml", contentTypes],
    ["_rels/.rels", relaciones],
    ["xl/workbook.xml", workbook],
    ["xl/_rels/workbook.xml.rels", relLibro],
    ["xl/worksheets/sheet1.xml", hoja],
    ["xl/styles.xml", estilos],
  ]);
}

export function exportarExcel(opciones) {
  const bytes = crearExcel(opciones);

  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");

  enlace.href = url;
  enlace.download = `${String(opciones.nombreArchivo ?? "listado").replace(
    /[^a-zA-Z0-9_-]/g,
    "_",
  )}.xlsx`;

  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
