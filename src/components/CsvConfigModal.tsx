import React, { useState } from 'react';
import { X, Link2, RefreshCw, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';

interface CsvConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  urlMensual: string;
  urlCumplimiento: string;
  onSave: (url1: string, url2: string) => Promise<void>;
  isLoading: boolean;
  lastUpdated: Date | null;
  statusMessage: { type: 'success' | 'error'; text: string } | null;
}

export const CsvConfigModal: React.FC<CsvConfigModalProps> = ({
  isOpen,
  onClose,
  urlMensual,
  urlCumplimiento,
  onSave,
  isLoading,
  lastUpdated,
  statusMessage,
}) => {
  const [inputUrl1, setInputUrl1] = useState(urlMensual);
  const [inputUrl2, setInputUrl2] = useState(urlCumplimiento);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(inputUrl1.trim(), inputUrl2.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1220]/70">
      <div className="bg-[#FFFFFF] rounded-xl shadow-xl border border-[#E3E8E6] max-w-lg w-full overflow-hidden animate-fadeIn text-xs">
        {/* Header */}
        <div className="p-4 bg-[#0B1220] text-white flex items-center justify-between border-b border-[#1E293B]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#131D31] border border-[#1E293B] flex items-center justify-center text-[#85D60F]">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                Enlaces CSV de Google Sheets
              </h2>
              <span className="text-[11px] text-[#6B7280]">
                Sincronización automática de datos · DC Barranquilla2
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#6B7280] hover:text-white p-1 rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          <div className="p-3 bg-[#F4F6F5] border border-[#E3E8E6] rounded text-[#1F2937] text-[11px] space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-[#1F2937]">
              <HelpCircle className="w-3.5 h-3.5 text-[#5F9A0A]" />
              ¿Cómo obtener el enlace CSV de tu Google Sheet?
            </div>
            <p className="text-[#6B7280]">
              En tu hoja de cálculo ve a <strong>Archivo &gt; Compartir &gt; Publicar en la web</strong>, selecciona la pestaña correspondiente (ej. «MENSUAL» o «SEGUIMIENTO»), elige formato <strong>Valores separados por comas (.csv)</strong> y copia el enlace.
            </p>
          </div>

          {/* FUENTE 1 (Mensual) */}
          <div>
            <label className="block text-[#1F2937] font-bold mb-1">
              FUENTE PESTAÑA 1 (Mensual) — Enlace CSV:
            </label>
            <input
              type="url"
              placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv&gid=..."
              value={inputUrl1}
              onChange={(e) => setInputUrl1(e.target.value)}
              className="w-full px-3 py-1.5 border border-[#E3E8E6] rounded font-mono text-[11px] focus:outline-none focus:border-[#85D60F] text-[#1F2937] placeholder-[#6B7280]"
            />
            <span className="text-[10px] text-[#6B7280] mt-0.5 block">
              Columnas: MES, CEDULA, NOMBRE, CARGO, QR, correo, AREA, Transport, ESTADO, ACIS REPORTADOS, META, %CUMPLIMIENTO.
            </span>
          </div>

          {/* FUENTE 2 (Cumplimiento) */}
          <div>
            <label className="block text-[#1F2937] font-bold mb-1">
              FUENTE PESTAÑA 2 (Cumplimiento) — Enlace CSV:
            </label>
            <input
              type="url"
              placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv&gid=..."
              value={inputUrl2}
              onChange={(e) => setInputUrl2(e.target.value)}
              className="w-full px-3 py-1.5 border border-[#E3E8E6] rounded font-mono text-[11px] focus:outline-none focus:border-[#85D60F] text-[#1F2937] placeholder-[#6B7280]"
            />
            <span className="text-[10px] text-[#6B7280] mt-0.5 block">
              Columnas: Folio, Fecha que se Alzó, Reporte de, Reportado por, QR de quien reportó, Área, Tipo de riesgo, Estatus de asignación.
            </span>
          </div>

          {/* Status Feedback */}
          {statusMessage && (
            <div
              className={`p-2.5 rounded flex items-center gap-2 text-xs ${
                statusMessage.type === 'success'
                  ? 'bg-[#F4F6F5] text-[#4D7C0F] border border-[#4D7C0F]/40'
                  : 'bg-[#FFF5F5] text-[#B91C1C] border border-[#B91C1C]/40'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-[#4D7C0F] shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-[#B91C1C] shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {lastUpdated && (
            <div className="text-[11px] text-[#6B7280]">
              Última actualización: {lastUpdated.toLocaleTimeString()}
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 border-t border-[#E3E8E6] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 border border-[#E3E8E6] text-[#1F2937] rounded font-medium hover:bg-[#F4F6F5] transition-colors cursor-pointer"
            >
              Cerrar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#85D60F] hover:bg-[#5F9A0A] hover:text-white disabled:opacity-50 text-[#0B1220] font-bold rounded transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Sincronizando...' : 'Guardar y Dejar Fijo en el Código'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
