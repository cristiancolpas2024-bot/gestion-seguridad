import React, { useState, useMemo } from 'react';
import { PersonaMensual, ReporteSeguimiento } from '../types/aci';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ClipboardCheck,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  Search,
  RotateCcw,
  LogIn,
  ChevronDown,
  ChevronUp,
  Filter,
  Check
} from 'lucide-react';

interface TabMensualProps {
  data: PersonaMensual[];
  seguimientoData?: ReporteSeguimiento[];
}

type KpiFilter = 'all' | 'cumplieron' | 'en_proceso' | 'sin_cumplir';

export const TabMensual: React.FC<TabMensualProps> = ({ data, seguimientoData = [] }) => {
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');
  const [search, setSearch] = useState('');
  
  // TARJETAS TÁCTILES CON FILTRO: Solo una tarjeta activa a la vez
  const [activeKpiFilter, setActiveKpiFilter] = useState<KpiFilter>('all');

  // Control de despliegue para el módulo "ACIS DE ENTRADA"
  const [isEntradaModuleOpen, setIsEntradaModuleOpen] = useState(true);
  const [entradaViewMode, setEntradaViewMode] = useState<'area' | 'recientes'>('area');

  // Cálculos de las 5 Tarjetas KPI desde la hoja MENSUAL
  const kpiStats = useMemo(() => {
    const totalPersonas = data.length;
    const cumplieron = data.filter((p) => p.porcentajeCumplimiento >= 100);
    const enProceso = data.filter(
      (p) => p.porcentajeCumplimiento >= 50 && p.porcentajeCumplimiento < 100
    );
    const sinCumplir = data.filter((p) => p.porcentajeCumplimiento < 50);
    const totalReportados = data.reduce((acc, curr) => acc + (curr.acisReportados || 0), 0);
    const promedioCumplimiento =
      totalPersonas > 0
        ? Math.round(data.reduce((acc, curr) => acc + curr.porcentajeCumplimiento, 0) / totalPersonas)
        : 0;

    return {
      totalPersonas,
      cumplieronCount: cumplieron.length,
      cumplieronPct: totalPersonas > 0 ? Math.round((cumplieron.length / totalPersonas) * 100) : 0,
      enProcesoCount: enProceso.length,
      enProcesoPct: totalPersonas > 0 ? Math.round((enProceso.length / totalPersonas) * 100) : 0,
      sinCumplirCount: sinCumplir.length,
      sinCumplirPct: totalPersonas > 0 ? Math.round((sinCumplir.length / totalPersonas) * 100) : 0,
      totalReportados,
      promedioCumplimiento,
      promedioPorPersona: totalPersonas > 0 ? (totalReportados / totalPersonas).toFixed(1) : '0',
    };
  }, [data]);

  // Manejador del toque/clic en tarjetas táctiles
  const handleCardClick = (filterType: KpiFilter) => {
    if (filterType === 'all') {
      setActiveKpiFilter('all');
    } else {
      setActiveKpiFilter((prev) => (prev === filterType ? 'all' : filterType));
    }
  };

  // Filtrado reactivo de la tabla según tarjeta activa y buscador
  const filteredData = useMemo(() => {
    return data.filter((p) => {
      // Filtro por tarjeta KPI
      if (activeKpiFilter === 'cumplieron' && p.porcentajeCumplimiento < 100) {
        return false;
      }
      if (
        activeKpiFilter === 'en_proceso' &&
        (p.porcentajeCumplimiento < 50 || p.porcentajeCumplimiento >= 100)
      ) {
        return false;
      }
      if (activeKpiFilter === 'sin_cumplir' && p.porcentajeCumplimiento >= 50) {
        return false;
      }

      // Filtro por buscador
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const match =
          p.nombre.toLowerCase().includes(q) ||
          p.qr.toLowerCase().includes(q) ||
          p.cargo.toLowerCase().includes(q) ||
          p.area.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [data, activeKpiFilter, search]);

  // Ordenación por %CUMPLIMIENTO
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      if (sortDirection === 'desc') {
        return b.porcentajeCumplimiento - a.porcentajeCumplimiento;
      } else {
        return a.porcentajeCumplimiento - b.porcentajeCumplimiento;
      }
    });
  }, [filteredData, sortDirection]);

  const toggleSort = () => {
    setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'));
  };

  // Datos filtrados para el módulo "ACIS DE ENTRADA"
  const acisDeEntrada = useMemo(() => {
    if (!seguimientoData || seguimientoData.length === 0) return [];

    if (entradaViewMode === 'area') {
      // Filtrar por reportes vinculados al área física de Entrada / Inbound / Recepción / Muelle
      const areaMatches = seguimientoData.filter((r) => {
        const a = (r.area || '').toLowerCase();
        return (
          a.includes('entrada') ||
          a.includes('recep') ||
          a.includes('inbound') ||
          a.includes('muelle') ||
          a.includes('descarg')
        );
      });
      // Si no hay ninguno rotulado explícitamente como "Entrada", tomar los primeros del área operativa
      return areaMatches.length > 0 ? areaMatches : seguimientoData.slice(0, 10);
    } else {
      // Vista 'recientes': Últimas entradas de ACIs registradas cronológicamente
      return [...seguimientoData].reverse().slice(0, 10);
    }
  }, [seguimientoData, entradaViewMode]);

  const acisEntradaStats = useMemo(() => {
    const total = acisDeEntrada.length;
    const pendientes = acisDeEntrada.filter((r) => r.estatus === 'Pendiente').length;
    const cerrados = acisDeEntrada.filter((r) => r.estatus === 'Cerrado').length;
    return { total, pendientes, cerrados };
  }, [acisDeEntrada]);

  return (
    <div className="space-y-6">
      
      {/* 2. FILA DE TARJETAS KPI ARRIBA DE LA TABLA (Calculadas desde hoja MENSUAL) */}
      {/* 3. TARJETAS TÁCTILES CON FILTRO: al tocar, filtran la tabla y quedan resaltadas */}
      <section aria-label="Tarjetas KPI Mensual">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Resumen de Cumplimiento Mensual (Toca una tarjeta para filtrar la tabla)
          </span>
          {activeKpiFilter !== 'all' && (
            <button
              onClick={() => setActiveKpiFilter('all')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Mostrar todos ({kpiStats.totalPersonas})</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          
          {/* TARJETA 1: Colaboradores (Total personas) */}
          <button
            type="button"
            onClick={() => handleCardClick('all')}
            className={`text-left p-4 rounded-xl border transition-all cursor-pointer relative shadow-xs ${
              activeKpiFilter === 'all'
                ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/30 shadow-sm'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-xs font-bold text-slate-700">Colaboradores</span>
              <div className="w-7 h-7 rounded-lg bg-blue-100/70 flex items-center justify-center text-blue-700">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono tabular-nums">
              {kpiStats.totalPersonas}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 truncate">
              {kpiStats.promedioCumplimiento}% cumplimiento prom.
            </div>
            {activeKpiFilter === 'all' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 mt-2 bg-blue-100/80 px-1.5 py-0.5 rounded">
                <Check className="w-2.5 h-2.5" /> Vista general
              </span>
            )}
          </button>

          {/* TARJETA 2: Cumplieron (>= 100%) */}
          <button
            type="button"
            onClick={() => handleCardClick('cumplieron')}
            className={`text-left p-4 rounded-xl border transition-all cursor-pointer relative shadow-xs ${
              activeKpiFilter === 'cumplieron'
                ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/40 shadow-sm'
                : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/20'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-xs font-bold text-emerald-800">Cumplieron</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-700 font-mono tabular-nums">
              {kpiStats.cumplieronCount}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
              {kpiStats.cumplieronPct}% del grupo (≥100%)
            </div>
            {activeKpiFilter === 'cumplieron' ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 mt-2 bg-emerald-200/70 px-1.5 py-0.5 rounded">
                <Check className="w-2.5 h-2.5" /> Filtro activo
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 block mt-2">Toca para filtrar</span>
            )}
          </button>

          {/* TARJETA 3: En proceso (50% - 99%) */}
          <button
            type="button"
            onClick={() => handleCardClick('en_proceso')}
            className={`text-left p-4 rounded-xl border transition-all cursor-pointer relative shadow-xs ${
              activeKpiFilter === 'en_proceso'
                ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/40 shadow-sm'
                : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50/20'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-xs font-bold text-amber-800">En proceso</span>
              <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-700 font-mono tabular-nums">
              {kpiStats.enProcesoCount}
            </div>
            <div className="text-[11px] text-amber-600 font-medium mt-0.5">
              {kpiStats.enProcesoPct}% del grupo (50-99%)
            </div>
            {activeKpiFilter === 'en_proceso' ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 mt-2 bg-amber-200/70 px-1.5 py-0.5 rounded">
                <Check className="w-2.5 h-2.5" /> Filtro activo
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 block mt-2">Toca para filtrar</span>
            )}
          </button>

          {/* TARJETA 4: Sin cumplir (< 50% - Alerta en rojo) */}
          <button
            type="button"
            onClick={() => handleCardClick('sin_cumplir')}
            className={`text-left p-4 rounded-xl border transition-all cursor-pointer relative shadow-xs ${
              activeKpiFilter === 'sin_cumplir'
                ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/40 shadow-sm'
                : 'bg-white border-slate-200 hover:border-rose-300 hover:bg-rose-50/20'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-xs font-bold text-rose-800">Sin cumplir</span>
              <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-black text-rose-600 font-mono tabular-nums">
              {kpiStats.sinCumplirCount}
            </div>
            <div className="text-[11px] text-rose-600 font-bold mt-0.5">
              {kpiStats.sinCumplirPct}% del grupo (&lt;50% Alerta)
            </div>
            {activeKpiFilter === 'sin_cumplir' ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 mt-2 bg-rose-200/70 px-1.5 py-0.5 rounded">
                <Check className="w-2.5 h-2.5" /> Filtro activo
              </span>
            ) : (
              <span className="text-[10px] text-rose-500 font-medium block mt-2">Toca para alertar</span>
            )}
          </button>

          {/* TARJETA 5: ACIs reportados (Suma total) */}
          <div
            className="text-left p-4 rounded-xl border bg-white border-slate-200 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-xs font-bold text-slate-700">ACIs reportados</span>
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                  <ClipboardCheck className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono tabular-nums">
                {kpiStats.totalReportados}
              </div>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Promedio: <strong className="text-slate-800 font-semibold">{kpiStats.promedioPorPersona}</strong> / persona
            </div>
          </div>

        </div>
      </section>

      {/* 4. MÓDULO: "ACIS DE ENTRADA" */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Encabezado del Módulo con botón para desplegar/contraer */}
        <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
              <LogIn className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">
                  MÓDULO: ACIS DE ENTRADA
                </h3>
                <span className="text-[10px] bg-blue-800/80 text-blue-200 px-2 py-0.5 rounded font-mono font-bold">
                  DC Barranquilla2
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Eventos y novedades de seguridad registrados en el área de Entrada / Inbound
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* Selector de modo de visualización */}
            <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-[11px]">
              <button
                type="button"
                onClick={() => setEntradaViewMode('area')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  entradaViewMode === 'area'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Área Entrada / Inbound
              </button>
              <button
                type="button"
                onClick={() => setEntradaViewMode('recientes')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  entradaViewMode === 'recientes'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Últimos Ingresados
              </button>
            </div>

            {/* Toggle expandir / colapsar */}
            <button
              type="button"
              onClick={() => setIsEntradaModuleOpen((prev) => !prev)}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
              title={isEntradaModuleOpen ? 'Minimizar módulo' : 'Expandir módulo'}
            >
              {isEntradaModuleOpen ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Contenido del Módulo ACIS DE ENTRADA */}
        {isEntradaModuleOpen && (
          <div className="p-4 space-y-3 bg-slate-50/50">
            {/* Mini-KPIs del módulo de Entrada */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-slate-500">
                  Total ACIs de Entrada
                </span>
                <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
                  {acisEntradaStats.total}
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-rose-600">
                  Pendientes en Entrada
                </span>
                <div className="text-xl font-bold font-mono text-rose-600 mt-0.5">
                  {acisEntradaStats.pendientes}
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-emerald-600">
                  Cerrados / Resueltos
                </span>
                <div className="text-xl font-bold font-mono text-emerald-700 mt-0.5">
                  {acisEntradaStats.cerrados}
                </div>
              </div>
            </div>

            {/* Tabla resumen de ACIs de Entrada */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3 whitespace-nowrap">Fecha</th>
                    <th className="py-2.5 px-3">Reportado por</th>
                    <th className="py-2.5 px-3">Área / Ubicación</th>
                    <th className="py-2.5 px-3">Tipo de Riesgo</th>
                    <th className="py-2.5 px-3 text-center">Estatus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {acisDeEntrada.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                        No hay reportes de entrada en la hoja SEGUIMIENTO
                      </td>
                    </tr>
                  ) : (
                    acisDeEntrada.slice(0, 5).map((r, i) => (
                      <tr key={`${r.id}-${i}`} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono text-slate-600 whitespace-nowrap">
                          {r.fechaAlzo}
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-800">
                          <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1 py-0.5 rounded border border-blue-200 mr-1.5">
                            {r.qr}
                          </span>
                          {r.reportadoPor}
                        </td>
                        <td className="py-2 px-3 text-slate-600 font-medium">
                          {r.area}
                        </td>
                        <td className="py-2 px-3 text-slate-600">
                          {r.tipoRiesgo}
                        </td>
                        <td className="py-2 px-3 text-center whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${
                              r.estatus === 'Pendiente'
                                ? 'bg-rose-50 text-rose-700 border-rose-300'
                                : r.estatus === 'Asignado'
                                ? 'bg-slate-100 text-slate-700 border-slate-300'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {r.estatus}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>
                Mostrando {Math.min(5, acisDeEntrada.length)} de {acisDeEntrada.length} eventos de entrada
              </span>
              <span className="text-slate-400">
                {entradaViewMode === 'area'
                  ? 'Filtrado por: Área física de Entrada / Inbound'
                  : 'Filtrado por: Orden de ingreso cronológico reciente'}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* TABLA PRINCIPAL: NOMBRE, CARGO, ACIS REPORTADOS, META, %CUMPLIMIENTO */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Barra superior de control y filtros */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-xs font-bold text-slate-900">
              Tabla de Cumplimiento Mensual
            </div>

            {/* Chip de filtro activo */}
            {activeKpiFilter !== 'all' && (
              <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-900 border border-blue-300 text-xs px-2.5 py-0.5 rounded-full font-medium">
                <Filter className="w-3 h-3 text-blue-600" />
                <span>
                  Filtro: {activeKpiFilter === 'cumplieron'
                    ? 'Cumplieron (≥100%)'
                    : activeKpiFilter === 'en_proceso'
                    ? 'En proceso (50-99%)'
                    : 'Sin cumplir (<50%)'}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveKpiFilter('all')}
                  className="hover:text-blue-600 ml-0.5 font-bold"
                  title="Quitar filtro"
                >
                  ×
                </button>
              </span>
            )}

            <span className="text-xs text-slate-500">
              ({sortedData.length} personas mostradas)
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Buscador */}
            <div className="relative max-w-xs w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por nombre, cargo o QR..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Botón Ordenar por %CUMPLIMIENTO */}
            <button
              onClick={toggleSort}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-md transition-colors shrink-0"
              title="Alternar orden de % Cumplimiento"
            >
              <span>Ordenar %:</span>
              <span className="text-blue-700 font-bold flex items-center gap-0.5">
                {sortDirection === 'desc' ? 'Mayor a menor' : 'Menor a mayor'}
                {sortDirection === 'desc' ? (
                  <ArrowDown className="w-3 h-3" />
                ) : (
                  <ArrowUp className="w-3 h-3" />
                )}
              </span>
            </button>
          </div>
        </div>

        {/* Tabla responsive con las 5 columnas solicitadas */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 w-12 text-center">Semáforo</th>
                <th className="py-3 px-4">NOMBRE</th>
                <th className="py-3 px-4">CARGO</th>
                <th className="py-3 px-4 text-center">ACIS REPORTADOS</th>
                <th className="py-3 px-4 text-center">META</th>
                <th
                  className="py-3 px-4 text-right cursor-pointer hover:text-slate-800 select-none"
                  onClick={toggleSort}
                  title="Clic para ordenar por %CUMPLIMIENTO"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>%CUMPLIMIENTO</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400 text-xs">
                    {activeKpiFilter !== 'all' ? (
                      <div>
                        <p className="font-semibold text-slate-600 mb-1">
                          No hay colaboradores en la categoría seleccionada
                        </p>
                        <button
                          onClick={() => setActiveKpiFilter('all')}
                          className="text-blue-600 underline text-xs"
                        >
                          Mostrar todos los colaboradores
                        </button>
                      </div>
                    ) : (
                      'No se encontraron registros de colaboradores'
                    )}
                  </td>
                </tr>
              ) : (
                sortedData.map((p, idx) => {
                  const pct = p.porcentajeCumplimiento;
                  // Semáforo en %CUMPLIMIENTO: verde >=100%, amarillo 50-99%, rojo <50%
                  const isGreen = pct >= 100;
                  const isYellow = pct >= 50 && pct < 100;
                  const isRed = pct < 50;

                  return (
                    <tr
                      key={`${p.qr}-${idx}`}
                      className={`hover:bg-slate-50/90 transition-colors ${
                        isRed ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      {/* Semáforo visual */}
                      <td className="py-3 px-4 text-center">
                        {isGreen && (
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"
                            title="Verde (≥100%)"
                          />
                        )}
                        {isYellow && (
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500"
                            title="Amarillo (50-99%)"
                          />
                        )}
                        {isRed && (
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-full bg-rose-600"
                            title="Rojo (<50% - Alerta)"
                          />
                        )}
                      </td>

                      {/* NOMBRE (con QR como identidad confiable) */}
                      <td className="py-3 px-4 font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 shrink-0">
                            {p.qr}
                          </span>
                          <span className="truncate">{p.nombre}</span>
                        </div>
                      </td>

                      {/* CARGO */}
                      <td className="py-3 px-4 text-slate-600">
                        {p.cargo}
                      </td>

                      {/* ACIS REPORTADOS */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-900 tabular-nums">
                        {p.acisReportados}
                      </td>

                      {/* META */}
                      <td className="py-3 px-4 text-center font-mono text-slate-500 tabular-nums">
                        {p.meta}
                      </td>

                      {/* %CUMPLIMIENTO con Semáforo exacto */}
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`inline-block font-mono font-bold tabular-nums px-2.5 py-0.5 rounded text-xs border ${
                            isGreen
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : isYellow
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-rose-50 text-rose-800 border-rose-300'
                          }`}
                        >
                          {pct}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Semáforo Leyenda */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-700">Semáforo:</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Verde ≥100%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> Amarillo 50-99%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-600"></span> Rojo &lt;50%
            </span>
          </div>

          <div className="text-[11px] text-slate-400">
            Identidad confiable de la persona: <strong>Campo QR</strong>
          </div>
        </div>
      </section>

    </div>
  );
};
