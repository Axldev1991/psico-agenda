"use client";

import React, { useState, useRef, useEffect } from "react";
import { AppNotification } from "../../../domain/notification.types";
import { Icon } from "../common/Icon";

interface NotificationBellProps {
  notifications: AppNotification[];
  unreadCount: number;
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
}

export function NotificationBell({
  notifications,
  unreadCount,
  onDismiss,
  onDismissAll,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on Escape or click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={
          unreadCount > 0
            ? `Notificaciones: ${unreadCount} no leídas`
            : "Notificaciones"
        }
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className="relative p-2 text-ink-sub hover:text-ink hover:bg-bg-base/80 rounded-xl transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        <Icon name="bell" size={19} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-4.5 h-4.5 px-1 bg-primary text-surface text-xs font-bold rounded-full shadow-xs pointer-events-none animate-in zoom-in-75 duration-150">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Panel de notificaciones"
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface border border-line rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* Header */}
          <div className="p-3.5 border-b border-line flex items-center justify-between bg-surface">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-ink text-sm">Avisos y Recordatorios</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary-tint text-primary">
                  {unreadCount}
                </span>
              )}
            </div>

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={onDismissAll}
                className="text-xs text-ink-sub hover:text-primary font-medium transition-colors cursor-pointer"
              >
                Descartar todas
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-line/60">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-ink-sub text-sm">
                No tenés avisos pendientes por el momento.
              </div>
            ) : (
              notifications.map((notif) => {
                const isUrgent = notif.severity === "urgent";
                const isWarning = notif.severity === "warning";

                return (
                  <div
                    key={notif.id}
                    className={`p-3.5 flex items-start gap-3 hover:bg-bg-base/40 transition-colors ${
                      isUrgent
                        ? "bg-rose-500/5 dark:bg-rose-950/20"
                        : isWarning
                        ? "bg-amber-500/5 dark:bg-amber-950/20"
                        : ""
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                        isUrgent
                          ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                          : isWarning
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          : "bg-primary-tint text-primary"
                      }`}
                    >
                      <Icon
                        name={isUrgent ? "alert" : isWarning ? "info" : "calendar"}
                        size={16}
                      />
                    </div>

                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-ink text-sm truncate">
                          {notif.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => onDismiss(notif.id)}
                          aria-label={`Descartar notificación: ${notif.title}`}
                          className="text-ink-sub hover:text-ink p-1 rounded-md hover:bg-bg-base cursor-pointer transition-colors shrink-0"
                          title="Descartar"
                        >
                          <Icon name="x" size={13} />
                        </button>
                      </div>

                      <p className="text-sm text-ink-sub leading-snug">
                        {notif.message}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
