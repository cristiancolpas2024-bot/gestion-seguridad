import React, { useState, useEffect, useCallback } from 'react';
import { PersonaMensual, ReporteSeguimiento } from './types/aci';
import { DEFAULT_URL_MENSUAL, DEFAULT_URL_CUMPLIMIENTO } from './config/sources';
import { parseMensualCsv, parseCumplimientoCsv, fetchLiveCsv, convertGoogleSheetUrlToCsv } from './services/csvParser';
import { TabMensual } from './components/TabMensual';
import { TabCumplimiento } from './components/TabCumplimiento';
import { ModuloEntradaPortal } from './components/ModuloEntradaPortal';
import { CsvConfigModal } from './components/CsvConfigModal';
import { Calendar, ListChecks, Shield, RefreshCw, Link2, FileSpreadsheet, Home } from 'lucide-react';

// Sube la versión de las claves de localStorage para descartar valores viejos guardados
const STORAGE_KEY_URL_MENSUAL = 'aci_csv_url_mensual_v3';
const STORAGE_KEY_URL_CUMPLIMIENTO = 'aci_csv_url_cumplimiento_v3';

export default function App() {
  // Vista actual: 'portal' (Módulo de Entrada estilo foto) o 'dashboard' (Tablero con pestañas)
  const [currentView, setCurrentView] = useState<'portal' | 'dashboard'>('portal');

  // Pestañas activas del Dashboard: SOLO DOS PESTAÑAS ("Mensual" y "Cumplimiento")
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
    const trimmedU1 = (u1 && u1.trim().length > 0) ? u1.trim() : DEFAULT_URL_MENSUAL.trim();
    const trimmedU2 = (u2 && u2.trim().length > 0) ? u2.trim() : DEFAULT_URL_CUMPLIMIENTO.trim();

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
          if (s.urlMensual && (!activeU1 || !activeU1.trim())) activeU1 = s.urlMensual;
          if (s.urlCumplimiento && (!activeU2 || !activeU2.trim())) activeU2 = s.urlCumplimiento;
        }
      } catch {
        // Ignorar si no está disponible
      }

      // Respaldo incondicional: si activeU1 o activeU2 quedan vacías, usar las constantes por defecto
      if (!activeU1 || !activeU1.trim()) {
        activeU1 = DEFAULT_URL_MENSUAL;
      }
      if (!activeU2 || !activeU2.trim()) {
        activeU2 = DEFAULT_URL_CUMPLIMIENTO;
      }

      setUrlMensual(activeU1);
      setUrlCumplimiento(activeU2);

      // Intentar guardar en backend si está disponible
      try {
        fetch('/api/sources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urlMensual: activeU1, urlCumplimiento: activeU2 }),
        }).catch(() => {});
      } catch {
        // Ignorar error de guardado
      }

      // SIEMPRE llama a fetchAllData al montar
      fetchAllData(activeU1, activeU2);
    };

    initAndSync();
  }, [fetchAllData]);

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

  // VISTA 1: Módulo de Entrada (Portal con estilo de la foto)
  if (currentView === 'portal') {
    return (
      <>
        <ModuloEntradaPortal
          onEnter={(targetTab) => {
            if (targetTab) setActiveTab(targetTab);
            setCurrentView('dashboard');
          }}
          colaboradoresCount={mensualData.length}
          reportesCount={cumplimientoData.length}
          isLiveConnected={isLiveConnected}
        />

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
      </>
    );
  }

  // VISTA 2: Dashboard con las dos pestañas ("Mensual" y "Cumplimiento")
  return (
    <div className="min-h-screen bg-[#F4F6F5] text-[#1F2937] flex flex-col font-sans">
      
      {/* Top Bar Corporativa Sobria (#0B1220) */}
      <header className="bg-[#0B1220] border-b border-[#1E293B] text-white shadow-xs sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            
            {/* Logo y Encabezado: Permite volver a la pantalla de entrada */}
            <button
              type="button"
              onClick={() => setCurrentView('portal')}
              className="flex items-center gap-3 shrink-0 text-left cursor-pointer group p-1 -ml-1 rounded transition-colors"
              title="Volver a la pantalla de entrada"
            >
              <img
                src="/assets/logisticos.png"
                alt="Logisticos"
                className="h-8 w-auto max-w-[120px] object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#85D60F] inline-block shrink-0" />
                <div className="flex flex-col">
                  <span className="text-sm font-bold tracking-tight text-white whitespace-nowrap group-hover:text-[#85D60F] transition-colors">
                    Seguimiento Galapa <span className="text-[#6B7280] font-normal">| Seguimiento de ACIs</span>
                  </span>
                  <span className="text-[10px] text-[#6B7280] tracking-wider uppercase">
                    DC Barranquilla2 · Logísticos SST
                  </span>
                </div>
              </div>
            </button>

            {/* SOLO DOS PESTAÑAS: "Mensual" y "Cumplimiento" */}
            <nav className="flex items-center gap-1 bg-[#131D31] p-1 rounded-lg border border-[#1E293B]">
              <button
                type="button"
                onClick={() => setActiveTab('mensual')}
                className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'mensual'
                    ? 'bg-[#85D60F] text-[#0B1220] shadow-xs'
                    : 'text-[#9CA3AF] hover:text-white hover:bg-[#1E293B]'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Mensual</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('cumplimiento')}
                className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'cumplimiento'
                    ? 'bg-[#85D60F] text-[#0B1220] shadow-xs'
                    : 'text-[#9CA3AF] hover:text-white hover:bg-[#1E293B]'
                }`}
              >
                <ListChecks className="w-3.5 h-3.5" />
                <span>Cumplimiento</span>
              </button>
            </nav>

            {/* Acciones de Sincronización y Enlace de Google Sheets */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Botón Volver a la Pantalla de Entrada */}
              <button
                type="button"
                onClick={() => setCurrentView('portal')}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#9CA3AF] hover:text-white bg-[#131D31] hover:bg-[#1E293B] border border-[#1E293B] rounded-md transition-colors cursor-pointer"
                title="Volver a la pantalla de entrada"
              >
                <Home className="w-3.5 h-3.5 text-[#85D60F]" />
                <span>Inicio</span>
              </button>

              {/* Botón Refrescar */}
              <button
                type="button"
                onClick={() => fetchAllData()}
                disabled={isLoading}
                title="Actualizar datos desde Google Sheets (refresco cada hora)"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#9CA3AF] hover:text-white bg-[#131D31] hover:bg-[#1E293B] border border-[#1E293B] rounded-md transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#85D60F]' : ''}`} />
                <span className="hidden sm:inline">Refrescar</span>
              </button>

              {/* Botón Vincular Hoja */}
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#85D60F] hover:bg-[#5F9A0A] hover:text-white text-[#0B1220] rounded-md transition-colors shadow-xs cursor-pointer"
                title="Vincular o modificar enlace de la hoja Google Sheets"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Vincular Enlace Hoja</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Banner de Estado de Vinculación y Fuentes */}
      <div className="bg-[#FFFFFF] border-b border-[#E3E8E6] py-2 px-4 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[#6B7280]">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full shrink-0 ${isLiveConnected ? 'bg-[#85D60F]' : hasConfiguredUrls ? 'bg-[#B8860B]' : 'bg-[#6B7280]'}`}></span>
            <span>
              {isLiveConnected ? (
                <>
                  Datos en vivo desde Google Sheets: <strong className="text-[#1F2937]">{mensualData.length} colaboradores</strong> en Mensual y <strong className="text-[#1F2937]">{cumplimientoData.length} reportes</strong> en Cumplimiento.
                </>
              ) : hasConfiguredUrls ? (
                <span>Conectando a las URLs de Google Sheets...</span>
              ) : (
                <span>Vincula los enlaces CSV de tu Google Sheet (MENSUAL y SEGUIMIENTO) para leer los datos en vivo.</span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-[#6B7280] shrink-0">
            {lastUpdated && <span>Última sincronización: {lastUpdated.toLocaleTimeString()}</span>}
            <button
              type="button"
              onClick={() => setIsConfigModalOpen(true)}
              className="text-[#1F2937] hover:text-[#5F9A0A] font-semibold underline cursor-pointer"
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
          <div className="bg-[#FFFFFF] rounded-lg border border-[#E3E8E6] p-6 mb-6 shadow-xs text-center">
            <div className="w-12 h-12 bg-[#F4F6F5] text-[#5F9A0A] rounded-full flex items-center justify-center mx-auto mb-3 border border-[#E3E8E6]">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#1F2937] mb-1">
              Vinculación Directa con Google Sheets (DC Barranquilla2)
            </h3>
            <p className="text-xs text-[#6B7280] max-w-lg mx-auto mb-4">
              La aplicación lee automáticamente los datos en vivo publicados como CSV desde tus hojas <strong>MENSUAL</strong> y <strong>SEGUIMIENTO</strong>, refrescándolos cada hora sin intervención.
            </p>
            <button
              type="button"
              onClick={() => setIsConfigModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#85D60F] hover:bg-[#5F9A0A] hover:text-white text-[#0B1220] text-xs font-bold rounded shadow-xs transition-colors cursor-pointer"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Pegar Enlaces CSV de Google Sheets</span>
            </button>
          </div>
        )}

        {/* Tab 1: Mensual / Tab 2: Cumplimiento */}
        {activeTab === 'mensual' ? (
          /* PESTAÑA 1 — "Mensual" (usa la FUENTE 1) */
          <TabMensual data={mensualData} />
        ) : (
          /* PESTAÑA 2 — "Cumplimiento" (usa la FUENTE 2) */
          <TabCumplimiento data={cumplimientoData} />
        )}
      </main>

      {/* Footer Sobrio */}
      <footer className="bg-[#FFFFFF] border-t border-[#E3E8E6] py-3 text-xs text-[#6B7280]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Centro de Distribución <strong>DC Barranquilla2</strong> · Seguridad y Salud en el Trabajo · <strong>Logísticos.co</strong>
          </div>
          <div className="text-[11px] text-[#6B7280]">
            Identidad confiable de la persona: <strong className="text-[#1F2937]">Campo QR</strong>
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
