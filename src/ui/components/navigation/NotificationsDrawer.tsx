"use client";

import React, { useEffect } from "react";
import { AppNotification } from "../../../domain/notification.types";
import { Icon } from "../common/Icon";

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  unreadCount: number;
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
  isSidebarCollapsed: boolean;
}

export function NotificationsDrawer({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  onDismiss,
  onDismissAll,
  isSidebarCollapsed,
}: NotificationsDrawerProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/25 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <aside
        role="dialog"
        aria-label="Panel de avisos y recordatorios"
        aria-modal="true"
        className={`fixed inset-y-0 z-50 w-80 sm:w-96 bg-surface border-r border-line shadow-2xl flex flex-col transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? "left-0 md:left-20" : "left-0 md:left-64"
        } animate-in slide-in-from-left duration-200`}
      >
        {/* Header */}
        <div className="p-4 border-b border-line flex items-center justify-between bg-surface shrink-0 h-16">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-ink text-base">Avisos y Alertas</span>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary-tint text-primary font-mono">
                {unreadCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={onDismissAll}
                className="text-xs text-ink-sub hover:text-primary font-medium transition-colors cursor-pointer px-2 py-1 rounded-md hover:bg-bg-base"
              >
                Descartar todas
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-ink-sub hover:text-ink hover:bg-bg-base transition-colors cursor-pointer"
              title="Cerrar panel (Esc)"
            >
              <Icon name="x" size={16} />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto divide-y divide-line/60 p-2 space-y-1">
          {notifications.length === 0 ? (
            <div className="py-16 text-center text-ink-sub text-base space-y-1">
              <p className="font-semibold text-ink">Sin avisos pendientes</p>
              <p className="text-sm text-ink-muted">No tenés sesiones inminentes ni alertas de receso en este momento.</p>
            </div>
          ) : (
            notifications.map((notif) => {
              const isUrgent = notif.severity === "urgent";
              const isWarning = notif.severity === "warning";

              return (
                <div
                  key={notif.id}
                  className={`p-3.5 rounded-xl flex items-start gap-3 transition-colors ${
                    isUrgent
                      ? "bg-rose-500/5 dark:bg-rose-950/20 border border-rose-200/50"
                      : isWarning
                      ? "bg-amber-500/5 dark:bg-amber-950/20 border border-amber-200/50"
                      : "bg-surface hover:bg-bg-base/40 border border-transparent"
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

                  <div className="flex-1 min-w-0 space-y-1">
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
      </aside>
    </div>
  );
}
