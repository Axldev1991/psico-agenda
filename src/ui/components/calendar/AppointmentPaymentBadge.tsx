"use client";

import React, { useState, useRef, useEffect } from "react";
import { PaymentStatus, PaymentMethod } from "../../../domain/session.types";
import { Icon } from "../common/Icon";

interface AppointmentPaymentBadgeProps {
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  onUpdatePayment: (status: PaymentStatus, method?: PaymentMethod) => void | Promise<void>;
  disabled?: boolean;
}

export function AppointmentPaymentBadge({
  paymentStatus = "pending",
  paymentMethod,
  onUpdatePayment,
  disabled = false,
}: AppointmentPaymentBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isPaid = paymentStatus === "paid";

  // Cerrar al hacer clic afuera
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

  const handleSelect = (status: PaymentStatus, method?: PaymentMethod) => {
    onUpdatePayment(status, method);
    setIsOpen(false);
  };

  const getMethodLabel = (method?: PaymentMethod): string => {
    switch (method) {
      case "cash":
        return "Efectivo";
      case "transfer":
        return "Transferencia";
      case "mercadopago":
        return "Mercado Pago";
      default:
        return "";
    }
  };

  const badgeLabel = isPaid
    ? `Cobrado${paymentMethod ? ` · ${getMethodLabel(paymentMethod)}` : ""}`
    : "Sin cobrar";

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        title={
          isPaid
            ? `Sesión cobrada (${getMethodLabel(paymentMethod)}). Hacé clic para cambiar.`
            : "Sesión pendiente de cobro. Hacé clic para marcar como cobrada."
        }
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-2xs select-none ${
          isPaid
            ? "bg-ok-tint text-ok border-ok/30 hover:bg-ok-tint/80"
            : "bg-warn-tint text-warn border-warn/30 hover:bg-warn-tint/80"
        } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        <span className="font-bold text-[11px]">{isPaid ? "✓" : "$"}</span>
        <span>{badgeLabel}</span>
        <Icon
          name={isOpen ? "chev-u" : "chev-d"}
          size={11}
          className="opacity-60 ml-0.5"
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Opciones de cobro"
          className="absolute right-0 sm:left-0 sm:right-auto mt-1.5 w-52 bg-surface border border-line rounded-xl shadow-lg z-50 py-1.5 text-sm animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-3 py-1 text-[11px] font-semibold text-ink-sub uppercase tracking-wider border-b border-line/60">
            Estado de Cobro
          </div>

          {/* Opción Pendiente */}
          <button
            type="button"
            role="menuitem"
            onClick={() => handleSelect("pending")}
            className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-bg-base transition-colors cursor-pointer ${
              !isPaid ? "text-warn font-semibold bg-warn-tint/30" : "text-ink"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-warn font-bold">$</span>
              <span>Pendiente de cobro</span>
            </div>
            {!isPaid && <span className="text-warn text-xs">✓</span>}
          </button>

          <div className="border-t border-line/60 my-1" />
          <div className="px-3 py-1 text-[11px] font-semibold text-ink-sub uppercase tracking-wider">
            Marcar como Cobrado
          </div>

          {/* Opción Efectivo */}
          <button
            type="button"
            role="menuitem"
            onClick={() => handleSelect("paid", "cash")}
            className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-bg-base transition-colors cursor-pointer ${
              isPaid && paymentMethod === "cash"
                ? "text-ok font-semibold bg-ok-tint/30"
                : "text-ink"
            }`}
          >
            <div className="flex items-center gap-2">
              <span>💵</span>
              <span>Efectivo</span>
            </div>
            {isPaid && paymentMethod === "cash" && (
              <span className="text-ok text-xs">✓</span>
            )}
          </button>

          {/* Opción Transferencia */}
          <button
            type="button"
            role="menuitem"
            onClick={() => handleSelect("paid", "transfer")}
            className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-bg-base transition-colors cursor-pointer ${
              isPaid && paymentMethod === "transfer"
                ? "text-ok font-semibold bg-ok-tint/30"
                : "text-ink"
            }`}
          >
            <div className="flex items-center gap-2">
              <span>🏦</span>
              <span>Transferencia</span>
            </div>
            {isPaid && paymentMethod === "transfer" && (
              <span className="text-ok text-xs">✓</span>
            )}
          </button>

          {/* Opción Mercado Pago */}
          <button
            type="button"
            role="menuitem"
            onClick={() => handleSelect("paid", "mercadopago")}
            className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-bg-base transition-colors cursor-pointer ${
              isPaid && paymentMethod === "mercadopago"
                ? "text-ok font-semibold bg-ok-tint/30"
                : "text-ink"
            }`}
          >
            <div className="flex items-center gap-2">
              <span>📱</span>
              <span>Mercado Pago</span>
            </div>
            {isPaid && paymentMethod === "mercadopago" && (
              <span className="text-ok text-xs">✓</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
