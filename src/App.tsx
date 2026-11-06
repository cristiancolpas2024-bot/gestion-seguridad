import React, { useState, useEffect, useCallback } from 'react';
import { PersonaMensual, ReporteSeguimiento } from './types/aci';
import { DEFAULT_URL_MENSUAL, DEFAULT_URL_CUMPLIMIENTO } from './config/sources';
import { parseMensualCsv, parseCumplimientoCsv, fetchLiveCsv, convertGoogleSheetUrlToCsv } from './services/csvParser';
import { TabMensual } from './components/TabMensual';
import { TabCumplimiento } from './components/TabCumplimiento';
import { CsvConfigModal } from './components/CsvConfigModal';
import { Calendar, ListChecks, Shield, RefreshCw, Link2, FileSpreadsheet } from 'lucide-react';

// Sube la versión de las claves de localStorage para descartar valores viejos guardados
const STORAGE_KEY_URL_MENSUAL = 'aci_csv_url_mensual_v3';
const STORAGE_KEY_URL_CUMPLIMIENTO = 'aci_csv_url_cumplimiento_v3';

export default function App() {
  // Pestañas activas: SOLO DOS PESTAÑAS ("Mensual" y "Cumplimiento")
  const [activeTab, setActiveTab] = useState<'mensual' | 'cumplimiento'>('mensual');

  // Datos en vivo leídos desde Google Sheets (ya NO cargan asset local de prueba)
  const [mensualData, setMensualData] = useState<PersonaMensual[]>([]);
  const [cumplimientoData, setCumplimientoData] = useState<ReporteSeguimiento[]>([]);

  // URLs configuradas: Usa SIEMPRE las URLs por defecto si localStorage está vacío o con valores viejos
  const [urlMensual, setUrlMensual] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_URL_MENSUAL);
      if (saved && saved.trim().length > 0) return saved.trim();
    } catch {
      // Ignorar error de storage
    }
    return DEFAULT_URL_MENSUAL;
  });

  const [urlCumplimiento, setUrlCumplimiento] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_URL_CUMPLIMIENTO);
      if (saved && saved.trim().length > 0) return saved.trim();
    } catch {
      // Ignorar error de storage
    }
    return DEFAULT_URL_CUMPLIMIENTO;
  });

  // Estado de sincronización en vivo
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal de configuración de enlaces CSV / Google Sheets
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);

  // Carga de datos desde URLs de Google Sheets (respeta gid y single=true sin quitarlos)
  const fetchAllData = useCallback(async (u1 = urlMensual, u2 = urlCumplimiento) => {
    const trimmedU1 = u1 ? u1.trim() : '';
    const trimmedU2 = u2 ? u2.trim() : '';

    if (!trimmedU1 && !trimmedU2) {
      setIsLiveConnected(false);
      return;
    }

    setIsLoading(true);
    let loaded1 = false;
    let loaded2 = false;
    const errors: string[] = [];

    // Cargar FUENTE 1 (Mensual)
    if (trimmedU1 && trimmedU1.startsWith('http')) {
      try {
        const csv1 = await fetchLiveCsv(trimmedU1);
        const parsed1 = parseMensualCsv(csv1, cumplimientoData);
        if (parsed1.length > 0) {
          setMensualData(parsed1);
          loaded1 = true;
        } else {
          errors.push('La hoja Mensual no arrojó filas válidas.');
        }
      } catch (err: any) {
        errors.push(`Error al leer Hoja Mensual: ${err.message}`);
      }
    }

    // Cargar FUENTE 2 (Cumplimiento)
    if (trimmedU2 && trimmedU2.startsWith('http')) {
      try {
        const csv2 = await fetchLiveCsv(trimmedU2);
        const parsed2 = parseCumplimientoCsv(csv2);
        if (parsed2.length > 0) {
          setCumplimientoData(parsed2);
          loaded2 = true;
        } else {
          errors.push('La hoja Cumplimiento no arrojó filas válidas.');
        }
      } catch (err: any) {
        errors.push(`Error al leer Hoja Cumplimiento: ${err.message}`);
      }
    }

    setIsLoading(false);
    setLastUpdated(new Date());

    if (loaded1 || loaded2) {
      setIsLiveConnected(true);
      setStatusMessage({
        type: 'success',
        text: `Datos sincronizados exitosamente desde Google Sheets (${loaded1 ? 'Mensual OK' : ''} ${loaded2 ? 'Cumplimiento OK' : ''})`,
      });
    } else if (errors.length > 0) {
      setIsLiveConnected(false);
      setStatusMessage({
        type: 'error',
        text: errors.join(' ') + ' Verifica que la hoja esté publicada en la web como CSV.',
      });
    }
  }, [urlMensual, urlCumplimiento, cumplimientoData]);

  // Al montar: consultar URLs del servidor o persistir las que tenga el cliente
  useEffect(() => {
    const initAndSync = async () => {
      let activeU1 = urlMensual;
      let activeU2 = urlCumplimiento;

      // Buscar si el cliente tiene URLs guardadas en versiones anteriores de localStorage
      if (!activeU1) {
        activeU1 = localStorage.getItem('aci_csv_url_mensual_v3') ||
                   localStorage.getItem('aci_csv_url_mensual_v2') ||
                   localStorage.getItem('aci_csv_url_mensual') || '';
      }
      if (!activeU2) {
        activeU2 = localStorage.getItem('aci_csv_url_cumplimiento_v3') ||
                   localStorage.getItem('aci_csv_url_cumplimiento_v2') ||
                   localStorage.getItem('aci_csv_url_cumplimiento') || '';
      }

      // Consultar endpoint backend /api/sources
      try {
        const res = await fetch('/api/sources');
        if (res.ok) {
          const s = await res.json();
          if (s.urlMensual && !activeU1) activeU1 = s.urlMensual;
          if (s.urlCumplimiento && !activeU2) activeU2 = s.urlCumplimiento;
        }
      } catch {
        // Ignorar si no está disponible
      }

      // Si el cliente tiene URLs activas, fijarlas permanentemente en el servidor
      if (activeU1 || activeU2) {
        setUrlMensual(activeU1);
        setUrlCumplimiento(activeU2);
        try {
          fetch('/api/sources', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urlMensual: activeU1, urlCumplimiento: activeU2 }),
          }).catch(() => {});
        } catch {
          // Ignorar error de guardado
        }
        fetchAllData(activeU1, activeU2);
      }
    };

    initAndSync();
  }, []);

  // Auto-refresco en vivo cada hora (60 minutos)
  useEffect(() => {
    if (!urlMensual && !urlCumplimiento) return;
    const interval = setInterval(() => {
      fetchAllData(urlMensual, urlCumplimiento);
    }, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [urlMensual, urlCumplimiento, fetchAllData]);

  // Guardar y fijar permanentemente en el código fuente
  const handleSaveUrls = async (u1: string, u2: string) => {
    const cleanU1 = convertGoogleSheetUrlToCsv(u1);
    const cleanU2 = convertGoogleSheetUrlToCsv(u2);
    setUrlMensual(cleanU1);
    setUrlCumplimiento(cleanU2);

    try {
      localStorage.setItem(STORAGE_KEY_URL_MENSUAL, cleanU1);
      localStorage.setItem(STORAGE_KEY_URL_CUMPLIMIENTO, cleanU2);
    } catch {
      // Ignorar error de storage
    }

    // Guardar en el servidor para fijarlo en src/config/sources.ts
    try {
      await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urlMensual: cleanU1, urlCumplimiento: cleanU2 }),
      });
    } catch (e) {
      console.warn('No se pudo enviar al endpoint /api/sources:', e);
    }

    await fetchAllData(cleanU1, cleanU2);
  };

  const hasConfiguredUrls = Boolean(urlMensual || urlCumplimiento);

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
                  ) : hasConfiguredUrls ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      <span className="text-amber-400">Conectando a Google Sheets...</span>
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-3 h-3 text-slate-400" />
                      <span className="text-slate-400">Pendiente vincular enlace de hoja</span>
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
                title="Actualizar datos desde Google Sheets (refresco cada hora)"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
                <span className="hidden sm:inline">Refrescar</span>
              </button>

              {/* Botón Vincular Hoja */}
              <button
                onClick={() => setIsConfigModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors shadow-xs"
                title="Vincular o modificar enlace de la hoja Google Sheets"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Vincular Enlace Hoja</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Banner de Estado de Vinculación y Fuentes */}
      <div className="bg-slate-50 border-b border-slate-200 py-2 px-4 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-slate-600">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full shrink-0 ${isLiveConnected ? 'bg-emerald-500' : hasConfiguredUrls ? 'bg-amber-500' : 'bg-slate-400'}`}></span>
            <span>
              {isLiveConnected ? (
                <>
                  Datos en vivo desde Google Sheets: <strong className="text-slate-900">{mensualData.length} colaboradores</strong> en Mensual y <strong className="text-slate-900">{cumplimientoData.length} reportes</strong> en Cumplimiento.
                </>
              ) : hasConfiguredUrls ? (
                <span>Conectando a las URLs de Google Sheets...</span>
              ) : (
                <span>Vincula los enlaces CSV de tu Google Sheet (MENSUAL y SEGUIMIENTO) para leer los datos en vivo.</span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-500 shrink-0">
            {lastUpdated && <span>Última sincronización: {lastUpdated.toLocaleTimeString()}</span>}
            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="text-blue-600 hover:text-blue-800 font-semibold underline"
            >
              {hasConfiguredUrls ? 'Ver / Editar enlaces vinculados' : 'Vincular enlace Google Sheets'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Las dos pestañas como únicas vistas */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Callout si no se han cargado datos todavía */}
        {!hasConfiguredUrls && mensualData.length === 0 && cumplimientoData.length === 0 && (
          <div className="bg-white rounded-xl border border-blue-200 p-6 mb-6 shadow-xs text-center">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Vinculación Directa con Google Sheets (DC Barranquilla2)
            </h3>
            <p className="text-xs text-slate-500 max-w-lg mx-auto mb-4">
              La aplicación lee automáticamente los datos en vivo publicados como CSV desde tus hojas <strong>MENSUAL</strong> y <strong>SEGUIMIENTO</strong>, refrescándolos cada hora sin intervención.
            </p>
            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Pegar Enlaces CSV de Google Sheets</span>
            </button>
          </div>
        )}

        {/* Tab 1: Mensual / Tab 2: Cumplimiento */}
        {activeTab === 'mensual' ? (
          /* PESTAÑA 1 — "Mensual" (usa la FUENTE 1) */
          <TabMensual data={mensualData} seguimientoData={cumplimientoData} />
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
