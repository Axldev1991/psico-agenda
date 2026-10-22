"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MonthlyBillingSummary } from "../../../domain/billing.service";
import { Icon } from "../common/Icon";

interface MonthlyBillingBadgeProps {
  summary: MonthlyBillingSummary;
  targetMonth: Date;
}

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function MonthlyBillingBadge({ summary, targetMonth }: MonthlyBillingBadgeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-surface border border-line rounded-xl p-4 shadow-xs mt-4">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left cursor-pointer focus:outline-none"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2">
          <Icon name="file" size={16} className="text-primary" />
          <span className="text-base font-semibold text-ink">
            Facturación: {format(targetMonth, "MMMM", { locale: es })}
          </span>
        </div>
        <Icon
          name={isExpanded ? "chev-u" : "chev-d"}
          size={16}
          className="text-ink-sub"
        />
      </button>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-line space-y-3 text-base">
          <div className="flex justify-between items-center">
            <span className="text-ink-sub">Proyectado</span>
            <span className="font-mono text-ink font-medium">
              {currencyFormatter.format(summary.projectedTotal)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-ink-sub">Cobrado (Completados)</span>
            <span className="font-mono text-primary font-medium">
              {currencyFormatter.format(summary.collectedTotal)}
            </span>
          </div>
          {summary.unrealizedTotal > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-ink-sub">No realizado (Cancel/Ausente)</span>
              <span className="font-mono text-amber-600 font-medium">
                {currencyFormatter.format(summary.unrealizedTotal)}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2 mt-2 border-t border-line/50">
             <span className="text-ink-sub">Sesiones contabilizadas</span>
             <span className="font-medium text-ink">{summary.sessionCount}</span>
          </div>
        </div>
      )}
    </div>
  );
}
