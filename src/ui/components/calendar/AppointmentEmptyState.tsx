"use client";

import React from "react";
import { Icon } from "../common/Icon";

interface AppointmentEmptyStateProps {
  onOpenSessionModal: () => void;
}

export function AppointmentEmptyState({ onOpenSessionModal }: AppointmentEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-surface border border-line rounded-2xl shadow-xs max-w-lg mx-auto my-6">
      <div className="p-3 bg-bg-base text-ink-sub rounded-xl mb-3">
        <Icon name="calendar" size={28} />
      </div>
      <h3 className="text-base font-semibold text-ink">No hay turnos para este día</h3>
      <p className="text-sm text-ink-sub mt-1 max-w-sm">
        Programá un turno o elegí otro día en el calendario semanal o mensual.
      </p>
      <button
        type="button"
        onClick={onOpenSessionModal}
        className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-bg-base hover:bg-line/40 text-ink border border-line rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
      >
        <Icon name="plus" size={15} />
        <span>Programar turno</span>
      </button>
    </div>
  );
}
