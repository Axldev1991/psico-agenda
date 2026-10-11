"use client";

import React from "react";
import { MovementConfig, PunctuationConfig } from "../../../domain/session.types";

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
    <div className="bg-bg-card border border-brand-sand rounded-3xl p-5 shadow-sm space-y-3.5">
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Buscar por palabra, frase o tema en el expediente..."
            className="w-full bg-bg-base/30 border border-brand-sand/40 hover:border-brand-sand/70 focus:border-brand-indigo focus:bg-white focus:outline-none px-4 py-2 text-xs font-semibold text-text-main rounded-2xl transition-all"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedMovementFilter}
            onChange={(e) => onMovementFilterChange(e.target.value)}
            className="bg-bg-base/30 border border-brand-sand/40 hover:border-brand-sand/70 focus:border-brand-indigo focus:bg-white focus:outline-none px-3.5 py-2 text-xs font-semibold text-text-main rounded-2xl transition-all cursor-pointer min-w-44"
          >
            <option value="">Todos los movimientos</option>
            {movementConfigs.map((m) => (
              <option key={m.key} value={m.key}>{m.label}</option>
            ))}
          </select>

          <select
            value={selectedPunctuationFilter}
            onChange={(e) => onPunctuationFilterChange(e.target.value)}
            className="bg-bg-base/30 border border-brand-sand/40 hover:border-brand-sand/70 focus:border-brand-indigo focus:bg-white focus:outline-none px-3.5 py-2 text-xs font-semibold text-text-main rounded-2xl transition-all cursor-pointer min-w-44"
          >
            <option value="">Todas las puntuaciones</option>
            {punctuationConfigs.map((p) => (
              <option key={p.key} value={p.key}>{p.label}</option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-xs text-brand-indigo hover:text-brand-indigo/80 font-bold transition-colors cursor-pointer whitespace-nowrap px-1"
              type="button"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
