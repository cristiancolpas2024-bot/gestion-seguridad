import React, { useState, useMemo } from 'react';
import { PersonaMensual } from '../types/aci';
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
  Check
} from 'lucide-react';

interface TabMensualProps {
  data: PersonaMensual[];
}

type KpiFilter = 'all' | 'cumplieron' | 'en_proceso' | 'sin_cumplir';

// PALETA CORPORATIVA EXACTA
const BRAND_GREEN = '#85D60F';
const SEMAFORO_VERDE = '#4D7C0F';
const SEMAFORO_AMBAR = '#B8860B';
const SEMAFORO_ROJO = '#B91C1C';

export const TabMensual: React.FC<TabMensualProps> = ({ data }) => {
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');
  const [search, setSearch] = useState('');
  
  // TARJETAS TÁCTILES CON FILTRO: Solo una tarjeta activa a la vez
  const [activeKpiFilter, setActiveKpiFilter] = useState<KpiFilter>('all');

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

  return (
    <div className="space-y-6">
      
      {/* 2. FILA DE TARJETAS KPI (Calculadas desde hoja MENSUAL) */}
      {/* 3. TARJETAS TÁCTILES CON FILTRO: al tocar, filtran la tabla y quedan resaltadas */}
      <section aria-label="Tarjetas KPI Mensual">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
            Resumen de Cumplimiento Mensual (Toca una tarjeta para filtrar la tabla)
          </span>
          {activeKpiFilter !== 'all' && (
            <button
              onClick={() => setActiveKpiFilter('all')}
              className="text-xs font-semibold text-[#1F2937] hover:text-[#5F9A0A] flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#85D60F]" />
              <span>Mostrar todos ({kpiStats.totalPersonas})</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          
          {/* TARJETA 1: Colaboradores (Total personas) */}
          <button
            type="button"
            onClick={() => handleCardClick('all')}
            className={`text-left p-4 rounded-lg border transition-colors cursor-pointer relative ${
              activeKpiFilter === 'all'
                ? 'bg-[#FFFFFF] border-[#85D60F] shadow-xs'
                : 'bg-[#FFFFFF] border-[#E3E8E6] hover:bg-[#F4F6F5]'
            }`}
          >
            <div className="flex items-center justify-between text-[#6B7280] mb-2">
              <span className="text-xs font-bold text-[#1F2937]">Colaboradores</span>
              <Users className="w-4 h-4 text-[#6B7280]" strokeWidth={1.8} />
            </div>
            <div className="text-2xl font-black text-[#1F2937] font-mono tabular-nums">
              {kpiStats.totalPersonas}
            </div>
            <div className="text-[11px] text-[#6B7280] mt-1 truncate">
              {kpiStats.promedioCumplimiento}% cumplimiento prom.
            </div>
            {activeKpiFilter === 'all' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#1F2937] mt-2.5 bg-[#F4F6F5] border border-[#E3E8E6] px-2 py-0.5 rounded">
                <Check className="w-3 h-3 text-[#5F9A0A]" /> Todos
              </span>
            )}
          </button>

          {/* TARJETA 2: Cumplieron (>= 100%) - SEMÁFORO VERDE #4D7C0F */}
          <button
            type="button"
            onClick={() => handleCardClick('cumplieron')}
            className={`text-left p-4 rounded-lg border transition-colors cursor-pointer relative ${
              activeKpiFilter === 'cumplieron'
                ? 'bg-[#FFFFFF] border-[#4D7C0F] shadow-xs'
                : 'bg-[#FFFFFF] border-[#E3E8E6] hover:bg-[#F4F6F5]'
            }`}
          >
            <div className="flex items-center justify-between text-[#6B7280] mb-2">
              <span className="text-xs font-bold text-[#1F2937]">Cumplieron</span>
              <CheckCircle2 className="w-4 h-4 text-[#4D7C0F]" strokeWidth={2} />
            </div>
            <div className="text-2xl font-black text-[#1F2937] font-mono tabular-nums">
              {kpiStats.cumplieronCount}
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white"
                style={{ backgroundColor: SEMAFORO_VERDE }}
              >
                ≥100%
              </span>
              <span className="text-[11px] text-[#6B7280]">
                {kpiStats.cumplieronPct}% del grupo
              </span>
            </div>
            {activeKpiFilter === 'cumplieron' ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white mt-2.5 bg-[#4D7C0F] px-2 py-0.5 rounded">
                <Check className="w-3 h-3" /> Filtro activo
              </span>
            ) : (
              <span className="text-[10px] text-[#6B7280] block mt-2.5">Toca para filtrar</span>
            )}
          </button>

          {/* TARJETA 3: En proceso (50% - 99%) - SEMÁFORO ÁMBAR #B8860B */}
          <button
            type="button"
            onClick={() => handleCardClick('en_proceso')}
            className={`text-left p-4 rounded-lg border transition-colors cursor-pointer relative ${
              activeKpiFilter === 'en_proceso'
                ? 'bg-[#FFFFFF] border-[#B8860B] shadow-xs'
                : 'bg-[#FFFFFF] border-[#E3E8E6] hover:bg-[#F4F6F5]'
            }`}
          >
            <div className="flex items-center justify-between text-[#6B7280] mb-2">
              <span className="text-xs font-bold text-[#1F2937]">En proceso</span>
              <Clock className="w-4 h-4 text-[#B8860B]" strokeWidth={2} />
            </div>
            <div className="text-2xl font-black text-[#1F2937] font-mono tabular-nums">
              {kpiStats.enProcesoCount}
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white"
                style={{ backgroundColor: SEMAFORO_AMBAR }}
              >
                50-99%
              </span>
              <span className="text-[11px] text-[#6B7280]">
                {kpiStats.enProcesoPct}% del grupo
              </span>
            </div>
            {activeKpiFilter === 'en_proceso' ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white mt-2.5 bg-[#B8860B] px-2 py-0.5 rounded">
                <Check className="w-3 h-3" /> Filtro activo
              </span>
            ) : (
              <span className="text-[10px] text-[#6B7280] block mt-2.5">Toca para filtrar</span>
            )}
          </button>

          {/* TARJETA 4: Sin cumplir (< 50%) - SEMÁFORO ROJO #B91C1C */}
          <button
            type="button"
            onClick={() => handleCardClick('sin_cumplir')}
            className={`text-left p-4 rounded-lg border transition-colors cursor-pointer relative ${
              activeKpiFilter === 'sin_cumplir'
                ? 'bg-[#FFFFFF] border-[#B91C1C] shadow-xs'
                : 'bg-[#FFFFFF] border-[#E3E8E6] hover:bg-[#F4F6F5]'
            }`}
          >
            <div className="flex items-center justify-between text-[#6B7280] mb-2">
              <span className="text-xs font-bold text-[#B91C1C]">Sin cumplir</span>
              <AlertTriangle className="w-4 h-4 text-[#B91C1C]" strokeWidth={2} />
            </div>
            <div className="text-2xl font-black text-[#B91C1C] font-mono tabular-nums">
              {kpiStats.sinCumplirCount}
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white"
                style={{ backgroundColor: SEMAFORO_ROJO }}
              >
                &lt;50%
              </span>
              <span className="text-[11px] text-[#B91C1C] font-medium">
                {kpiStats.sinCumplirPct}% (Alerta)
              </span>
            </div>
            {activeKpiFilter === 'sin_cumplir' ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white mt-2.5 bg-[#B91C1C] px-2 py-0.5 rounded">
                <Check className="w-3 h-3" /> Filtro activo
              </span>
            ) : (
              <span className="text-[10px] text-[#B91C1C] font-medium block mt-2.5">Toca para alertar</span>
            )}
          </button>

          {/* TARJETA 5: ACIs reportados (Suma total) */}
          <div className="text-left p-4 rounded-lg border bg-[#FFFFFF] border-[#E3E8E6] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[#6B7280] mb-2">
                <span className="text-xs font-bold text-[#1F2937]">ACIs reportados</span>
                <ClipboardCheck className="w-4 h-4 text-[#6B7280]" strokeWidth={1.8} />
              </div>
              <div className="text-2xl font-black text-[#1F2937] font-mono tabular-nums">
                {kpiStats.totalReportados}
              </div>
            </div>
            <div className="text-[11px] text-[#6B7280] mt-1">
              Promedio: <strong className="text-[#1F2937] font-semibold">{kpiStats.promedioPorPersona}</strong> / persona
            </div>
          </div>

        </div>
      </section>

      {/* TABLA PRINCIPAL: NOMBRE, CARGO, ACIS REPORTADOS, META, %CUMPLIMIENTO */}
      <section className="bg-[#FFFFFF] rounded-lg border border-[#E3E8E6] shadow-xs overflow-hidden">
        
        {/* Barra superior de control y filtros */}
        <div className="p-4 border-b border-[#E3E8E6] bg-[#F4F6F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-bold text-[#1F2937]">
              Tabla de Cumplimiento Mensual
            </span>

            {/* Chip de filtro activo */}
            {activeKpiFilter !== 'all' && (
              <span className="inline-flex items-center gap-1.5 bg-[#FFFFFF] text-[#1F2937] border border-[#E3E8E6] text-xs px-2.5 py-0.5 rounded font-medium">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor:
                      activeKpiFilter === 'cumplieron'
                        ? SEMAFORO_VERDE
                        : activeKpiFilter === 'en_proceso'
                        ? SEMAFORO_AMBAR
                        : SEMAFORO_ROJO,
                  }}
                />
                <span>
                  Filtro:{' '}
                  {activeKpiFilter === 'cumplieron'
                    ? 'Cumplieron (≥100%)'
                    : activeKpiFilter === 'en_proceso'
                    ? 'En proceso (50-99%)'
                    : 'Sin cumplir (<50%)'}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveKpiFilter('all')}
                  className="hover:text-[#B91C1C] ml-1 font-bold cursor-pointer"
                  title="Quitar filtro"
                >
                  ×
                </button>
              </span>
            )}

            <span className="text-xs text-[#6B7280]">
              ({sortedData.length} colaboradores mostrados)
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Buscador */}
            <div className="relative max-w-xs w-full">
              <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por nombre, cargo o QR..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FFFFFF] border border-[#E3E8E6] rounded text-[#1F2937] focus:outline-none focus:border-[#85D60F]"
              />
            </div>

            {/* Botón Ordenar por %CUMPLIMIENTO */}
            <button
              type="button"
              onClick={toggleSort}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1F2937] bg-[#FFFFFF] hover:bg-[#F4F6F5] border border-[#E3E8E6] rounded transition-colors shrink-0 cursor-pointer"
              title="Alternar orden de % Cumplimiento"
            >
              <span>Ordenar %:</span>
              <span className="font-bold flex items-center gap-0.5 text-[#1F2937]">
                {sortDirection === 'desc' ? 'Mayor a menor' : 'Menor a mayor'}
                {sortDirection === 'desc' ? (
                  <ArrowDown className="w-3.5 h-3.5" />
                ) : (
                  <ArrowUp className="w-3.5 h-3.5" />
                )}
              </span>
            </button>
          </div>
        </div>

        {/* Tabla responsive con pastillas de color semaforizadas */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F6F5] border-b border-[#E3E8E6] text-[#6B7280] font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 w-12 text-center">Semáforo</th>
                <th className="py-3 px-4">NOMBRE</th>
                <th className="py-3 px-4">CARGO</th>
                <th className="py-3 px-4 text-center">ACIS REPORTADOS</th>
                <th className="py-3 px-4 text-center">META</th>
                <th
                  className="py-3 px-4 text-right cursor-pointer hover:text-[#1F2937] select-none"
                  onClick={toggleSort}
                  title="Clic para ordenar por %CUMPLIMIENTO"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>%CUMPLIMIENTO</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-[#6B7280]" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E8E6]">
              {sortedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[#6B7280] text-xs">
                    {activeKpiFilter !== 'all' ? (
                      <div>
                        <p className="font-semibold text-[#1F2937] mb-1">
                          No hay colaboradores en la categoría seleccionada
                        </p>
                        <button
                          type="button"
                          onClick={() => setActiveKpiFilter('all')}
                          className="text-[#5F9A0A] font-semibold underline text-xs cursor-pointer"
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
                  
                  // SEMAFORIZACIÓN EXACTA:
                  // >= 100% -> VERDE #4D7C0F
                  // 50% a 99% -> ÁMBAR #B8860B
                  // < 50% -> ROJO #B91C1C
                  let semaforoColor = SEMAFORO_ROJO;
                  let semaforoLabel = '<50%';
                  if (pct >= 100) {
                    semaforoColor = SEMAFORO_VERDE;
                    semaforoLabel = '≥100%';
                  } else if (pct >= 50) {
                    semaforoColor = SEMAFORO_AMBAR;
                    semaforoLabel = '50-99%';
                  }

                  const isRed = pct < 50;

                  return (
                    <tr
                      key={`${p.qr}-${idx}`}
                      className={`hover:bg-[#F4F6F5] transition-colors ${
                        isRed ? 'bg-[#FFF5F5]' : ''
                      }`}
                    >
                      {/* Semáforo visual (círculo) */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: semaforoColor }}
                          title={`Semáforo: ${semaforoLabel}`}
                        />
                      </td>

                      {/* NOMBRE (con QR como identidad confiable) */}
                      <td className="py-3 px-4 font-medium text-[#1F2937]">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-[#1F2937] bg-[#F4F6F5] px-1.5 py-0.5 rounded border border-[#E3E8E6] shrink-0">
                            {p.qr}
                          </span>
                          <span className="truncate">{p.nombre}</span>
                        </div>
                      </td>

                      {/* CARGO */}
                      <td className="py-3 px-4 text-[#6B7280]">
                        {p.cargo}
                      </td>

                      {/* ACIS REPORTADOS */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-[#1F2937] tabular-nums">
                        {p.acisReportados}
                      </td>

                      {/* META */}
                      <td className="py-3 px-4 text-center font-mono text-[#6B7280] tabular-nums">
                        {p.meta}
                      </td>

                      {/* %CUMPLIMIENTO con pastilla/chip de color semáforo y texto blanco */}
                      <td className="py-3 px-4 text-right">
                        <span
                          className="inline-block font-mono font-bold tabular-nums px-2.5 py-1 rounded text-xs text-white"
                          style={{ backgroundColor: semaforoColor }}
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
        <div className="p-3 bg-[#F4F6F5] border-t border-[#E3E8E6] flex flex-wrap items-center justify-between text-xs text-[#6B7280] gap-2">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-[#1F2937]">Semáforo:</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SEMAFORO_VERDE }} />
              Verde cumple ≥100%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SEMAFORO_AMBAR }} />
              Ámbar 50% a 99%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SEMAFORO_ROJO }} />
              Rojo &lt;50%
            </span>
          </div>

          <div className="text-[11px] text-[#6B7280]">
            Identidad confiable: <strong className="text-[#1F2937]">Campo QR</strong>
          </div>
        </div>
      </section>

    </div>
  );
};
