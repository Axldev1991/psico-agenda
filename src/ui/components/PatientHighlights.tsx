"use client";

import { useState, useMemo } from "react";
import { Patient } from "../../domain/patient.types";
import { Session } from "../../domain/session.types";
import { extractHighlights } from "../../domain/patient.utils";
import { useSettings } from "../hooks/useSettings";
import { Icon } from "./common/Icon";

interface PatientHighlightsProps {
  patient: Patient;
  sortedSessions: Session[];
  onJumpToSession: (sessionUuid: string) => void;
}

export function PatientHighlights({ patient, sortedSessions, onJumpToSession }: PatientHighlightsProps) {
  const { punctuationConfigs } = useSettings();
  const [searchQuery, setSearchQuery] = useState("");

  const defaultPunctuation = [
    { key: "yellow", color: "#FEF08A", label: "Amarillo" },
    { key: "green", color: "#BBF7D0", label: "Verde" },
    { key: "purple", color: "#E9D5FF", label: "Lavanda" },
    { key: "orange", color: "#FED7AA", label: "Arena" }
  ];
  const configsToUse = punctuationConfigs.length > 0 ? punctuationConfigs : defaultPunctuation;

  const highlights = useMemo(() => {
    return extractHighlights(patient.clinicalHistory || "", sortedSessions);
  }, [patient.clinicalHistory, sortedSessions]);

  // Convertir RGB a Hexadecimal para comparación precisa
  const rgbToHex = (rgbStr: string) => {
    const match = rgbStr.match(/\d+/g);
    if (!match) return rgbStr;
    const r = parseInt(match[0]);
    const g = parseInt(match[1]);
    const b = parseInt(match[2]);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
  };

  const getPunctuationLabel = (color: string) => {
    const cleanColor = color.startsWith("rgb") ? rgbToHex(color) : color.toUpperCase();
    const config = configsToUse.find(c => {
      const cColor = c.color.toUpperCase();
      return cColor === cleanColor || c.key === color;
    });
    return config ? config.label : "Marcación";
  };

  const filteredHighlights = useMemo(() => {
    if (!searchQuery.trim()) return highlights;
    const query = searchQuery.toLowerCase();
    return highlights.filter((h) => {
      const label = getPunctuationLabel(h.color).toLowerCase();
      return h.text.toLowerCase().includes(query) || label.includes(query);
    });
  }, [highlights, searchQuery, configsToUse]);

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
      borderLeft: `4px solid ${border}`,
      backgroundColor: bg,
    };
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Buscador e Info */}
      <div className="bg-surface border border-line rounded-3xl p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary mt-0.5">
              <Icon name="file" size={16} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-ink">
                Trazabilidad de Puntuaciones
              </h3>
              <p className="text-sm text-ink-sub mt-0.5">
                Visualizá e indexá todos los textos resaltados dentro de las evoluciones clínicas de este paciente.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20 self-start sm:self-auto select-none">
            Total destacados: {highlights.length}
          </span>
        </div>

        {highlights.length > 0 && (
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar marcaciones por palabra clave o tipo de puntuación..."
              className="w-full bg-sand-light/40 border border-line hover:border-line-focus focus:border-primary focus:bg-surface focus:outline-none pl-9 pr-4 py-2.5 rounded-xl text-sm font-medium text-ink placeholder:text-ink-muted/50 transition-all"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none">
              <Icon name="search" size={14} />
            </div>
          </div>
        )}
      </div>

      {/* Listado de Marcaciones */}
      {filteredHighlights.length > 0 ? (
        <div className="space-y-3">
          {filteredHighlights.map((highlight, index) => {
            const puncLabel = getPunctuationLabel(highlight.color);
            return (
              <div
                key={`${highlight.sessionUuid}-${index}`}
                className="bg-surface border border-line rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 transition-shadow hover:shadow-sm"
                style={resolveHighlightStyle(highlight.color)}
              >
                <div className="flex-1 space-y-1.5">
                  <blockquote className="text-base font-medium text-ink italic leading-relaxed">
                    "{highlight.text}"
                  </blockquote>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-sub font-medium">
                    <span className="text-primary uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded-md font-semibold text-xs">
                      Puntuación: {puncLabel}
                    </span>
                    <span className="text-line">•</span>
                    <span>Sesión N° {highlight.sessionNumber}</span>
                    <span className="text-line">•</span>
                    <span>{highlight.sessionDate} hs</span>
                  </div>
                </div>

                <button
                  onClick={() => onJumpToSession(highlight.sessionUuid)}
                  className="bg-surface hover:bg-sand-light text-primary border border-line font-semibold text-sm px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-xs hover:shadow-sm self-end md:self-auto inline-flex items-center gap-1.5"
                  type="button"
                >
                  <Icon name="eye" size={13} /> Ver en sesión
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-surface border border-line rounded-3xl p-8 text-center space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-sand-light flex items-center justify-center mx-auto text-ink-muted">
            <Icon name="file" size={20} />
          </div>
          <h4 className="font-serif font-bold text-sm text-ink">
            {highlights.length === 0 
              ? "Sin marcaciones registradas" 
              : "No se encontraron marcaciones que coincidan con la búsqueda"}
          </h4>
          <p className="text-sm text-ink-sub max-w-sm mx-auto leading-relaxed">
            {highlights.length === 0 
              ? "Para destacar conceptos clave, objetivos o alertas, seleccioná texto en las evoluciones y aplicales un resaltador de color en la barra de herramientas del editor." 
              : "Probá con otra palabra clave o borrá el filtro de búsqueda."}
          </p>
        </div>
      )}
    </div>
  );
}
