import React, { useState, useMemo } from 'react';
import { ReporteSeguimiento } from '../types/aci';
import { Search, MapPin, RotateCcw } from 'lucide-react';

interface TabCumplimientoProps {
  data: ReporteSeguimiento[];
}

export const TabCumplimiento: React.FC<TabCumplimientoProps> = ({ data }) => {
  const [searchPersona, setSearchPersona] = useState('');
  const [selectedArea, setSelectedArea] = useState('Todas');

  // REGLA: Un indicador arriba: total de ACIs
  const totalAcis = data.length;

  // Extraer áreas únicas para el filtro
  const uniqueAreas = useMemo(() => {
    const set = new Set<string>();
    data.forEach((r) => r.area && set.add(r.area));
    return Array.from(set).sort();
  }, [data]);

  // Buscador/filtro por persona y por área
  const filteredList = useMemo(() => {
    return data.filter((r) => {
      // Filtro por persona (busca en Reportado por o QR)
      if (searchPersona.trim()) {
        const q = searchPersona.toLowerCase().trim();
        const match =
          r.reportadoPor.toLowerCase().includes(q) ||
          r.qr.toLowerCase().includes(q);
        if (!match) return false;
      }

      // Filtro por área
      if (selectedArea !== 'Todas' && r.area !== selectedArea) {
        return false;
      }

      return true;
    });
  }, [data, searchPersona, selectedArea]);

  const hasFilters = searchPersona.trim().length > 0 || selectedArea !== 'Todas';

  return (
    <div className="space-y-4">
      {/* UN INDICADOR ARRIBA: Total de ACIs */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total de ACIs (Hoja de Reportes)
            </span>
            <div className="mt-1 flex items-baseline gap-3">
              <span className="text-3xl font-extrabold font-mono text-slate-900 tabular-nums">
                {totalAcis}
              </span>
              <span className="text-xs text-slate-500">
                eventos registrados de Actos y Condiciones Inseguras
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-500 tabular-nums">
            Filtrados: <strong className="text-slate-900 font-semibold">{filteredList.length}</strong> de {totalAcis}
          </div>
        </div>
      </div>

      {/* TABLA DE DETALLE: Fecha que se Alzó, Reportado por, Área, Tipo de riesgo, Estatus de asignación */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        {/* Buscador/filtro por persona y por área */}
        <div className="p-3.5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            {/* Buscador por persona */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por persona (nombre o QR)..."
                value={searchPersona}
                onChange={(e) => setSearchPersona(e.target.value)}
                className="w-full pl-8 pr-3 py-1 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-400"
              />
            </div>

            {/* Filtro por área */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1 shrink-0">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Área:
              </label>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="bg-white border border-slate-200 text-slate-800 text-xs rounded-md px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer font-medium"
              >
                <option value="Todas">Todas las áreas</option>
                {uniqueAreas.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reset Filters */}
          {hasFilters && (
            <button
              onClick={() => {
                setSearchPersona('');
                setSelectedArea('Todas');
              }}
              className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 transition-colors self-start sm:self-auto font-medium"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpiar filtros</span>
            </button>
          )}

        </div>

        {/* Tabla responsive con las 5 columnas solicitadas */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 whitespace-nowrap">Fecha que se Alzó</th>
                <th className="py-3 px-4">Reportado por</th>
                <th className="py-3 px-4">Área</th>
                <th className="py-3 px-4">Tipo de riesgo</th>
                <th className="py-3 px-4 text-center">Estatus de asignación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                    No hay reportes que coincidan con la persona o área seleccionada
                  </td>
                </tr>
              ) : (
                filteredList.map((r, idx) => {
                  const isPendiente = r.estatus === 'Pendiente';
                  const isAsignado = r.estatus === 'Asignado';

                  return (
                    <tr
                      key={`${r.id}-${idx}`}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isPendiente ? 'bg-rose-50/25' : ''
                      }`}
                    >
                      {/* Fecha que se Alzó */}
                      <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap tabular-nums">
                        {r.fechaAlzo}
                      </td>

                      {/* Reportado por (con QR de identidad confiable) */}
                      <td className="py-3 px-4 font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 shrink-0">
                            {r.qr}
                          </span>
                          <span className="truncate">{r.reportadoPor}</span>
                        </div>
                      </td>

                      {/* Área */}
                      <td className="py-3 px-4 text-slate-700 whitespace-nowrap font-medium">
                        {r.area}
                      </td>

                      {/* Tipo de riesgo */}
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {r.tipoRiesgo}
                      </td>

                      {/* Estatus de asignación (Rojo solo para alertas: Pendiente) */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-xs font-semibold border ${
                            isPendiente
                              ? 'bg-rose-50 text-rose-700 border-rose-300'
                              : isAsignado
                              ? 'bg-slate-100 text-slate-700 border-slate-300'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {r.estatus}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Mostrando <strong>{filteredList.length}</strong> de {totalAcis} reportes
          </div>
          <div className="text-[11px] text-slate-400">
            Identidad confiable: <strong>Campo QR</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
