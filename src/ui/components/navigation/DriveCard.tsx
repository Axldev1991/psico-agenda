"use client";

import React, { useState, useRef, useEffect } from "react";
import { Icon } from "../common/Icon";

interface DriveCardProps {
  isCollapsed?: boolean;
  googleToken: string | null;
  loading: boolean;
  syncStatus: string;
  lastSynced: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  onSync: () => void;
  onPreloadOffline: () => void;
  onDownloadLogs: () => void;
}

export function DriveCard({
  isCollapsed = false,
  googleToken,
  loading,
  syncStatus,
  lastSynced,
  onConnect,
  onDisconnect,
  onSync,
  onPreloadOffline,
  onDownloadLogs,
}: DriveCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close overflow menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  if (!googleToken) {
    if (isCollapsed) {
      return (
        <button
          onClick={onConnect}
          disabled={loading}
          title="Conectar Google Drive"
          className="w-10 h-10 rounded-lg border border-warn text-warn bg-warn-tint hover:bg-warn-tint/80 flex items-center justify-center transition-colors cursor-pointer"
        >
          <Icon name="cloud" size={18} />
        </button>
      );
    }

    return (
      <div className="bg-warn-tint border border-warn/30 rounded-xl p-2.5 text-sm space-y-1.5">
        <div className="flex items-start gap-2 text-warn">
          <Icon name="alert" size={16} className="shrink-0 mt-0.5 text-warn" />
          <div className="leading-tight">
            <span className="font-semibold block text-ink text-sm">Drive sin conectar</span>
            <span className="text-xs text-ink-sub">
              Sincronización pausada
            </span>
          </div>
        </div>
        <button
          onClick={onConnect}
          disabled={loading}
          className="w-full bg-white hover:bg-surface border border-line-control text-ink text-sm font-medium py-1 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
        >
          <Icon name="cloud" size={14} />
          <span>Conectar Drive</span>
        </button>
      </div>
    );
  }

  // Collapsed connected state
  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={onSync}
          disabled={loading}
          title="Sincronizar ahora"
          className="w-10 h-10 rounded-lg bg-surface hover:bg-primary-tint border border-line text-primary flex items-center justify-center transition-colors cursor-pointer relative shadow-xs"
        >
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-ok" />
          <Icon name="refresh" size={16} className={syncStatus === "syncing" ? "animate-spin" : ""} />
        </button>
      </div>
    );
  }

  // Standard connected state
  return (
    <div className="relative" ref={menuRef}>
      <div className="bg-surface border border-line rounded-xl p-3 space-y-2.5 shadow-xs">
        {/* Connection status header */}
        <div className="flex items-center gap-2.5">
          <span
            className={`w-2 h-2 shrink-0 rounded-full ${
              syncStatus === "syncing" ? "bg-warn animate-pulse" : "bg-ok"
            }`}
            aria-hidden="true"
          />
          <div className="flex flex-col leading-tight overflow-hidden">
            <span className="text-sm font-semibold text-ink">Drive conectado</span>
            <span className="text-sm text-ink-sub truncate">
              {syncStatus === "syncing"
                ? "Sincronizando..."
                : lastSynced
                ? `Sincronizado ${lastSynced}`
                : "Respaldo activo"}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onSync}
            disabled={loading}
            className="flex-1 bg-surface hover:bg-primary-tint border border-line-control hover:border-primary text-ink text-sm font-medium py-1.5 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Icon
              name="refresh"
              size={14}
              className={syncStatus === "syncing" ? "animate-spin" : ""}
            />
            <span>Sincronizar</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label="Más acciones de Drive"
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            className="h-8 w-8 rounded-lg border border-line-control hover:bg-primary-tint flex items-center justify-center text-ink-sub hover:text-ink transition-colors cursor-pointer"
          >
            <Icon name="more" size={16} />
          </button>
        </div>
      </div>

      {/* Overflow Menu */}
      {isMenuOpen && (
        <div
          role="menu"
          aria-label="Más acciones de Drive"
          className="absolute bottom-full left-0 mb-1.5 w-60 bg-surface border border-line rounded-xl p-1.5 shadow-lg z-50 animate-in fade-in duration-150 space-y-1"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsMenuOpen(false);
              onPreloadOffline();
            }}
            className="w-full text-left px-2.5 py-1.5 rounded-lg text-sm font-medium text-ink hover:bg-primary-tint flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Icon name="download" size={15} className="text-ink-sub" />
            <span>Descargar copia sin conexión</span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsMenuOpen(false);
              onDownloadLogs();
            }}
            className="w-full text-left px-2.5 py-1.5 rounded-lg text-sm font-medium text-ink hover:bg-primary-tint flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Icon name="list" size={15} className="text-ink-sub" />
            <span>Ver registros de sincronización</span>
          </button>

          <hr className="border-line my-1" />

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsMenuOpen(false);
              onDisconnect();
            }}
            className="w-full text-left px-2.5 py-1.5 rounded-lg text-sm font-medium text-err hover:bg-err-tint flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Icon name="logout" size={15} className="text-err" />
            <span>Desconectar Drive</span>
          </button>
        </div>
      )}
    </div>
  );
}
