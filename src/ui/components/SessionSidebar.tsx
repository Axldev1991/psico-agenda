"use client";

import React from "react";
import { Session } from "../../domain/session.types";
import { useSettings } from "../hooks/useSettings";
import { resolveClinicalTag } from "../utils/clinical-tags";

interface SessionSidebarProps {
  sortedSessions: Session[];
  allSessions: Session[];
  selectedSessionUuid: string | null;
  setSelectedSessionUuid: (uuid: string | null) => void;
  setActiveTab: (tab: "timeline" | "ceci") => void;
}

export function SessionSidebar({
  sortedSessions,
  allSessions,
  selectedSessionUuid,
  setSelectedSessionUuid,
  setActiveTab,
}: SessionSidebarProps) {
  const { movementConfigs } = useSettings();
  const defaultConfigs = [
    { key: "indigo", color: "#2D4C85", label: "Control" },
    { key: "rose", color: "#86315F", label: "Cognitivo" },
    { key: "emerald", color: "#2F6B4A", label: "Fisiológico" },
    { key: "amber", color: "#3D4C56", label: "Otro" },
  ];
  const configsToUse =
    movementConfigs.length > 0 ? movementConfigs : defaultConfigs;

  return (
    <nav
      aria-label="Índice de sesiones"
      className="lg:col-span-3 bg-surface border border-line rounded-2xl p-4 shadow-xs space-y-3 max-h-[75vh] overflow-y-auto"
    >
      <div>
        <h3 className="font-semibold text-sm text-ink">Índice de sesiones</h3>
        <p className="text-xs text-ink-sub mt-0.5">
          Elegí una sesión para desplazarte a sus notas
        </p>
      </div>

      {sortedSessions.length === 0 ? (
        <p className="text-xs text-ink-sub/70 italic py-4">
          No hay sesiones registradas.
        </p>
      ) : (
        <div className="space-y-1.5">
          {sortedSessions.map((session, index) => {
            const sessionDate = new Date(session.dateTime);
            const dateFormatted = sessionDate.toLocaleDateString("es-AR", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            });

            const absoluteIndex = allSessions.findIndex(
              (s) => s.uuid === session.uuid
            );
            const sessionNumber =
              absoluteIndex !== -1
                ? allSessions.length - absoluteIndex
                : sortedSessions.length - index;

            const config =
              configsToUse.find(
                (c) => c.key === (session.colorTag || "indigo")
              ) || configsToUse[0];
            const tag = resolveClinicalTag(config.color);

            const isSelected = selectedSessionUuid === session.uuid;
            const isCompleted = session.status === "completed";
            const isCancelled = session.status === "cancelled";

            return (
              <button
                key={session.uuid}
                type="button"
                onClick={() => {
                  setActiveTab("timeline");
                  setSelectedSessionUuid(session.uuid);
                }}
                className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer flex flex-col gap-1 border ${
                  isSelected
                    ? "bg-primary-tint/70 border-primary text-primary shadow-2xs font-semibold"
                    : "bg-surface hover:bg-bg-base/70 border-line/60 text-ink"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-sm font-semibold">
                    Sesión N° {sessionNumber}
                  </span>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase ${
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

                {session.description && (
                  <p className="text-xs text-ink-sub line-clamp-1">
                    {session.description}
                  </p>
                )}

                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-xs text-ink-sub font-mono">
                    {dateFormatted} hs
                  </span>
                  {session.colorTag && (
                    <span
                      className="text-[11px] font-medium px-2 py-0.5 rounded border"
                      style={{
                        backgroundColor: tag.bg,
                        color: tag.text,
                        borderColor: `${tag.text}33`,
                      }}
                    >
                      {config.label}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </nav>
  );
}
