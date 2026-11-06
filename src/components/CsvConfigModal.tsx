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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-fadeIn text-xs">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Enlaces CSV Publicados de Google Sheets
              </h2>
              <span className="text-[11px] text-slate-400">
                Sincronización en vivo de datos
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-blue-900 text-[11px] space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
              ¿Cómo obtener el enlace CSV de tu Google Sheet?
            </div>
            <p className="text-blue-800">
              En tu hoja de cálculo ve a <strong>Archivo &gt; Compartir &gt; Publicar en la web</strong>, selecciona la pestaña correspondiente (ej. «MENSUAL» o «SEGUIMIENTO»), elige formato <strong>Valores separados por comas (.csv)</strong> y copia el enlace.
            </p>
          </div>

          {/* FUENTE 1 (Mensual) */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              FUENTE PESTAÑA 1 (Mensual) — Enlace CSV:
            </label>
            <input
              type="url"
              placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv&gid=..."
              value={inputUrl1}
              onChange={(e) => setInputUrl1(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono text-[11px] focus:ring-1 focus:ring-blue-500 placeholder-slate-400"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Columnas: MES, CEDULA, NOMBRE, CARGO, QR, correo, AREA, Transport, ESTADO, ACIS REPORTADOS, META, %CUMPLIMIENTO.
            </span>
          </div>

          {/* FUENTE 2 (Cumplimiento) */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              FUENTE PESTAÑA 2 (Cumplimiento) — Enlace CSV:
            </label>
            <input
              type="url"
              placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv&gid=..."
              value={inputUrl2}
              onChange={(e) => setInputUrl2(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono text-[11px] focus:ring-1 focus:ring-blue-500 placeholder-slate-400"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Columnas: Folio, Fecha que se Alzó, Reporte de, Reportado por, QR de quien reportó, Área, Tipo de riesgo, Estatus de asignación.
            </span>
          </div>

          {/* Status Feedback */}
          {statusMessage && (
            <div
              className={`p-2.5 rounded-md flex items-center gap-2 text-xs ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {lastUpdated && (
            <div className="text-[11px] text-slate-500">
              Última actualización: {lastUpdated.toLocaleTimeString()}
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 border border-slate-300 text-slate-700 rounded-md font-medium hover:bg-slate-50 transition-colors"
            >
              Cerrar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-md transition-colors"
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
