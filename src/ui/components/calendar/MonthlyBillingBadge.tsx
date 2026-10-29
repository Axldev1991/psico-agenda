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
            <span className="text-ink-sub">Cobrado</span>
            <span className="font-mono text-ok font-semibold">
              {currencyFormatter.format(summary.collectedTotal)}
            </span>
          </div>
          {summary.pendingTotal > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-ink-sub">Pendiente de cobro</span>
              <span className="font-mono text-warn font-semibold">
                {currencyFormatter.format(summary.pendingTotal)}
              </span>
            </div>
          )}
          {summary.byMethod && summary.collectedTotal > 0 && (
            <div className="bg-bg-base/60 rounded-lg p-2.5 space-y-1.5 text-xs border border-line/60">
              <span className="font-semibold text-ink-sub block mb-1 uppercase tracking-wider">
                Desglose por método
              </span>
              {summary.byMethod.cash > 0 && (
                <div className="flex justify-between text-ink">
                  <span>💵 Efectivo</span>
                  <span className="font-mono font-medium">{currencyFormatter.format(summary.byMethod.cash)}</span>
                </div>
              )}
              {summary.byMethod.transfer > 0 && (
                <div className="flex justify-between text-ink">
                  <span>🏦 Transferencia</span>
                  <span className="font-mono font-medium">{currencyFormatter.format(summary.byMethod.transfer)}</span>
                </div>
              )}
              {summary.byMethod.mercadopago > 0 && (
                <div className="flex justify-between text-ink">
                  <span>📱 Mercado Pago</span>
                  <span className="font-mono font-medium">{currencyFormatter.format(summary.byMethod.mercadopago)}</span>
                </div>
              )}
            </div>
          )}
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
