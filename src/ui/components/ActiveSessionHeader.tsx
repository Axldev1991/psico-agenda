"use client";

import React, { useState, useRef, useEffect } from "react";
import { Session, PaymentStatus, PaymentMethod } from "../../domain/session.types";
import { useSettings } from "../hooks/useSettings";
import { resolveClinicalTag } from "../utils/clinical-tags";
import { Icon } from "./common/Icon";
import { AppointmentPaymentBadge } from "./calendar/AppointmentPaymentBadge";

interface ActiveSessionHeaderProps {
  selectedSession: Session;
  selectedSessionNumber: number | null;
  selectedSessionDateFormatted: string;
  changeSessionDescription: (uuid: string, description: string) => void;
  changeSessionColor: (uuid: string, color: string) => void;
  changeSessionPayment?: (uuid: string, status: PaymentStatus, method?: PaymentMethod) => void;
}

export function ActiveSessionHeader({
  selectedSession,
  selectedSessionNumber,
  changeSessionDescription,
  changeSessionColor,
  changeSessionPayment,
}: ActiveSessionHeaderProps) {
  const { movementConfigs, clinicalFeatures } = useSettings();
  const [localDescription, setLocalDescription] = useState(
    selectedSession.description || ""
  );
  const [lastSessionUuid, setLastSessionUuid] = useState(selectedSession.uuid);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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

  // Chequeo de desborde para el slider horizontal de movimientos
  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (el) {
      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
    }
  };

  useEffect(() => {
    checkScroll();
    const el = scrollContainerRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [configsToUse]);

  const handleScroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -180 : 180,
        behavior: "smooth",
      });
    }
  };

  // Formato limpio 24hs sin artefactos ni espacios en p. m.
  const dateObj = new Date(selectedSession.dateTime);
  const dayName = dateObj.toLocaleDateString("es-AR", { weekday: "long" });
  const dayCapitalized = dayName.charAt(0).toUpperCase() + dayName.slice(1);
  const dateFormatted = dateObj.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const hours = String(dateObj.getHours()).padStart(2, "0");
  const minutes = String(dateObj.getMinutes()).padStart(2, "0");
  const timeFormatted = `${hours}:${minutes}`;

  const isCompleted = selectedSession.status === "completed";
  const isCancelled = selectedSession.status === "cancelled";
  const isMissed = selectedSession.status === "missed";
  const isRescheduled = selectedSession.status === "rescheduled";

  const handleExportSession = () => {
    // Generate simple HTML for single session
    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"><title>Sesión ${selectedSessionNumber}</title></head>
      <body style="font-family: Calibri, sans-serif;">
        <h2>Sesión N° ${selectedSessionNumber}</h2>
        <p><strong>Fecha:</strong> ${dateFormatted} ${timeFormatted} hs</p>
        <p><strong>Estado:</strong> ${selectedSession.status}</p>
        <p><strong>Tema:</strong> ${selectedSession.description || "N/A"}</p>
        <div>${selectedSession.notes || ""}</div>
      </body>
      </html>
    `;
    const blob = new Blob(['\ufeff' + htmlContent], {
      type: 'application/msword;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    a.href = url;
    a.download = `sesion_${selectedSessionNumber}_${selectedSession.dateTime.split('T')[0]}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-surface border border-line border-l-4 border-l-primary rounded-2xl p-4 shadow-xs space-y-3 select-none">
      {/* Row 1: Session number, Day, Time, Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-sm text-ink min-w-0">
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="font-semibold text-primary">Sesión N°:</span>
            <span className="font-mono font-medium">{selectedSessionNumber}</span>
          </span>

          <span className="text-line-control select-none hidden sm:inline" aria-hidden="true">|</span>

          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="font-semibold text-ink">Día:</span>
            <span className="text-ink-sub">
              {dayCapitalized}, {dateFormatted}
            </span>
          </span>

          <span className="text-line-control select-none hidden sm:inline" aria-hidden="true">|</span>

          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="font-semibold text-ink">Horario:</span>
            <span className="font-mono font-medium text-ink-sub">{timeFormatted} hs</span>
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-nowrap self-start md:self-auto">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shadow-2xs whitespace-nowrap transition-all select-none ${
              isCompleted
                ? "bg-ok-tint text-ok border-ok/30"
                : isCancelled
                ? "bg-line/60 text-ink-sub border-line line-through"
                : isRescheduled
                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                : isMissed
                ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-300/40"
                : "bg-warn-tint text-warn border-warn/30"
            }`}
          >
            <Icon
              name={
                isCompleted
                  ? "check"
                  : isCancelled
                  ? "x"
                  : isRescheduled
                  ? "repeat"
                  : isMissed
                  ? "alert"
                  : "calendar"
              }
              size={12}
            />
            <span>
              {isCompleted
                ? "Atendido"
                : isCancelled
                ? "Cancelado"
                : isRescheduled
                ? "Reagendado"
                : isMissed
                ? "Ausente"
                : "Programado"}
            </span>
          </span>

          {changeSessionPayment && !isCancelled && !isRescheduled && (
            <AppointmentPaymentBadge
              paymentStatus={selectedSession.paymentStatus || "pending"}
              paymentMethod={selectedSession.paymentMethod}
              onUpdatePayment={(status, method) =>
                changeSessionPayment(selectedSession.uuid, status, method)
              }
            />
          )}
          
          <button
            type="button"
            onClick={handleExportSession}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-sm font-semibold rounded-full border border-line bg-surface hover:bg-bg-base text-ink-sub hover:text-ink transition-colors shadow-2xs cursor-pointer"
            title="Exportar sesión individual a Word (.doc)"
          >
            <Icon name="download" size={14} />
            <span className="hidden sm:inline">Exportar sesión</span>
          </button>
        </div>
      </div>

      <div className="border-t border-line/60" />

      {/* Row 2: Topic input */}
      <div className="flex items-center gap-2.5 w-full">
        <label
          htmlFor="session-topic-input"
          className="text-sm text-ink-sub font-semibold uppercase tracking-wider whitespace-nowrap min-w-22"
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
          className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-base text-ink placeholder:text-ink-sub/50 focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {clinicalFeatures.enableMovements && (
        <>
          <div className="border-t border-line/60" />

          {/* Row 3: Movement pills with sliding horizontal scroll */}
          <div className="flex items-center gap-2.5 w-full min-w-0">
            <span className="text-sm text-ink-sub font-semibold uppercase tracking-wider whitespace-nowrap min-w-22 shrink-0">
              Movimiento:
            </span>

            <div className="relative flex-1 min-w-0 flex items-center gap-1">
              {canScrollLeft && (
                <button
                  type="button"
                  onClick={() => handleScroll("left")}
                  className="p-1 rounded-lg bg-surface border border-line hover:bg-bg-base text-ink-sub hover:text-ink shadow-xs shrink-0 cursor-pointer transition-colors"
                  title="Ver movimientos anteriores"
                  aria-label="Ver movimientos anteriores"
                >
                  <Icon name="chev-l" size={14} />
                </button>
              )}

              <div
                ref={scrollContainerRef}
                className="flex items-center gap-1.5 overflow-x-auto py-1 px-0.5 scroll-smooth w-full"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {configsToUse.map((config) => {
                  const isSelected =
                    (selectedSession.colorTag || "indigo") === config.key;
                  const tag = resolveClinicalTag(config.color);
                  const dotColor = config.color?.startsWith("#")
                    ? config.color
                    : tag.text;

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
                        borderColor: isSelected ? tag.text : "var(--color-line)",
                      }}
                      className={`text-xs font-medium px-2.5 py-1 rounded-full transition-all cursor-pointer border select-none whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 ${
                        isSelected
                          ? "font-semibold shadow-2xs ring-2 ring-primary/25"
                          : "hover:bg-bg-base text-ink-sub hover:text-ink"
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs transition-transform"
                        style={{ backgroundColor: dotColor }}
                        aria-hidden="true"
                      />
                      <span>{config.label}</span>
                    </button>
                  );
                })}
              </div>

              {canScrollRight && (
                <button
                  type="button"
                  onClick={() => handleScroll("right")}
                  className="p-1 rounded-lg bg-surface border border-line hover:bg-bg-base text-ink-sub hover:text-ink shadow-xs shrink-0 cursor-pointer transition-colors"
                  title="Ver más movimientos"
                  aria-label="Ver más movimientos"
                >
                  <Icon name="chev-r" size={14} />
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
