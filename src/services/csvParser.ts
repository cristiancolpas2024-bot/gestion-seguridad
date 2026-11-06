import { PersonaMensual, ReporteSeguimiento, EstatusAsignacion } from '../types/aci';

/**
 * Standard RFC-4180 compliant CSV parser
 * Handles commas inside quotes, line breaks inside quotes, escaped quotes ("")
 */
export function parseCsvRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  const text = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote: "" -> "
          currentField += '"';
          i++;
        } else {
          // Closing quote
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        currentField = '';
        const hasContent = currentRow.some((cell) => cell.length > 0);
        if (hasContent) {
          rows.push(currentRow);
        }
        currentRow = [];
      } else {
        currentField += char;
      }
    }
  }

  // Push final field/row if any
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    const hasContent = currentRow.some((cell) => cell.length > 0);
    if (hasContent) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * REGLA 5: Conversor de URLs respetando siempre el gid y single=true.
 * - Si la URL ya trae "output=csv", úsala tal cual, SIN quitarle el gid ni el "single=true".
 * - No conviertas estas URLs publicadas a /pub?output=csv perdiendo el gid.
 */
export function convertGoogleSheetUrlToCsv(url: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  // 1. Si la URL ya trae "output=csv" (como las URLs publicadas de Google Sheets),
  // se usa tal cual SIN MODIFICAR NADA para no perder el gid ni single=true.
  if (trimmed.includes('output=csv')) {
    return trimmed;
  }

  // 2. Si ya es una exportación directa con format=csv
  if (trimmed.includes('format=csv')) {
    return trimmed;
  }

  // 3. Caso: URL publicada en formato web (/pubhtml) con parámetros (ej. .../pubhtml?gid=123456&single=true)
  // Reemplaza /pubhtml por /pub y preserva intactos todos los parámetros existentes (incluyendo gid).
  if (trimmed.includes('/pubhtml')) {
    const replaced = trimmed.replace('/pubhtml', '/pub');
    const separator = replaced.includes('?') ? '&' : '?';
    return `${replaced}${separator}output=csv`;
  }

  // 4. Caso: URL publicada terminada en /pub con query params (ej. .../pub?gid=123456&single=true)
  if (trimmed.includes('/pub?') || trimmed.endsWith('/pub')) {
    const separator = trimmed.includes('?') ? '&' : '?';
    return `${trimmed}${separator}output=csv`;
  }

  // 5. Caso: Enlace estándar de Google Drive edit
  // https://docs.google.com/spreadsheets/d/{ID}/edit#gid={GID} o ?gid={GID}
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    const sheetId = match[1];
    // Buscar gid tanto en hash (#gid=) como en query (?gid= o &gid=)
    const gidMatch = trimmed.match(/[#?&]gid=([0-9]+)/);
    const gidParam = gidMatch ? `&gid=${gidMatch[1]}` : '&gid=0';
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gidParam}`;
  }

  return trimmed;
}

/**
 * Normalize header strings for flexible matching (removes accents, lowercase, removes special chars)
 */
function normalizeHeader(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9%]/g, '')
    .trim();
}

/**
 * Parse numeric percentage safely
 */
function parsePercentage(raw: string, reportados: number, meta: number): number {
  if (!raw || raw.trim().length === 0) {
    return meta > 0 ? Math.round((reportados / meta) * 100) : 0;
  }
  const clean = raw.replace('%', '').trim().replace(',', '.');
  const num = parseFloat(clean);
  if (isNaN(num)) {
    return meta > 0 ? Math.round((reportados / meta) * 100) : 0;
  }
  if (num > 0 && num <= 2 && raw.indexOf('%') === -1 && meta > 0) {
    return Math.round(num * 100);
  }
  return Math.round(num);
}

/**
 * Parse PESTAÑA 1 (Mensual) from CSV
 * Columnas del CSV: MES, CEDULA, NOMBRE, CARGO, QR, correo, AREA, Transport, ESTADO,
 * ACIS REPORTADOS, META, %CUMPLIMIENTO.
 * - Usa la FILA 1 de cada CSV como encabezados.
 * - Si el CSV trae filas vacías al final, ignóralas.
 */
export function parseMensualCsv(
  csvText: string,
  existingSeguimiento?: ReporteSeguimiento[]
): PersonaMensual[] {
  const rows = parseCsvRows(csvText);
  if (rows.length < 2) return [];

  // Fila 1 como encabezados
  const headers = rows[0].map(normalizeHeader);

  const findCol = (patterns: string[]): number => {
    for (const pat of patterns) {
      const idx = headers.findIndex((h) => h.includes(pat));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const colMes = findCol(['mes']);
  const colNombre = findCol(['nombre']);
  const colCargo = findCol(['cargo']);
  const colQr = findCol(['qr']);
  const colArea = findCol(['area']);
  const colEstado = findCol(['estado']);
  const colReportados = findCol(['acisreportados', 'reportados', 'aci']);
  const colMeta = findCol(['meta']);
  const colCumplimiento = findCol(['%cumplimiento', 'cumplimiento', 'pct']);

  // Map reports count by QR if available
  const reportCountByQr = new Map<string, number>();
  if (existingSeguimiento && existingSeguimiento.length > 0) {
    existingSeguimiento.forEach((r) => {
      if (r.qr) {
        reportCountByQr.set(r.qr, (reportCountByQr.get(r.qr) || 0) + 1);
      }
    });
  }

  const result: PersonaMensual[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    // Ignorar filas vacías al final o intermedias
    const isRowEmpty = row.every((c) => !c || c.trim().length === 0);
    if (isRowEmpty) continue;

    const nombre = colNombre !== -1 && row[colNombre] ? row[colNombre] : '';
    const qr = colQr !== -1 && row[colQr] ? row[colQr] : '';

    if (!nombre && !qr) continue;

    const cargo = colCargo !== -1 && row[colCargo] ? row[colCargo] : 'Operativo';
    const area = colArea !== -1 && row[colArea] ? row[colArea] : 'General';
    const mes = colMes !== -1 && row[colMes] ? row[colMes] : 'Mes Actual';
    const estado = colEstado !== -1 && row[colEstado] ? row[colEstado] : 'Activo';

    // ACIS REPORTADOS
    let acisReportados = 0;
    if (colReportados !== -1 && row[colReportados]) {
      acisReportados = parseInt(row[colReportados].replace(/[^\d-]/g, ''), 10) || 0;
    } else if (qr && reportCountByQr.has(qr)) {
      acisReportados = reportCountByQr.get(qr) || 0;
    }

    // META
    let meta = 4;
    if (colMeta !== -1 && row[colMeta]) {
      meta = parseInt(row[colMeta].replace(/[^\d-]/g, ''), 10) || 4;
    }

    // %CUMPLIMIENTO
    let porcentajeCumplimiento = 0;
    if (colCumplimiento !== -1 && row[colCumplimiento]) {
      porcentajeCumplimiento = parsePercentage(row[colCumplimiento], acisReportados, meta);
    } else {
      porcentajeCumplimiento = meta > 0 ? Math.round((acisReportados / meta) * 100) : 0;
    }

    result.push({
      mes,
      nombre: nombre || qr,
      cargo,
      qr: qr || `QR-${1000 + i}`,
      area,
      estado,
      acisReportados,
      meta,
      porcentajeCumplimiento,
    });
  }

  return result;
}

/**
 * Parse PESTAÑA 2 (Cumplimiento) from CSV (hoja de reportes de ACIs)
 * Columnas: Folio, Fecha que se Alzó, Reporte de, Reportado por, QR de quien reportó,
 * Área, Tipo de riesgo, Estatus de asignación, entre otras.
 * - Usa la FILA 1 de cada CSV como encabezados.
 * - Si el CSV trae filas vacías al final, ignóralas.
 */
export function parseCumplimientoCsv(csvText: string): ReporteSeguimiento[] {
  const rows = parseCsvRows(csvText);
  if (rows.length < 2) return [];

  // Fila 1 como encabezados
  const headers = rows[0].map(normalizeHeader);

  const findCol = (patterns: string[]): number => {
    for (const pat of patterns) {
      const idx = headers.findIndex((h) => h.includes(pat));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const colFecha = findCol(['fechadequesealzo', 'fechadealzo', 'fechaquealzo', 'fechaalzo', 'fecha']);
  const colReportadoPor = findCol(['reportadopor', 'reportante', 'nombre']);
  const colQr = findCol(['qrdequienreporto', 'qrquienreporto', 'qrreportante', 'qr']);
  const colArea = findCol(['area', 'zona', 'subarea']);
  const colRiesgo = findCol(['tipoderiesgo', 'tiporiesgo', 'riesgo', 'clasificacion']);
  const colEstatus = findCol(['estatusdeasignacion', 'estatusasignacion', 'estatus', 'estado']);
  const colFolio = findCol(['folio', 'id']);
  const colMes = findCol(['mes']);

  const result: ReporteSeguimiento[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    // Ignorar filas vacías al final o intermedias
    const isRowEmpty = row.every((c) => !c || c.trim().length === 0);
    if (isRowEmpty) continue;

    const fechaAlzo = colFecha !== -1 && row[colFecha] ? row[colFecha] : 'Fecha no especificada';
    const reportadoPor = colReportadoPor !== -1 && row[colReportadoPor] ? row[colReportadoPor] : 'Colaborador';
    const qr = colQr !== -1 && row[colQr] ? row[colQr] : (reportadoPor.startsWith('QR-') ? reportadoPor : `QR-${2000 + i}`);
    const area = colArea !== -1 && row[colArea] ? row[colArea] : 'General';
    const tipoRiesgo = colRiesgo !== -1 && row[colRiesgo] ? row[colRiesgo] : 'Riesgo General';

    const rawEstatus = (colEstatus !== -1 && row[colEstatus] ? row[colEstatus] : 'Pendiente').toLowerCase();
    let estatus: EstatusAsignacion = 'Pendiente';
    if (rawEstatus.includes('cerrad')) {
      estatus = 'Cerrado';
    } else if (rawEstatus.includes('asig')) {
      estatus = 'Asignado';
    }

    const folio = colFolio !== -1 && row[colFolio] ? row[colFolio] : `ACI-${i}`;
    const mes = colMes !== -1 && row[colMes] ? row[colMes] : 'Mes Actual';

    result.push({
      id: folio || `SEG-${i}`,
      mes,
      fechaAlzo,
      reportadoPor,
      qr,
      area,
      tipoRiesgo,
      estatus,
    });
  }

  return result;
}

/**
 * Live Fetcher with cache-busting, URL auto-conversion, and error handling.
 * Si la petición directa falla por CORS en el navegador, reintenta mediante el proxy backend /api/fetch-csv.
 */
export async function fetchLiveCsv(url: string): Promise<string> {
  if (!url || !url.trim()) {
    throw new Error('URL vacía');
  }

  const convertedUrl = convertGoogleSheetUrlToCsv(url);

  // Preserve all query parameters (including gid, single=true, output=csv)
  // and add clean cache-buster
  const separator = convertedUrl.includes('?') ? '&' : '?';
  const fetchUrl = `${convertedUrl}${separator}_t=${Date.now()}`;

  try {
    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/csv, text/plain, */*',
      },
      cache: 'no-store',
    });

    if (response.ok) {
      return await response.text();
    }
  } catch (directErr) {
    console.warn('Fallo petición directa (posible CORS), intentando proxy backend:', directErr);
  }

  // Fallback con proxy del servidor backend
  try {
    const proxyUrl = `/api/fetch-csv?url=${encodeURIComponent(convertedUrl)}`;
    const proxyRes = await fetch(proxyUrl);
    if (proxyRes.ok) {
      return await proxyRes.text();
    }
    throw new Error(`HTTP ${proxyRes.status}: ${await proxyRes.text()}`);
  } catch (proxyErr: any) {
    throw new Error(`No se pudo descargar la hoja de cálculo. Verifica que esté publicada en la web como CSV. (${proxyErr.message})`);
  }
}

