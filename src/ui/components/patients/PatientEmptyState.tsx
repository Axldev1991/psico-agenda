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
      <h3 className="text-lg font-semibold text-ink">
        {hasQuery
          ? `No encontramos pacientes con "${searchTerm.trim()}"`
          : "No hay pacientes en esta lista"}
      </h3>
      <p className="text-base text-ink-sub mt-1 max-w-sm">
        {hasQuery
          ? "Revisá cómo está escrito el nombre o probá buscar en la pestaña “Todos”."
          : "Cuando registres nuevos pacientes o cambies su estado clínico, van a aparecer acá."}
      </p>

      {!hasQuery && (
        <button
          type="button"
          onClick={onOpenPatientModal}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-surface text-base font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Icon name="plus" size={16} />
          <span>Crear tu primer paciente</span>
        </button>
      )}
    </div>
  );
}
