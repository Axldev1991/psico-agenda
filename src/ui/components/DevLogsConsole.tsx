"use client";

import React, { useState, useEffect } from "react";
import { driveLogger, LogEntry } from "../../infrastructure/drive/drive-logger";
import { seedDemoData } from "../../infrastructure/db/seed";
import { Icon } from "./common/Icon";

export function DevLogsConsole() {
  const [logs, setLogs] = useState<LogEntry[]>(() => driveLogger.getLogs());
  const [isDevVisible, setIsDevVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [seedState, setSeedState] = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    // 1. Check if ?dev=1 or ?dev=true is in URL
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.has("dev")) {
        setIsDevVisible(true);
      }
    }

    // 2. Keyboard shortcut Ctrl + Alt + D
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        setIsDevVisible((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const unsubscribe = driveLogger.subscribe(() => {
      setLogs(driveLogger.getLogs());
    });
    return () => unsubscribe();
  }, []);

  if (!isDevVisible) return null;

  const handleCopyAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = logs
      .map(
        (l) =>
          `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.message}${
            l.details
              ? `\nDetalles: ${
                  typeof l.details === "string"
                    ? l.details
                    : JSON.stringify(l.details, null, 2)
                }`
              : ""
          }`
      )
      .join("\n");
    navigator.clipboard.writeText(text);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    driveLogger.clear();
  };

  const handleSeed = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setSeedState("loading");
    try {
      await seedDemoData();
      setSeedState("success");
      setTimeout(() => setSeedState("idle"), 2500);
    } catch (err) {
      console.error(err);
      setSeedState("error");
      setTimeout(() => setSeedState("idle"), 2500);
    }
  };

  return (
    <aside
      aria-label="Consola de desarrollo"
      className={`fixed bottom-0 right-0 z-50 transition-all duration-200 ${
        isExpanded ? "w-full md:w-150 h-96" : "w-64 h-10"
      } bg-[#182026] text-neutral-200 border-t border-l border-neutral-700 shadow-2xl rounded-tl-xl flex flex-col font-mono text-xs`}
    >
      {/* Console Top Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="h-10 px-3.5 flex items-center justify-between cursor-pointer border-b border-neutral-700/80 bg-[#12181D] rounded-tl-xl hover:bg-[#1A2228] transition-colors select-none"
      >
        <div className="flex items-center gap-2 text-neutral-300 font-semibold">
          <Icon name="terminal" size={15} />
          <span>Consola Dev ({logs.length})</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-neutral-400">
            {isExpanded ? "Minimizar" : "Expandir"}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsDevVisible(false);
            }}
            title="Cerrar consola (Ctrl+Alt+D para reabrir)"
            className="p-1 hover:text-white rounded hover:bg-neutral-800 transition-colors"
          >
            <Icon name="x" size={13} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Action Toolbar */}
          <div className="p-2 border-b border-neutral-800 flex items-center justify-between bg-[#151D23] gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopyAll}
                className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Icon name="download" size={12} />
                <span>Copiar</span>
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Icon name="x" size={12} />
                <span>Limpiar</span>
              </button>
            </div>

            {/* Seed Demo Action Button */}
            <button
              type="button"
              onClick={handleSeed}
              disabled={seedState === "loading"}
              className="px-2.5 py-1 bg-primary hover:bg-primary-hover text-surface rounded text-[11px] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Icon name="plus" size={12} />
              <span>
                {seedState === "loading"
                  ? "Sembrando..."
                  : seedState === "success"
                  ? "¡Sembrado!"
                  : seedState === "error"
                  ? "Error"
                  : "Cargar Demo"}
              </span>
            </button>
          </div>

          {/* Log Stream Output */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 select-text bg-[#0E1317]">
            {logs.length === 0 ? (
              <div className="text-neutral-500 italic p-2 text-center">
                Sin registros activos en esta sesión.
              </div>
            ) : (
              logs.map((log, idx) => {
                const colorMap: Record<LogEntry["type"], string> = {
                  info: "text-blue-400",
                  request: "text-amber-400",
                  response: "text-emerald-400",
                  error: "text-rose-400 font-semibold",
                };

                return (
                  <div
                    key={`${log.timestamp}-${idx}`}
                    className="border-b border-neutral-800/60 pb-1.5 leading-relaxed text-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-500">
                        {new Date(log.timestamp).toLocaleTimeString("es-AR")}
                      </span>
                      <span
                        className={`uppercase font-bold text-[9px] px-1 rounded ${
                          colorMap[log.type] || "text-neutral-300"
                        }`}
                      >
                        {log.type}
                      </span>
                      <span className="text-neutral-200">{log.message}</span>
                    </div>

                    {log.details && (
                      <pre className="mt-1 text-neutral-400 bg-black/40 p-1.5 rounded overflow-x-auto text-[10px]">
                        {typeof log.details === "string"
                          ? log.details
                          : JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
