"use client";

import React from "react";

interface PatientArchivedNoticeProps {
  isDownloading: boolean;
  downloadError: string | null;
  onRetryDownload: () => void;
}

export function PatientArchivedNotice({
  isDownloading,
  downloadError,
  onRetryDownload,
}: PatientArchivedNoticeProps) {
  return (
    <div className="bg-bg-card border border-brand-sand rounded-3xl p-8 md:p-12 shadow-sm text-center max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      {isDownloading ? (
        <div className="flex flex-col items-center justify-center space-y-4 py-8">
          <div className="h-12 w-12 rounded-full border-4 border-brand-indigo border-t-transparent animate-spin" />
          <p className="font-title font-bold text-text-main text-base animate-pulse">
            📥 Descargando expediente completo de la nube...
          </p>
          <p className="text-xs text-text-sub">
            Sincronizando evolución clínica y sesiones previas.
          </p>
        </div>
      ) : downloadError ? (
        <div className="space-y-4 py-4">
          <span className="text-4xl block">⚠️</span>
          <h3 className="font-title font-bold text-lg text-status-cancelled-dark">
            No se pudo descargar el historial clínico
          </h3>
          <p className="text-xs text-text-sub max-w-md mx-auto">{downloadError}</p>
          <button
            onClick={onRetryDownload}
            className="bg-brand-indigo hover:bg-brand-indigo/90 text-white font-title font-bold text-xs px-5 py-3 rounded-xl transition-all cursor-pointer shadow-sm inline-flex items-center gap-2 mt-2"
          >
            🔄 Reintentar descarga
          </button>
        </div>
      ) : (
        <div className="space-y-4 py-4">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-brand-lavender/30 text-brand-indigo mb-2">
            <span className="text-3xl">📁</span>
          </div>
          <h3 className="font-title font-bold text-lg text-text-main">
            Historial Clínico Archivado Localmente
          </h3>
          <p className="text-sm text-text-sub max-w-md mx-auto leading-relaxed">
            Este expediente fue archivado localmente para optimizar el almacenamiento de tu dispositivo. 
            Por favor, conéctate a internet e inicia sesión con tu cuenta de Google Drive para descargarlo.
          </p>
          <div className="bg-bg-base/70 border border-brand-sand/50 rounded-2xl p-4 text-xs font-semibold text-text-sub max-w-sm mx-auto">
            {typeof window !== "undefined" && navigator.onLine 
              ? "🌐 Conexión detectada. Iniciá sesión en la sección de Sincronización para poder descargar." 
              : "🔌 Sin conexión a internet detectada."}
          </div>
        </div>
      )}
    </div>
  );
}
