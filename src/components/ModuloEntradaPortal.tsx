import React from 'react';
import { Shield, ArrowRight, Calendar, ListChecks } from 'lucide-react';
import { HeroCamion } from './HeroCamion';

interface ModuloEntradaPortalProps {
  onEnter: (targetTab?: 'mensual' | 'cumplimiento') => void;
  colaboradoresCount: number;
  reportesCount: number;
  isLiveConnected: boolean;
}

export const ModuloEntradaPortal: React.FC<ModuloEntradaPortalProps> = ({
  onEnter,
  colaboradoresCount,
  reportesCount,
  isLiveConnected,
}) => {
  return (
    <div className="min-h-screen bg-[#0B1220] text-[#FFFFFF] flex flex-col justify-center items-center px-4 py-8 select-none font-sans overflow-hidden">
      
      {/* Contenedor central sobrio y corporativo */}
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center">
        
        {/* LOGO OFICIAL DE LOGÍSTICOS */}
        <div className="flex flex-col items-center justify-center mb-5">
          <img
            src="/assets/logisticos.png"
            alt="Logisticos.co - Lo entregamos todo"
            className="h-16 sm:h-20 w-auto max-w-[280px] sm:max-w-[340px] object-contain drop-shadow-xs"
          />
        </div>

        {/* TÍTULO EXACTO SOLICITADO: "Seguimiento Galapa" */}
        <div className="text-center mb-3">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-wide text-[#FFFFFF] uppercase">
            Seguimiento Galapa
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm font-semibold tracking-wider text-[#6B7280] uppercase">
            DC BARRANQUILLA2 · SEGURIDAD Y SALUD EN EL TRABAJO
          </p>
        </div>

        {/* ANIMACIÓN: HERO CAMIÓN DE REPARTO LOGÍSTICOS CON RUEDAS GIRATORIAS Y CARRETERA */}
        <HeroCamion />

        {/* MÓDULO DE HOME: "ACIS" (EL MISMO TE INGRESA AL DASHBOARD) */}
        <div className="w-full max-w-xl mt-2">
          <button
            type="button"
            onClick={() => onEnter('mensual')}
            className="group w-full flex flex-col items-center text-center p-8 sm:p-9 rounded-2xl bg-[#131D31] border border-[#1E293B] hover:border-[#85D60F] hover:bg-[#17233B] transition-all cursor-pointer shadow-lg"
          >
            {/* Ícono de línea simple monocromático con el verde de Logísticos */}
            <div className="w-16 h-16 rounded-xl bg-[#0B1220] border border-[#1E293B] flex items-center justify-center mb-5 text-[#85D60F] group-hover:border-[#85D60F] transition-colors">
              <Shield className="w-8 h-8" strokeWidth={1.8} />
            </div>

            {/* Título del módulo: ACIS */}
            <h2 className="text-2xl sm:text-3xl font-black tracking-widest text-[#FFFFFF] uppercase mb-2">
              ACIS
            </h2>

            {/* Subtítulo y descripción */}
            <p className="text-xs sm:text-sm text-[#85D60F] font-bold tracking-wider uppercase mb-2">
              DASHBOARD DE SEGUIMIENTO OPERACIONAL
            </p>
            
            <p className="text-xs text-[#6B7280] group-hover:text-[#9CA3AF] max-w-md transition-colors leading-relaxed">
              Ingresar al tablero de control de Actos y Condiciones Inseguras. Seguimiento mensual por colaborador y detalle de reportes.
            </p>

            {/* Botón principal de acceso al Dashboard */}
            <div className="mt-6 flex items-center gap-2 text-xs sm:text-sm font-bold text-[#0B1220] bg-[#85D60F] group-hover:bg-[#5F9A0A] group-hover:text-white px-6 py-3 rounded-lg transition-all shadow-md">
              <span>Ingresar al Dashboard ACIS</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>

            {/* Accesos rápidos a las dos pestañas */}
            <div className="mt-6 pt-5 border-t border-[#1E293B] w-full flex flex-col sm:flex-row items-center justify-center gap-3 text-[11px] text-[#6B7280]">
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onEnter('mensual');
                }}
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#0B1220] hover:text-[#85D60F] border border-[#1E293B] transition-colors cursor-pointer"
              >
                <Calendar className="w-3 h-3 text-[#85D60F]" />
                <span>Pestaña Mensual</span>
              </span>

              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onEnter('cumplimiento');
                }}
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#0B1220] hover:text-[#85D60F] border border-[#1E293B] transition-colors cursor-pointer"
              >
                <ListChecks className="w-3 h-3 text-[#85D60F]" />
                <span>Pestaña Cumplimiento</span>
              </span>
            </div>
          </button>
        </div>

        {/* Estado y pie sobrio */}
        <div className="mt-8 text-center text-xs text-[#6B7280] flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isLiveConnected ? 'bg-[#85D60F]' : 'bg-[#6B7280]'
            }`}
          />
          <span>
            {isLiveConnected
              ? `Datos en vivo: ${colaboradoresCount} colaboradores · ${reportesCount} reportes cargados`
              : 'Conexión a Google Sheets configurada'}
          </span>
        </div>

      </div>

    </div>
  );
};
