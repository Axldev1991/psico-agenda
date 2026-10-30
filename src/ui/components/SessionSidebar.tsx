"use client";

import React from "react";
import { Session } from "../../domain/session.types";
import { useSettings } from "../hooks/useSettings";
import { resolveClinicalTag } from "../utils/clinical-tags";
import { Icon } from "./common/Icon";

interface SessionSidebarProps {
  sortedSessions: Session[];
  allSessions: Session[];
  selectedSessionUuid: string | null;
  setSelectedSessionUuid: (uuid: string | null) => void;
  setActiveTab: (tab: "timeline" | "notes") => void;
  onCreateSession?: () => void;
}

export function SessionSidebar({
  sortedSessions,
  allSessions,
  selectedSessionUuid,
  setSelectedSessionUuid,
  setActiveTab,
  onCreateSession,
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-base text-ink">Índice de sesiones</h3>
          <p className="text-sm text-ink-sub mt-0.5">
            Elegí una sesión para desplazarte a sus notas
          </p>
        </div>
        {onCreateSession && (
          <button
            type="button"
            onClick={onCreateSession}
            title="Iniciar nueva sesión clínica"
            className="p-1.5 rounded-lg border border-line hover:border-primary/40 hover:bg-primary-tint text-ink-sub hover:text-primary transition-colors cursor-pointer"
          >
            <Icon name="plus" size={16} />
          </button>
        )}
      </div>

      {sortedSessions.length === 0 ? (
        <div className="py-4 space-y-2">
          <p className="text-sm text-ink-sub/70 italic">
            No hay sesiones registradas.
          </p>
          {onCreateSession && (
            <button
              type="button"
              onClick={onCreateSession}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-primary-tint text-primary text-sm font-semibold hover:bg-primary/20 transition-colors cursor-pointer"
            >
              <Icon name="plus" size={14} />
              <span>Nueva sesión</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          {sortedSessions.map((session, index) => {
            const sessionDate = new Date(session.dateTime);
            const day = String(sessionDate.getDate()).padStart(2, "0");
            const month = String(sessionDate.getMonth() + 1).padStart(2, "0");
            const hours = String(sessionDate.getHours()).padStart(2, "0");
            const minutes = String(sessionDate.getMinutes()).padStart(2, "0");
            const dateFormatted = `${day}/${month}, ${hours}:${minutes}`;

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
            const isMissed = session.status === "missed";

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
                  <span className="text-base font-semibold">
                    Sesión N° {sessionNumber}
                  </span>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                      isCompleted
                        ? "bg-ok-tint text-ok"
                        : isCancelled
                        ? "bg-line/60 text-ink-sub line-through"
                        : isMissed
                        ? "bg-rose-500/15 text-rose-600"
                        : "bg-warn-tint text-warn"
                    }`}
                  >
                    {isCompleted
                      ? "Atendido"
                      : isCancelled
                      ? "Cancelado"
                      : isMissed
                      ? "Ausente"
                      : "Programado"}
                  </span>
                </div>

                {session.description && (
                  <p className="text-sm text-ink-sub line-clamp-1">
                    {session.description}
                  </p>
                )}

                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-sm text-ink-sub font-mono">
                    {dateFormatted} hs
                  </span>
                  {session.colorTag && (
                    <span
                      className="text-[11px] font-medium px-2 py-0.5 rounded border inline-flex items-center gap-1.5"
                      style={{
                        backgroundColor: tag.bg,
                        color: tag.text,
                        borderColor: `${tag.text}33`,
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: config.color?.startsWith("#") ? config.color : tag.text }}
                        aria-hidden="true"
                      />
                      <span>{config.label}</span>
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
