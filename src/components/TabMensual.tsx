import React, { useState, useMemo } from 'react';
import { PersonaMensual } from '../types/aci';
import { ArrowUpDown, ArrowDown, ArrowUp, Search } from 'lucide-react';

interface TabMensualProps {
  data: PersonaMensual[];
}

export const TabMensual: React.FC<TabMensualProps> = ({ data }) => {
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');
  const [search, setSearch] = useState('');

  // REGLA: Un indicador arriba: % de cumplimiento promedio del grupo
  const promedioCumplimiento = useMemo(() => {
    if (data.length === 0) return 0;
    const total = data.reduce((acc, curr) => acc + curr.porcentajeCumplimiento, 0);
    return Math.round(total / data.length);
  }, [data]);

  // Permitir ordenar por %CUMPLIMIENTO y filtrar por buscador
  const sortedData = useMemo(() => {
    return [...data]
      .filter((p) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase().trim();
        return (
          p.nombre.toLowerCase().includes(q) ||
          p.qr.toLowerCase().includes(q) ||
          p.cargo.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortDirection === 'desc') {
          return b.porcentajeCumplimiento - a.porcentajeCumplimiento;
        } else {
          return a.porcentajeCumplimiento - b.porcentajeCumplimiento;
        }
      });
  }, [data, sortDirection, search]);

  const toggleSort = () => {
    setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'));
  };

  return (
    <div className="space-y-4">
      {/* UN INDICADOR ARRIBA: % de cumplimiento promedio del grupo */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Cumplimiento Promedio del Grupo (Hoja MENSUAL)
            </span>
            <div className="mt-1 flex items-baseline gap-3">
              <span className="text-3xl font-extrabold font-mono text-slate-900 tabular-nums">
                {promedioCumplimiento}%
              </span>
              <span className="text-xs text-slate-500">
                promedio de cumplimiento sobre {data.length} colaboradores
              </span>
            </div>
          </div>

          {/* Botón para alternar ordenación por %CUMPLIMIENTO */}
          <button
            onClick={toggleSort}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-md transition-colors self-start sm:self-auto"
          >
            <span>Ordenar por % Cumplimiento:</span>
            <span className="text-blue-700 font-bold flex items-center gap-0.5">
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

      {/* TABLA: NOMBRE, CARGO, ACIS REPORTADOS, META, %CUMPLIMIENTO */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        {/* Buscador opcional para facilitar navegación */}
        <div className="p-3.5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs font-bold text-slate-700">
            Detalle de Cumplimiento Mensual ({sortedData.length} personas)
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por nombre, cargo o QR..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Tabla responsive */}
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
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    No se encontraron registros de colaboradores
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
                      className={`hover:bg-slate-50/80 transition-colors ${
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
      </div>
    </div>
  );
};
