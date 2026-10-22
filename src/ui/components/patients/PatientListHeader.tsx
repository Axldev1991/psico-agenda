"use client";

import React from "react";
import { Icon } from "../common/Icon";
import { PatientStatusFilter } from "./PatientStatusTabs";
import { PatientTypeFilter } from "../../../domain/patient.utils";

interface PatientListHeaderProps {
  currentTab: PatientStatusFilter;
  count: number;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  typeFilter: PatientTypeFilter;
  onTypeFilterChange: (type: PatientTypeFilter) => void;
  onOpenPatientModal: () => void;
}

export function PatientListHeader({
  currentTab,
  count,
  searchTerm,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  onOpenPatientModal,
}: PatientListHeaderProps) {
  const pluralize = (n: number, singular: string, plural: string) =>
    `${n} ${n === 1 ? singular : plural}`;

  const typeLabel =
    typeFilter === "adult"
      ? "adultos "
      : typeFilter === "underage"
      ? "infanto-juveniles "
      : "";

  const subtitle =
    currentTab === "active"
      ? pluralize(count, `paciente ${typeLabel}en tratamiento`.trim(), `pacientes ${typeLabel}en tratamiento`.trim())
      : currentTab === "inactive"
      ? pluralize(count, `paciente ${typeLabel}de alta`.trim(), `pacientes ${typeLabel}de alta`.trim())
      : pluralize(count, `paciente ${typeLabel}en total`.trim(), `pacientes ${typeLabel}en total`.trim());

  return (
    <div className="p-5 border-b border-line flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 className="text-xl font-serif font-medium text-ink tracking-tight">
          Fichero de pacientes
        </h2>
        <p className="text-sm text-ink-sub mt-0.5">{subtitle}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
        {/* Population Type Filter */}
        <label htmlFor="patient-type-filter" className="sr-only">
          Filtrar por población
        </label>
        <select
          id="patient-type-filter"
          value={typeFilter}
          onChange={(e) => onTypeFilterChange(e.target.value as PatientTypeFilter)}
          className="bg-surface border border-line rounded-lg px-3 py-2 text-base font-medium text-ink focus:outline-none focus:border-primary transition-colors cursor-pointer"
        >
          <option value="all">Todas las edades</option>
          <option value="adult">Solo Adultos</option>
          <option value="underage">Solo Infanto-juveniles</option>
        </select>

        {/* Search bar */}
        <label className="relative flex-1 sm:w-60">
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
