"use client";

import React from "react";
import { Icon } from "../common/Icon";

interface PrivacyToggleButtonProps {
  isBlurred: boolean;
  onToggle: () => void;
  isCollapsed?: boolean;
  className?: string;
}

export function PrivacyToggleButton({
  isBlurred,
  onToggle,
  isCollapsed = false,
  className = "",
}: PrivacyToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isBlurred}
      title={isBlurred ? "Datos difuminados (clic para revelar)" : "Ocultar datos de pacientes"}
      className={`rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 font-sans text-sm font-semibold ${
        isBlurred
          ? "bg-primary-tint text-primary border border-primary/40 shadow-xs"
          : "bg-surface hover:bg-bg-base text-ink border border-line-control"
      } ${
        isCollapsed
          ? "w-10 h-10 p-0"
          : "w-full py-2 px-3"
      } ${className}`}
    >
      <Icon name={isBlurred ? "eye-off" : "eye"} size={16} />
      {!isCollapsed && <span>Ocultar datos</span>}
    </button>
  );
}
