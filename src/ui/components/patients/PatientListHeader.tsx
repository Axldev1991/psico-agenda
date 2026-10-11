"use client";

import React from "react";
import { Icon } from "../common/Icon";
import { PatientStatusFilter } from "./PatientStatusTabs";

interface PatientListHeaderProps {
  currentTab: PatientStatusFilter;
  count: number;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onOpenPatientModal: () => void;
}

export function PatientListHeader({
  currentTab,
  count,
  searchTerm,
  onSearchChange,
  onOpenPatientModal,
}: PatientListHeaderProps) {
  const pluralize = (n: number, singular: string, plural: string) =>
    `${n} ${n === 1 ? singular : plural}`;

  const subtitle =
    currentTab === "active"
      ? pluralize(count, "paciente en tratamiento", "pacientes en tratamiento")
      : currentTab === "inactive"
      ? pluralize(count, "paciente de alta", "pacientes de alta")
      : pluralize(count, "paciente en total", "pacientes en total");

  return (
    <div className="p-5 border-b border-line flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 className="text-xl font-serif font-medium text-ink tracking-tight">
          Fichero de pacientes
        </h2>
        <p className="text-sm text-ink-sub mt-0.5">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto">
        {/* Search bar */}
        <label className="relative flex-1 sm:w-64">
          <span className="sr-only">Buscar paciente</span>
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-sub">
            <Icon name="search" size={16} />
          </span>
          <input
            type="search"
            placeholder="Buscar paciente..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-surface border border-line rounded-lg pl-9 pr-3 py-2 text-base text-ink placeholder:text-ink-sub/60 focus:outline-none focus:border-primary transition-colors"
          />
        </label>

        {/* Primary Action Button */}
        <button
          type="button"
          onClick={onOpenPatientModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-surface text-base font-semibold rounded-lg shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Icon name="plus" size={16} />
          <span>Nuevo paciente</span>
        </button>
      </div>
    </div>
  );
}
