"use client";

import React from "react";
import { Icon } from "../common/Icon";

interface PatientEmptyStateProps {
  searchTerm: string;
  onOpenPatientModal: () => void;
}

export function PatientEmptyState({
  searchTerm,
  onOpenPatientModal,
}: PatientEmptyStateProps) {
  const hasQuery = Boolean(searchTerm.trim());

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-surface">
      <div className="p-3 bg-bg-base text-ink-sub rounded-xl mb-3">
        <Icon name={hasQuery ? "search" : "folder"} size={26} />
      </div>
      <h3 className="text-base font-semibold text-ink">
        {hasQuery
          ? `No encontramos pacientes con "${searchTerm.trim()}"`
          : "No hay pacientes en esta lista"}
      </h3>
      <p className="text-xs text-ink-sub mt-1 max-w-sm">
        {hasQuery
          ? "Revisá cómo está escrito el nombre o probá buscar en la pestaña “Todos”."
          : "Cuando registres nuevos pacientes o cambies su estado clínico, van a aparecer acá."}
      </p>

      {!hasQuery && (
        <button
          type="button"
          onClick={onOpenPatientModal}
          className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-surface text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Icon name="plus" size={15} />
          <span>Crear tu primer paciente</span>
        </button>
      )}
    </div>
  );
}
