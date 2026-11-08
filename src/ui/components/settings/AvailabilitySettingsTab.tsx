"use client";

import React from "react";
import { useAvailabilitySettings } from "../../hooks/useAvailabilitySettings";
import { useUIState } from "../../context/UIContext";
import { DayScheduleRow } from "./DayScheduleRow";
import { AbsencePeriodsManager } from "./AbsencePeriodsManager";
import { Icon } from "../common/Icon";

const DAYS_ORDER = [
  { index: 1, label: "Lunes" },
  { index: 2, label: "Martes" },
  { index: 3, label: "Miércoles" },
  { index: 4, label: "Jueves" },
  { index: 5, label: "Viernes" },
  { index: 6, label: "Sábado" },
  { index: 0, label: "Domingo" },
];

const DURATION_OPTIONS = [
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 50, label: "50 min (Estándar)" },
  { value: 60, label: "60 min" },
];

export function AvailabilitySettingsTab() {
  const { showToast } = useUIState();
  const {
    settings,
    loading,
    saveStatus,
    errorMessage,
    isDirty,
    updateDayEnabled,
    updateRange,
    addRange,
    removeRange,
    copyDaySchedule,
    updateSessionDuration,
    addAbsencePeriod,
    removeAbsencePeriod,
    save,
    discardChanges,
  } = useAvailabilitySettings();

  const handleManualSave = async () => {
    const success = await save();
    if (success) {
      showToast("Disponibilidad y horarios guardados correctamente", "success");
    } else {
      showToast("Revisá los horarios antes de guardar", "error");
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-ink-sub flex items-center justify-center gap-2">
        <span className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">Cargando disponibilidad...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Session duration card */}
      <div className="bg-surface border border-line rounded-2xl p-5 shadow-xs space-y-3">
        <div>
          <h2 className="text-base font-semibold text-ink">Duración estándar de la sesión</h2>
          <p className="text-sm text-ink-sub mt-0.5">
            Tiempo predeterminado asignado a cada consulta para el cálculo de turnos libres.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 pt-1">
          {DURATION_OPTIONS.map((opt) => {
            const isSelected = settings.defaultSessionDurationMinutes === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateSessionDuration(opt.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary text-surface font-semibold shadow-xs"
                    : "border-line bg-surface hover:bg-bg-base text-ink"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Weekly Schedule card */}
      <div className="bg-surface border border-line rounded-2xl p-5 shadow-xs space-y-4">
        <div className="border-b border-line pb-3">
          <h2 className="text-base font-semibold text-ink">Horarios de atención semanal</h2>
          <p className="text-sm text-ink-sub mt-0.5">
            Configurá las franjas de disponibilidad de cada día. Podés sumar franjas para horarios cortados (mañana y tarde) y clonarlas a otros días en un clic.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-err-tint border border-err/30 text-err text-sm flex items-start gap-2.5">
            <span className="mt-0.5">
              <Icon name="alert" size={16} />
            </span>
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        <div className="divide-y divide-line/60">
          {DAYS_ORDER.map((day) => {
            const schedule = settings.weekly[day.index] || { enabled: false, ranges: [] };
            return (
              <DayScheduleRow
                key={day.index}
                dayIndex={day.index}
                dayName={day.label}
                schedule={schedule}
                onToggleEnabled={(enabled) => updateDayEnabled(day.index, enabled)}
                onUpdateRange={(idx, field, val) => updateRange(day.index, idx, field, val)}
                onAddRange={() => addRange(day.index)}
                onRemoveRange={(idx) => removeRange(day.index, idx)}
                onCopySchedule={(from, to) => copyDaySchedule(from, to)}
              />
            );
          })}
        </div>
      </div>

      {/* Recess and Vacation Periods card */}
      <AbsencePeriodsManager
        absencePeriods={settings.absencePeriods || []}
        onAddPeriod={addAbsencePeriod}
        onRemovePeriod={removeAbsencePeriod}
      />

      {/* Save button bar (sticky for immediate feedback and easy access) */}
      <div className="sticky bottom-4 z-20 bg-surface/95 backdrop-blur-md border border-line rounded-2xl p-4 shadow-md flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm">
          {saveStatus === "saving" ? (
            <>
              <span className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-ink font-medium">Guardando cambios...</span>
            </>
          ) : saveStatus === "saved" ? (
            <>
              <span className="text-ok">
                <Icon name="check" size={16} />
              </span>
              <span className="text-ok font-medium">Cambios guardados y sincronizados</span>
            </>
          ) : isDirty ? (
            <span className="text-warn font-semibold flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-warn animate-pulse" />
              <span>Tenés cambios sin guardar</span>
            </span>
          ) : (
            <span className="text-ink-sub flex items-center gap-1.5">
              <Icon name="check" size={14} className="text-ok" />
              <span>Disponibilidad al día</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isDirty && (
            <button
              type="button"
              onClick={discardChanges}
              className="px-4 py-2 text-sm font-medium rounded-xl border border-line hover:bg-bg-base text-ink-sub hover:text-ink transition-colors cursor-pointer"
            >
              Descartar
            </button>
          )}

          <button
            type="button"
            onClick={handleManualSave}
            aria-label="Guardar disponibilidad"
            disabled={saveStatus === "saving" || !isDirty}
            className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              saveStatus === "saved"
                ? "bg-ok hover:bg-ok text-white"
                : isDirty
                ? "bg-primary hover:bg-primary-hover text-surface"
                : "bg-surface border border-line-control text-ink-sub opacity-60"
            }`}
          >
            {saveStatus === "saving" ? (
              <>
                <span className="h-3.5 w-3.5 border-2 border-surface border-t-transparent rounded-full animate-spin" />
                <span>Guardando...</span>
              </>
            ) : saveStatus === "saved" ? (
              <>
                <Icon name="check" size={15} />
                <span>Guardado</span>
              </>
            ) : (
              <span>Guardar cambios</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
