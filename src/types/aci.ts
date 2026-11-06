/**
 * Tipos para el Dashboard de Seguimiento de ACIs - DC Barranquilla2
 * Dos pestañas: "Mensual" (hoja MENSUAL) y "Cumplimiento" (hoja SEGUIMIENTO)
 */

export type EstatusAsignacion = 'Pendiente' | 'Asignado' | 'Cerrado';

// Pestaña 1: Mensual (fuente: hoja MENSUAL)
// Columnas exactas: MES, NOMBRE, CARGO, QR, AREA, ESTADO, ACIS REPORTADOS, META, %CUMPLIMIENTO
export interface PersonaMensual {
  mes: string; // "MES" (ej. "Noviembre 2026", "Octubre 2026", "Septiembre 2026")
  nombre: string; // "NOMBRE"
  cargo: string; // "CARGO"
  qr: string; // "QR" (Identificador confiable único)
  area: string; // "AREA"
  estado: string; // "ESTADO" (Activo, En turno)
  acisReportados: number; // "ACIS REPORTADOS"
  meta: number; // "META"
  porcentajeCumplimiento: number; // "%CUMPLIMIENTO" (acisReportados / meta * 100)
}

// Pestaña 2: Cumplimiento (fuente: hoja SEGUIMIENTO)
// Columnas: Fecha que se Alzó, Reportado por, Área, Tipo de riesgo, Estatus de asignación
export interface ReporteSeguimiento {
  id: string;
  mes: string; // Mes correspondiente
  fechaAlzo: string; // "Fecha que se Alzó"
  reportadoPor: string; // "Reportado por"
  qr: string; // "QR" (Identificador único confiable)
  area: string; // "Área"
  tipoRiesgo: string; // "Tipo de riesgo"
  estatus: EstatusAsignacion; // "Estatus de asignación"
}
