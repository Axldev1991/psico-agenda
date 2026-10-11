"use client";

import React from "react";
import { Icon } from "../common/Icon";

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
    <div className="bg-surface border border-line rounded-2xl p-8 md:p-12 shadow-xs text-center max-w-xl mx-auto space-y-5 animate-in fade-in duration-200">
      {isDownloading ? (
        <div className="flex flex-col items-center justify-center space-y-3 py-6">
          <div className="h-10 w-10 rounded-full border-3 border-primary border-t-transparent animate-spin" />
          <h3 className="font-semibold text-ink text-base">
            Descargando expediente completo de Drive...
          </h3>
          <p className="text-sm text-ink-sub">
            Sincronizando evolución clínica y sesiones previas.
          </p>
        </div>
      ) : downloadError ? (
        <div className="space-y-3 py-4">
          <div className="p-3 bg-err-tint text-err rounded-full w-12 h-12 flex items-center justify-center mx-auto">
            <Icon name="alert" size={24} />
          </div>
          <h3 className="font-serif font-medium text-lg text-err">
            No se pudo descargar el historial clínico
          </h3>
          <p className="text-sm text-ink-sub max-w-md mx-auto">{downloadError}</p>
          <button
            type="button"
            onClick={onRetryDownload}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-surface text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer mt-2"
          >
            <Icon name="refresh" size={14} />
            <span>Reintentar descarga</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3 py-4">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary-tint text-primary mb-1">
            <Icon name="folder" size={24} />
          </div>
          <h3 className="font-serif font-medium text-lg text-ink">
            Historial clínico archivado
          </h3>
          <p className="text-sm text-ink-sub max-w-md mx-auto leading-relaxed">
            Este expediente fue archivado localmente para optimizar el almacenamiento del navegador.
            Conectá tu cuenta de Google Drive para descargarlo.
          </p>
          <div className="bg-bg-base/70 border border-line rounded-xl p-3 text-sm text-ink-sub max-w-sm mx-auto">
            {typeof window !== "undefined" && navigator.onLine
              ? "Conexión detectada. Iniciá sesión en Drive desde la barra lateral."
              : "Sin conexión a internet detectada."}
          </div>
        </div>
      )}
    </div>
  );
}
