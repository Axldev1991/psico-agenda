import React from "react";

interface BrandLogoProps {
  isCollapsed?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function BrandLogo({
  isCollapsed = false,
  size = "md",
  className = "",
}: BrandLogoProps) {
  const markDimensions =
    size === "lg" ? "h-12 w-12 text-xl" : size === "sm" ? "h-8 w-8 text-sm" : "h-10 w-10 text-base";

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <div
        className={`${markDimensions} shrink-0 rounded-lg bg-primary flex items-center justify-center font-bold text-white shadow-xs font-serif`}
        aria-hidden="true"
      >
        Ψ
      </div>
      {!isCollapsed && (
        <div className="flex flex-col leading-tight whitespace-nowrap overflow-hidden min-w-0">
          <span className="font-serif font-semibold text-ink text-base tracking-tight truncate">
            Psico-Agenda
          </span>
          <span className="font-sans text-xs text-ink-sub truncate">
            Gestión clínica
          </span>
        </div>
      )}
    </div>
  );
}
