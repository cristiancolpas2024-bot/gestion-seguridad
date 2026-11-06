import React, { useState, useMemo } from 'react';
import { ReporteSeguimiento } from '../types/aci';
import { Search, MapPin, RotateCcw } from 'lucide-react';

interface TabCumplimientoProps {
  data: ReporteSeguimiento[];
}

const SEMAFORO_VERDE = '#4D7C0F';
const SEMAFORO_AMBAR = '#B8860B';
const SEMAFORO_ROJO = '#B91C1C';

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
    <div className="space-y-6">
      {/* UN INDICADOR ARRIBA: Total de ACIs */}
      <div className="bg-[#FFFFFF] rounded-lg border border-[#E3E8E6] p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
              Total de ACIs (Hoja de Reportes)
            </span>
            <div className="mt-1 flex items-baseline gap-3">
              <span className="text-3xl font-extrabold font-mono text-[#1F2937] tabular-nums">
                {totalAcis}
              </span>
              <span className="text-xs text-[#6B7280]">
                eventos registrados de Actos y Condiciones Inseguras
              </span>
            </div>
          </div>

          <div className="text-xs text-[#6B7280] tabular-nums">
            Filtrados: <strong className="text-[#1F2937] font-semibold">{filteredList.length}</strong> de {totalAcis}
          </div>
        </div>
      </div>

      {/* TABLA DE DETALLE: Fecha que se Alzó, Reportado por, Área, Tipo de riesgo, Estatus de asignación */}
      <div className="bg-[#FFFFFF] rounded-lg border border-[#E3E8E6] shadow-xs overflow-hidden">
        {/* Buscador/filtro por persona y por área */}
        <div className="p-4 border-b border-[#E3E8E6] bg-[#F4F6F5] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            {/* Buscador por persona */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por persona (nombre o QR)..."
                value={searchPersona}
                onChange={(e) => setSearchPersona(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FFFFFF] border border-[#E3E8E6] rounded text-[#1F2937] focus:outline-none focus:border-[#85D60F]"
              />
            </div>

            {/* Filtro por área */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-[#6B7280] flex items-center gap-1 shrink-0">
                <MapPin className="w-3.5 h-3.5 text-[#6B7280]" />
                Área:
              </label>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="bg-[#FFFFFF] border border-[#E3E8E6] text-[#1F2937] text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-[#85D60F] cursor-pointer font-medium"
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
              type="button"
              onClick={() => {
                setSearchPersona('');
                setSelectedArea('Todas');
              }}
              className="flex items-center gap-1 text-xs text-[#1F2937] hover:text-[#B91C1C] px-2.5 py-1.5 rounded bg-[#FFFFFF] border border-[#E3E8E6] hover:bg-[#F4F6F5] transition-colors self-start sm:self-auto font-medium cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 text-[#6B7280]" />
              <span>Limpiar filtros</span>
            </button>
          )}

        </div>

        {/* Tabla responsive con las 5 columnas solicitadas */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F6F5] border-b border-[#E3E8E6] text-[#6B7280] font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 whitespace-nowrap">Fecha que se Alzó</th>
                <th className="py-3 px-4">Reportado por</th>
                <th className="py-3 px-4">Área</th>
                <th className="py-3 px-4">Tipo de riesgo</th>
                <th className="py-3 px-4 text-center">Estatus de asignación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E8E6]">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-[#6B7280] text-xs">
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
                      className={`hover:bg-[#F4F6F5] transition-colors ${
                        isPendiente ? 'bg-[#FFF5F5]' : ''
                      }`}
                    >
                      {/* Fecha que se Alzó */}
                      <td className="py-3 px-4 font-mono text-[#1F2937] whitespace-nowrap tabular-nums">
                        {r.fechaAlzo}
                      </td>

                      {/* Reportado por (con QR de identidad confiable) */}
                      <td className="py-3 px-4 font-medium text-[#1F2937]">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-[#1F2937] bg-[#F4F6F5] px-1.5 py-0.5 rounded border border-[#E3E8E6] shrink-0">
                            {r.qr}
                          </span>
                          <span className="truncate">{r.reportadoPor}</span>
                        </div>
                      </td>

                      {/* Área */}
                      <td className="py-3 px-4 text-[#1F2937] whitespace-nowrap font-medium">
                        {r.area}
                      </td>

                      {/* Tipo de riesgo */}
                      <td className="py-3 px-4 text-[#6B7280] whitespace-nowrap">
                        {r.tipoRiesgo}
                      </td>

                      {/* Estatus de asignación con pastilla semáforo exacta */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold text-white"
                          style={{
                            backgroundColor: isPendiente
                              ? SEMAFORO_ROJO
                              : isAsignado
                              ? SEMAFORO_AMBAR
                              : SEMAFORO_VERDE,
                          }}
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
        <div className="p-3 bg-[#F4F6F5] border-t border-[#E3E8E6] flex items-center justify-between text-xs text-[#6B7280]">
          <div>
            Mostrando <strong>{filteredList.length}</strong> de {totalAcis} reportes
          </div>
          <div className="text-[11px] text-[#6B7280]">
            Identidad confiable: <strong className="text-[#1F2937]">Campo QR</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
