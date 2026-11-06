"use client";

import React, { useState } from "react";
import { Icon } from "../common/Icon";
import { executeFactoryReset } from "../../../infrastructure/db/factory-reset.service";
import { useGoogleDrive } from "../../hooks/useGoogleDrive";

export function FactoryResetTab() {
  const { googleToken } = useGoogleDrive();
  const [confirmationText, setConfirmationText] = useState("");
  const [clearCloud, setClearCloud] = useState(true);
  const [status, setStatus] = useState<"idle" | "resetting" | "done" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isConfirmed = confirmationText.trim().toUpperCase() === "BORRAR";

  const handleReset = async () => {
    if (!isConfirmed || status === "resetting") return;

    setStatus("resetting");
    setErrorMessage(null);

    try {
      await executeFactoryReset({ clearCloudDrive: clearCloud && !!googleToken });
      setStatus("done");

      // Recargar la aplicación completa después de un breve delay
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (err: any) {
      console.error("Error al ejecutar el restablecimiento de fábrica:", err);
      setErrorMessage(err?.message || "Ocurrió un error inesperado al restablecer los datos.");
      setStatus("error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Danger Zone Banner */}
      <div className="bg-surface border-2 border-err/30 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-err-tint text-err flex items-center justify-center shrink-0">
            <Icon name="alert" size={24} />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-ink">
              Zona de peligro: Restablecimiento de fábrica
            </h2>
            <p className="text-sm text-ink-sub leading-relaxed">
              Esta operación eliminará permanentemente toda la información de la clínica para que puedas comenzar de cero desde una base limpia.
            </p>
          </div>
        </div>

        {/* Details list */}
        <div className="bg-bg-base/60 border border-line rounded-xl p-4 text-sm space-y-2 text-ink-sub">
          <p className="font-semibold text-ink">Esta acción eliminará de forma irreversible:</p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li>Todos los pacientes registrados y sus datos de filiación.</li>
            <li>El expediente clínico completo y las notas de evolución.</li>
            <li>Todas las sesiones pasadas, presentes y turnos futuros programados.</li>
            <li>Las reglas de turnos recurrentes y disponibilidad semanal.</li>
            <li>Las anotaciones extras y configuraciones personalizadas.</li>
          </ul>
        </div>

        {/* Google Drive Option */}
        {googleToken && (
          <label className="flex items-start gap-3 p-4 rounded-xl border border-line bg-surface hover:bg-bg-base/40 transition-colors cursor-pointer select-none">
            <input
              type="checkbox"
              checked={clearCloud}
              onChange={(e) => setClearCloud(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-line text-err focus:ring-err cursor-pointer"
            />
            <div className="text-sm">
              <span className="font-semibold text-ink block">
                Vaciar también la copia de seguridad en Google Drive
              </span>
              <span className="text-ink-sub text-xs">
                Recomendado para evitar que la sincronización automática de la nube vuelva a restaurar los pacientes anteriores al conectar.
              </span>
            </div>
          </label>
        )}

        {/* Security confirmation input */}
        <div className="space-y-2 pt-2 border-t border-line/60">
          <label htmlFor="confirm-reset-input" className="block text-sm font-medium text-ink">
            Para confirmar la eliminación total, escribí la palabra <strong className="text-err font-bold">BORRAR</strong> a continuación:
          </label>
          <input
            id="confirm-reset-input"
            type="text"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            disabled={status === "resetting" || status === "done"}
            placeholder="Escribí BORRAR"
            autoComplete="off"
            className="w-full sm:w-72 px-4 py-2.5 text-base border border-line-control rounded-xl bg-surface text-ink placeholder:text-ink-sub/50 focus:outline-hidden focus:border-err focus:ring-1 focus:ring-err transition-all disabled:opacity-50"
          />
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-err-tint border border-err/30 text-err text-sm flex items-center gap-2">
            <Icon name="alert" size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Button & Status */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-3 border-t border-line/60">
          <div className="text-sm font-medium">
            {status === "resetting" ? (
              <span className="inline-flex items-center gap-2 text-ink">
                <span className="h-4 w-4 border-2 border-err border-t-transparent rounded-full animate-spin" />
                <span>Borrando datos de la clínica...</span>
              </span>
            ) : status === "done" ? (
              <span className="inline-flex items-center gap-2 text-ok">
                <Icon name="check" size={16} />
                <span>¡Datos eliminados! Reiniciando la aplicación...</span>
              </span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleReset}
            disabled={!isConfirmed || status === "resetting" || status === "done"}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-err hover:bg-err/90 text-white text-base font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Icon name="x" size={16} />
            <span>Borrar todo y restablecer de fábrica</span>
          </button>
        </div>
      </div>
    </div>
  );
}
