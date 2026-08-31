"use client";

import { useState, useMemo } from "react";
import { Patient } from "../../domain/patient.types";
import { Session } from "../../domain/session.types";
import { extractHighlights, HighlightedSnippet } from "../../domain/patient.utils";

interface PatientHighlightsProps {
  patient: Patient;
  sortedSessions: Session[];
  onJumpToSession: (sessionUuid: string) => void;
}

export function PatientHighlights({ patient, sortedSessions, onJumpToSession }: PatientHighlightsProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const highlights = useMemo(() => {
    return extractHighlights(patient.clinicalHistory || "", sortedSessions);
  }, [patient.clinicalHistory, sortedSessions]);

  const filteredHighlights = useMemo(() => {
    if (!searchQuery.trim()) return highlights;
    const query = searchQuery.toLowerCase();
    return highlights.filter((h) => h.text.toLowerCase().includes(query));
  }, [highlights, searchQuery]);

  const resolveHighlightStyle = (color: string) => {
    let bg = "rgba(148, 163, 184, 0.08)";
    let border = "#cbd5e1";

    if (color.startsWith("rgb")) {
      bg = color.replace("rgb", "rgba").replace(")", ", 0.15)");
      border = color;
    } else if (color.startsWith("#")) {
      bg = color + "26"; // 15% opacidad
      border = color;
    } else {
      border = color;
      bg = color;
    }

    return {
      borderLeft: `5px solid ${border}`,
      backgroundColor: bg,
    };
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Buscador e Info */}
      <div className="bg-bg-card border border-brand-sand rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-title font-bold text-base text-text-main">
              ⭐ Trazabilidad de Marcaciones
            </h3>
            <p className="text-[10px] text-text-sub font-semibold mt-0.5">
              Visualizá e indexá todos los textos resaltados dentro de las evoluciones clínicas de este paciente.
            </p>
          </div>
          <span className="text-[10px] font-bold bg-brand-indigo/10 text-brand-indigo px-2.5 py-1 rounded-full border border-brand-indigo/20 self-start sm:self-auto select-none">
            Total destacados: {highlights.length}
          </span>
        </div>

        {highlights.length > 0 && (
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar marcaciones por palabra clave..."
            className="w-full bg-bg-base/40 border border-brand-sand/60 hover:border-brand-sand focus:border-brand-indigo focus:bg-white focus:outline-none px-4 py-2.5 rounded-2xl text-xs font-semibold text-text-main transition-all"
          />
        )}
      </div>

      {/* Listado de Marcaciones */}
      {filteredHighlights.length > 0 ? (
        <div className="space-y-3">
          {filteredHighlights.map((highlight, index) => (
            <div
              key={`${highlight.sessionUuid}-${index}`}
              className="bg-bg-card border border-brand-sand/60 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 transition-shadow hover:shadow-md"
              style={resolveHighlightStyle(highlight.color)}
            >
              <div className="flex-1 space-y-1.5">
                <blockquote className="text-xs font-semibold text-text-main italic leading-relaxed">
                  "{highlight.text}"
                </blockquote>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-text-sub font-bold">
                  <span className="text-brand-indigo">
                    Sesión N° {highlight.sessionNumber}
                  </span>
                  <span className="text-brand-sand">•</span>
                  <span>{highlight.sessionDate} hs</span>
                </div>
              </div>

              <button
                onClick={() => onJumpToSession(highlight.sessionUuid)}
                className="bg-white hover:bg-brand-sand/15 text-brand-indigo border border-brand-sand/40 font-title font-bold text-[10px] px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow self-end md:self-auto flex items-center gap-1"
                type="button"
              >
                <span>👁️</span> Ver en sesión
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-bg-card border border-brand-sand rounded-3xl p-8 text-center space-y-2">
          <span className="text-3xl block">⭐</span>
          <h4 className="font-title font-bold text-xs text-text-main">
            {highlights.length === 0 
              ? "Sin marcaciones registradas" 
              : "No se encontraron marcaciones que coincidan con la búsqueda"}
          </h4>
          <p className="text-[10px] text-text-sub font-medium max-w-sm mx-auto leading-relaxed">
            {highlights.length === 0 
              ? "Para destacar conceptos clave, objetivos o alertas, seleccioná texto en las evoluciones y aplicales un resaltador de color en la barra de herramientas del editor." 
              : "Probá con otra palabra clave o borrá el filtro de búsqueda."}
          </p>
        </div>
      )}
    </div>
  );
}
