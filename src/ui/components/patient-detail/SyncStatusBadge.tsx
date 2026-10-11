"use client";

import React from "react";

interface SyncStatusBadgeProps {
  googleToken: string | null;
  syncStatus: string;
  isLocalSaving: boolean;
  saveFeedback: boolean;
  hasPendingDriveUpload: boolean;
}

export function SyncStatusBadge({
  googleToken,
  syncStatus,
  isLocalSaving,
  saveFeedback,
  hasPendingDriveUpload,
}: SyncStatusBadgeProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 select-none">
      {googleToken ? (
        syncStatus === "syncing" ? (
          <div className="bg-brand-indigo/90 backdrop-blur-md text-white border border-brand-indigo/40 px-5 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 hover:scale-105 transition-transform duration-200">
            <span className="animate-spin text-sm">🌀</span> Sincronizando en la nube...
          </div>
        ) : isLocalSaving ? (
          <div className="bg-amber-500/90 backdrop-blur-md text-white border border-amber-400/40 px-5 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 animate-pulse hover:scale-105 transition-transform duration-200">
            Guardando en PC...
          </div>
        ) : saveFeedback || hasPendingDriveUpload ? (
          <div className="bg-amber-500/90 backdrop-blur-md text-white border border-amber-400/40 px-5 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 hover:scale-105 transition-transform duration-200">
            Guardando en PC
          </div>
        ) : (
          <div className="bg-emerald-600/90 backdrop-blur-md text-white border border-emerald-500/40 px-5 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 hover:scale-105 transition-transform duration-200">
            Respaldo al día
          </div>
        )
      ) : isLocalSaving ? (
        <div className="bg-amber-500/90 backdrop-blur-md text-white border border-amber-400/40 px-5 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 animate-pulse hover:scale-105 transition-transform duration-200">
          Guardando en PC...
        </div>
      ) : saveFeedback ? (
        <div className="bg-emerald-600/90 backdrop-blur-md text-white border border-emerald-500/40 px-5 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 hover:scale-105 transition-transform duration-200 animate-bounce">
          ¡Guardado en PC!
        </div>
      ) : (
        <div className="bg-slate-600/90 backdrop-blur-md text-white border border-slate-500/40 px-5 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 hover:scale-105 transition-transform duration-200 opacity-80">
          Guardado en PC (Sin conexión)
        </div>
      )}
    </div>
  );
}
