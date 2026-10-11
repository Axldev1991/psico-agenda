"use client";

import React from "react";
import { MovementConfig, PunctuationConfig } from "../../../domain/session.types";
import { Icon } from "../common/Icon";

interface PatientSearchFiltersProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  selectedMovementFilter: string;
  onMovementFilterChange: (movement: string) => void;
  movementConfigs: MovementConfig[];
  selectedPunctuationFilter: string;
  onPunctuationFilterChange: (punctuation: string) => void;
  punctuationConfigs: PunctuationConfig[];
  onClearFilters: () => void;
}

export function PatientSearchFilters({
  searchQuery,
  onSearchQueryChange,
  selectedMovementFilter,
  onMovementFilterChange,
  movementConfigs,
  selectedPunctuationFilter,
  onPunctuationFilterChange,
  punctuationConfigs,
  onClearFilters,
}: PatientSearchFiltersProps) {
  const hasActiveFilters = Boolean(
    searchQuery || selectedMovementFilter || selectedPunctuationFilter
  );

  return (
    <div className="bg-surface border border-line rounded-2xl p-4 shadow-xs space-y-3">
      <div className="flex flex-col lg:flex-row gap-2.5">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-sub">
            <Icon name="search" size={15} />
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Buscar por palabra, frase o tema en el expediente..."
            className="w-full bg-surface border border-line rounded-lg pl-9 pr-3 py-1.5 text-xs text-ink placeholder:text-ink-sub/60 focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedMovementFilter}
            onChange={(e) => onMovementFilterChange(e.target.value)}
            className="bg-surface border border-line rounded-lg px-3 py-1.5 text-xs text-ink focus:outline-none focus:border-primary transition-colors cursor-pointer min-w-44"
          >
            <option value="">Todos los movimientos</option>
            {movementConfigs.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>

          <select
            value={selectedPunctuationFilter}
            onChange={(e) => onPunctuationFilterChange(e.target.value)}
            className="bg-surface border border-line rounded-lg px-3 py-1.5 text-xs text-ink focus:outline-none focus:border-primary transition-colors cursor-pointer min-w-44"
          >
            <option value="">Todas las puntuaciones</option>
            {punctuationConfigs.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="text-xs text-primary hover:text-primary-hover font-semibold transition-colors cursor-pointer whitespace-nowrap px-1"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
