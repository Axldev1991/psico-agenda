"use client";

import React, { useEffect, useRef } from "react";
import { Icon, IconName } from "./Icon";

export type ConfirmVariant = "danger" | "warning" | "primary";

export interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationModal({
  isOpen,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "primary",
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Focus cancel button for safe keyboard navigation
    const timer = setTimeout(() => {
      cancelBtnRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  let iconName: IconName = "info";
  let iconBgClass = "bg-primary-tint text-primary";
  let confirmBtnClass = "bg-primary hover:bg-primary-hover text-surface shadow-xs";

  if (variant === "danger") {
    iconName = "alert";
    iconBgClass = "bg-err-tint text-err";
    confirmBtnClass = "bg-err hover:bg-err/90 text-white shadow-xs";
  } else if (variant === "warning") {
    iconName = "alert";
    iconBgClass = "bg-amber-500/15 text-amber-700";
    confirmBtnClass = "bg-amber-600 hover:bg-amber-700 text-white shadow-xs";
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby={description ? "confirm-modal-desc" : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="w-full max-w-md bg-surface border border-line rounded-2xl shadow-xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl shrink-0 ${iconBgClass}`}>
              <Icon name={iconName} size={22} />
            </div>

            <div className="space-y-1.5 min-w-0 flex-1 pt-0.5">
              <h2
                id="confirm-modal-title"
                className="font-serif font-semibold text-lg text-ink leading-snug"
              >
                {title}
              </h2>
              {description && (
                <p
                  id="confirm-modal-desc"
                  className="text-sm text-ink-sub leading-relaxed"
                >
                  {description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-line/60">
            <button
              ref={cancelBtnRef}
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-semibold text-ink bg-surface hover:bg-bg-base border border-line rounded-xl transition-colors cursor-pointer"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer ${confirmBtnClass}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
