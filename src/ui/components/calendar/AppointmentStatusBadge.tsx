"use client";

import React, { useState, useRef, useEffect } from "react";
import { Session } from "../../../domain/session.types";
import { Icon } from "../common/Icon";

interface AppointmentStatusBadgeProps {
  status: Session["status"];
  isSuspended?: boolean;
  onUpdateStatus: (newStatus: Session["status"]) => void | Promise<void>;
  disabled?: boolean;
}

const STATUS_OPTIONS: {
  status: Session["status"];
  label: string;
  icon: "check" | "alert" | "x";
  colorClass: string;
  bgClass: string;
}[] = [
  {
    status: "scheduled",
    label: "Agendado",
    icon: "check",
    colorClass: "text-primary",
    bgClass: "bg-primary-tint/40",
  },
  {
    status: "completed",
    label: "Atendido",
    icon: "check",
    colorClass: "text-ok",
    bgClass: "bg-ok-tint/40",
  },
  {
    status: "missed",
    label: "Ausente",
    icon: "alert",
    colorClass: "text-warn",
    bgClass: "bg-warn-tint/40",
  },
  {
    status: "cancelled",
    label: "Cancelado",
    icon: "x",
    colorClass: "text-ink-sub",
    bgClass: "bg-line/40",
  },
];

export function AppointmentStatusBadge({
  status,
  isSuspended = false,
  onUpdateStatus,
  disabled = false,
}: AppointmentStatusBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (newStatus: Session["status"]) => {
    if (newStatus !== status) {
      onUpdateStatus(newStatus);
    }
    setIsOpen(false);
  };

  // Badge visual config based on current status
  let badgeClass = "bg-primary-tint text-primary border-primary/30 hover:bg-primary-tint/80";
  let badgeIcon: "check" | "alert" | "x" = "check";
  let badgeLabel = "Agendado";

  if (isSuspended) {
    badgeClass = "bg-amber-500/15 text-amber-800 border-amber-300/60";
    badgeIcon = "alert";
    badgeLabel = "Suspendido por receso";
  } else if (status === "completed") {
    badgeClass = "bg-ok-tint text-ok border-ok/30 hover:bg-ok-tint/80";
    badgeIcon = "check";
    badgeLabel = "Atendido";
  } else if (status === "cancelled") {
    badgeClass = "bg-line/60 text-ink-sub border-line line-through hover:bg-line/80";
    badgeIcon = "x";
    badgeLabel = "Cancelado";
  } else if (status === "missed") {
    badgeClass = "bg-warn-tint text-warn border-warn/30 hover:bg-warn-tint/80";
    badgeIcon = "alert";
    badgeLabel = "Ausente";
  }

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        type="button"
        disabled={disabled || isSuspended}
        onClick={() => !disabled && !isSuspended && setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        title={
          isSuspended
            ? "Turno suspendido por receso/vacaciones"
            : `Estado: ${badgeLabel}. Hacé clic para cambiar.`
        }
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-2xs transition-all select-none ${badgeClass} ${
          isSuspended || disabled ? "cursor-default" : "cursor-pointer"
        }`}
      >
        <Icon name={badgeIcon} size={12} />
        <span>{badgeLabel}</span>
        {!isSuspended && (
          <Icon
            name={isOpen ? "chev-u" : "chev-d"}
            size={10}
            className="opacity-60 ml-0.5"
          />
        )}
      </button>

      {/* Hidden native select to preserve accessibility and Playwright test automation */}
      <select
        aria-label="Cambiar estado del turno"
        value={status}
        onChange={(e) => onUpdateStatus(e.target.value as Session["status"])}
        className="sr-only"
        tabIndex={-1}
      >
        <option value="scheduled">Agendado</option>
        <option value="completed">Atendido</option>
        <option value="cancelled">Cancelado</option>
        <option value="missed">Ausente</option>
      </select>

      {isOpen && (
        <div
          role="menu"
          aria-label="Opciones de estado del turno"
          className="absolute left-0 mt-1.5 w-44 bg-surface border border-line rounded-xl shadow-lg z-50 py-1.5 text-sm animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-3 py-1 text-[11px] font-semibold text-ink-sub uppercase tracking-wider border-b border-line/60">
            Estado del turno
          </div>

          <div className="py-1">
            {STATUS_OPTIONS.map((opt) => {
              const isCurrent = status === opt.status;
              return (
                <button
                  key={opt.status}
                  type="button"
                  role="menuitem"
                  onClick={() => handleSelect(opt.status)}
                  className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-bg-base transition-colors cursor-pointer ${
                    isCurrent
                      ? `${opt.colorClass} font-semibold ${opt.bgClass}`
                      : "text-ink"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon name={opt.icon} size={14} className={opt.colorClass} />
                    <span>{opt.label}</span>
                  </div>
                  {isCurrent && <span className="text-xs font-bold">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
