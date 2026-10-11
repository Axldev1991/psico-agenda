"use client";

import React, { useState } from "react";
import { Session } from "../../domain/session.types";
import { useSettings } from "../hooks/useSettings";
import { resolveClinicalTag } from "../utils/clinical-tags";

interface ActiveSessionHeaderProps {
  selectedSession: Session;
  selectedSessionNumber: number | null;
  selectedSessionDateFormatted: string;
  changeSessionDescription: (uuid: string, description: string) => void;
  changeSessionColor: (uuid: string, color: string) => void;
}

export function ActiveSessionHeader({
  selectedSession,
  selectedSessionNumber,
  changeSessionDescription,
  changeSessionColor,
}: ActiveSessionHeaderProps) {
  const { movementConfigs } = useSettings();
  const [localDescription, setLocalDescription] = useState(
    selectedSession.description || ""
  );
  const [lastSessionUuid, setLastSessionUuid] = useState(selectedSession.uuid);

  if (selectedSession.uuid !== lastSessionUuid) {
    setLocalDescription(selectedSession.description || "");
    setLastSessionUuid(selectedSession.uuid);
  }

  const defaultConfigs = [
    { key: "indigo", color: "#2D4C85", label: "Control" },
    { key: "rose", color: "#86315F", label: "Cognitivo" },
    { key: "emerald", color: "#2F6B4A", label: "Fisiológico" },
    { key: "amber", color: "#3D4C56", label: "Otro" },
  ];
  const configsToUse =
    movementConfigs.length > 0 ? movementConfigs : defaultConfigs;

  const dateObj = new Date(selectedSession.dateTime);
  const dayName = dateObj.toLocaleDateString("es-AR", { weekday: "long" });
  const dateFormatted = dateObj.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeFormatted = dateObj.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const isCompleted = selectedSession.status === "completed";
  const isCancelled = selectedSession.status === "cancelled";

  return (
    <div className="bg-surface border border-line border-l-4 border-l-primary rounded-2xl p-4 shadow-xs space-y-3 select-none">
      {/* Row 1: Session number, Day, Time, Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink">
          <span className="font-semibold text-primary">Sesión N°:</span>
          <span className="font-mono font-medium">{selectedSessionNumber}</span>
          <span className="text-line-control">|</span>
          <span className="font-semibold text-ink">Día:</span>
          <span className="capitalize text-ink-sub">
            {dayName}, {dateFormatted}
          </span>
          <span className="text-line-control">|</span>
          <span className="font-semibold text-ink">Horario:</span>
          <span className="font-mono text-ink-sub">{timeFormatted} hs</span>
        </div>

        <span
          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider self-start sm:self-auto ${
            isCompleted
              ? "bg-ok-tint text-ok"
              : isCancelled
              ? "bg-line/60 text-ink-sub line-through"
              : "bg-warn-tint text-warn"
          }`}
        >
          {isCompleted
            ? "Atendido"
            : isCancelled
            ? "Cancelado"
            : "Programado"}
        </span>
      </div>

      <div className="border-t border-line/60" />

      {/* Row 2: Topic input */}
      <div className="flex items-center gap-2.5 w-full">
        <label
          htmlFor="session-topic-input"
          className="text-xs text-ink-sub font-semibold uppercase tracking-wider whitespace-nowrap min-w-18.75"
        >
          Tema:
        </label>
        <input
          id="session-topic-input"
          type="text"
          value={localDescription}
          onChange={(e) => setLocalDescription(e.target.value)}
          onBlur={() => {
            if (localDescription !== (selectedSession.description || "")) {
              changeSessionDescription(selectedSession.uuid, localDescription);
            }
          }}
          placeholder="Escribí el tema o motivo de consulta..."
          className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-sm text-ink placeholder:text-ink-sub/50 focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      <div className="border-t border-line/60" />

      {/* Row 3: Movement pills */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-2.5 w-full">
        <span className="text-xs text-ink-sub font-semibold uppercase tracking-wider whitespace-nowrap min-w-18.75 pt-1">
          Movimiento:
        </span>
        <div className="flex flex-wrap gap-1.5 w-full">
          {configsToUse.map((config) => {
            const isSelected =
              (selectedSession.colorTag || "indigo") === config.key;
            const tag = resolveClinicalTag(config.color);

            return (
              <button
                key={config.key}
                type="button"
                onClick={() =>
                  changeSessionColor(selectedSession.uuid, config.key)
                }
                style={{
                  backgroundColor: isSelected ? tag.bg : "transparent",
                  color: tag.text,
                  borderColor: isSelected ? tag.text : "var(--line)",
                }}
                className={`text-xs font-medium px-2.5 py-1 rounded-full transition-all cursor-pointer border select-none ${
                  isSelected ? "font-semibold shadow-2xs ring-1 ring-primary/20" : "hover:bg-bg-base text-ink-sub"
                }`}
              >
                {config.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
