import React, { useState, useEffect, useCallback } from 'react';
import { initialMensualData, initialSeguimientoData } from './data/mockAciData';
import { PersonaMensual, ReporteSeguimiento } from './types/aci';
import { parseMensualCsv, parseCumplimientoCsv, fetchLiveCsv, convertGoogleSheetUrlToCsv } from './services/csvParser';
import { TabMensual } from './components/TabMensual';
import { TabCumplimiento } from './components/TabCumplimiento';
import { CsvConfigModal } from './components/CsvConfigModal';
import { Calendar, ListChecks, Shield, RefreshCw, Link2, CheckCircle2, AlertCircle, FileSpreadsheet } from 'lucide-react';

const STORAGE_KEY_URL_MENSUAL = 'aci_csv_url_mensual_v2';
const STORAGE_KEY_URL_CUMPLIMIENTO = 'aci_csv_url_cumplimiento_v2';

export default function App() {
  // Pestañas activas: SOLO DOS PESTAÑAS ("Mensual" y "Cumplimiento")
  const [activeTab, setActiveTab] = useState<'mensual' | 'cumplimiento'>('mensual');

  // Datos reales inicializados con la lista de 168 personas de ACIS_84347710
  const [mensualData, setMensualData] = useState<PersonaMensual[]>(initialMensualData);
  const [cumplimientoData, setCumplimientoData] = useState<ReporteSeguimiento[]>(initialSeguimientoData);

  // URLs configuradas de Google Sheets
  const [urlMensual, setUrlMensual] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_URL_MENSUAL) || '';
  });
  const [urlCumplimiento, setUrlCumplimiento] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_URL_CUMPLIMIENTO) || '';
  });

  // Estado de sincronización en vivo
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(new Date());
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal de configuración de enlaces CSV / Google Sheets
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);

  // Carga automática del archivo local oficial /assets/aistudio/ACIS_84347710 si no hay URL remota
  const loadOfficialLocalAsset = useCallback(async () => {
    try {
      const res = await fetch('/assets/aistudio/ACIS_84347710');
      if (res.ok) {
        const text = await res.text();
        const parsed = parseMensualCsv(text, cumplimientoData);
        if (parsed.length > 0) {
          setMensualData(parsed);
        }
      }
    } catch (e) {
      console.warn('Carga de asset local completada con fallback pre-renderizado');
    }
  }, [cumplimientoData]);

  // Carga de datos desde URLs de Google Sheets (convierte enlaces estándar o publicados)
  const fetchAllData = useCallback(async (u1 = urlMensual, u2 = urlCumplimiento) => {
    if (!u1 && !u2) {
      await loadOfficialLocalAsset();
      setIsLiveConnected(false);
      return;
    }

    setIsLoading(true);
    let loaded1 = false;
    let loaded2 = false;
    let errorMsg = '';

    // Cargar FUENTE 1 (Mensual)
    if (u1 && u1.trim().startsWith('http')) {
      try {
        const csv1 = await fetchLiveCsv(u1);
        const parsed1 = parseMensualCsv(csv1, cumplimientoData);
        if (parsed1.length > 0) {
          setMensualData(parsed1);
          loaded1 = true;
        } else {
          errorMsg += 'El CSV mensual no arrojó filas válidas. ';
        }
      } catch (err: any) {
        errorMsg += `Error en Hoja Mensual: ${err.message}. `;
      }
    }

    // Cargar FUENTE 2 (Cumplimiento)
    if (u2 && u2.trim().startsWith('http')) {
      try {
        const csv2 = await fetchLiveCsv(u2);
        const parsed2 = parseCumplimientoCsv(csv2);
        if (parsed2.length > 0) {
          setCumplimientoData(parsed2);
          loaded2 = true;
          // Recalcular el mensual si vino sin conteo
          setMensualData((prev) =>
            parseMensualCsv(
              u1 ? '' : '', // fallback
              parsed2
            ).length > 0 ? parseMensualCsv('', parsed2) : prev
          );
        } else {
          errorMsg += 'El CSV de cumplimiento no arrojó filas válidas. ';
        }
      } catch (err: any) {
        errorMsg += `Error en Hoja Cumplimiento: ${err.message}. `;
      }
    }

    setIsLoading(false);
    setLastUpdated(new Date());

    if (loaded1 || loaded2) {
      setIsLiveConnected(true);
      setStatusMessage({
        type: 'success',
        text: `¡Vinculado a Google Sheets con éxito! (${loaded1 ? 'Mensual OK' : ''} ${loaded2 ? 'Cumplimiento OK' : ''})`,
      });
    } else if (errorMsg) {
      setStatusMessage({
        type: 'error',
        text: errorMsg + 'Asegúrate de que la hoja esté publicada en la web como CSV o con acceso público de lectura.',
      });
    }
  }, [urlMensual, urlCumplimiento, cumplimientoData, loadOfficialLocalAsset]);

  // Ejecutar carga al montar
  useEffect(() => {
    if (urlMensual || urlCumplimiento) {
      fetchAllData(urlMensual, urlCumplimiento);
    } else {
      loadOfficialLocalAsset();
    }
  }, []);

  // Auto-refresco en vivo cada hora (60 minutos)
  useEffect(() => {
    if (!urlMensual && !urlCumplimiento) return;
    const interval = setInterval(() => {
      fetchAllData(urlMensual, urlCumplimiento);
    }, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [urlMensual, urlCumplimiento, fetchAllData]);

  // Guardar y refrescar URLs
  const handleSaveUrls = async (u1: string, u2: string) => {
    const cleanU1 = convertGoogleSheetUrlToCsv(u1);
    const cleanU2 = convertGoogleSheetUrlToCsv(u2);
    setUrlMensual(cleanU1);
    setUrlCumplimiento(cleanU2);
    localStorage.setItem(STORAGE_KEY_URL_MENSUAL, cleanU1);
    localStorage.setItem(STORAGE_KEY_URL_CUMPLIMIENTO, cleanU2);
    await fetchAllData(cleanU1, cleanU2);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans">
      
      {/* Top Bar Corporativa Sobria para Gerencia */}
      <header className="bg-slate-900 border-b border-slate-800 text-white shadow-xs sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            
            {/* Título de la Aplicación e Identidad */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight text-white whitespace-nowrap">
                  DC Barranquilla2 <span className="text-slate-400 font-normal">| Seguimiento de ACIs</span>
                </span>
                <span className="text-[11px] text-slate-400 whitespace-nowrap flex items-center gap-1.5">
                  {isLiveConnected ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="text-emerald-400 font-medium">Vinculado a Google Sheets en Vivo</span>
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-3 h-3 text-blue-400" />
                      <span>Hoja Oficial ACIS ({mensualData.length} colaboradores reales)</span>
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* SOLO DOS PESTAÑAS: "Mensual" y "Cumplimiento" */}
            <nav className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-lg border border-slate-700/60">
              <button
                onClick={() => setActiveTab('mensual')}
                className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-md transition-colors whitespace-nowrap ${
                  activeTab === 'mensual'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Mensual</span>
              </button>

              <button
                onClick={() => setActiveTab('cumplimiento')}
                className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-md transition-colors whitespace-nowrap ${
                  activeTab === 'cumplimiento'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <ListChecks className="w-3.5 h-3.5" />
                <span>Cumplimiento</span>
              </button>
            </nav>

            {/* Acciones de Sincronización y Enlace de Google Sheets */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Botón Refrescar */}
              <button
                onClick={() => fetchAllData()}
                disabled={isLoading}
                title="Actualizar datos desde Google Sheets"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
                <span className="hidden sm:inline">Refrescar</span>
              </button>

              {/* Botón Vincular Hoja */}
              <button
                onClick={() => setIsConfigModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors shadow-xs"
                title="Vincular enlace de la hoja Google Sheets"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Vincular Enlace Hoja</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Banner de Estado de Vinculación */}
      <div className="bg-slate-50 border-b border-slate-200 py-2 px-4 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-slate-600">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
            <span>
              Colaboradores cargados: <strong className="text-slate-900">{mensualData.length} personas</strong> de DC Barranquilla2 (Logisticos.co) vinculadas por su código QR.
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-500 shrink-0">
            {lastUpdated && <span>Actualizado: {lastUpdated.toLocaleTimeString()}</span>}
            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="text-blue-600 hover:text-blue-800 font-semibold underline"
            >
              {urlMensual || urlCumplimiento ? 'Editar enlaces vinculados' : 'Vincular enlace Google Sheets'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Las dos pestañas como únicas vistas */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'mensual' ? (
          /* PESTAÑA 1 — "Mensual" (usa la FUENTE 1) */
          <TabMensual data={mensualData} />
        ) : (
          /* PESTAÑA 2 — "Cumplimiento" (usa la FUENTE 2) */
          <TabCumplimiento data={cumplimientoData} />
        )}
      </main>

      {/* Footer Sobrio */}
      <footer className="bg-white border-t border-slate-200 py-3 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Centro de Distribución <strong>DC Barranquilla2</strong> · Seguridad y Salud en el Trabajo
          </div>
          <div className="text-[11px] text-slate-400">
            Identidad confiable de la persona: <strong>Campo QR</strong>
          </div>
        </div>
      </footer>

      {/* Modal de Configuración y Vinculación de Enlaces de Google Sheets */}
      <CsvConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        urlMensual={urlMensual}
        urlCumplimiento={urlCumplimiento}
        onSave={handleSaveUrls}
        isLoading={isLoading}
        lastUpdated={lastUpdated}
        statusMessage={statusMessage}
      />

    </div>
  );
}
