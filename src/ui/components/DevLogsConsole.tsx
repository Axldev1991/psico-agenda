"use client";

import React, { useState, useEffect } from "react";
import { driveLogger, LogEntry } from "../../infrastructure/drive/drive-logger";

export function DevLogsConsole() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);

  useEffect(() => {
    setLogs(driveLogger.getLogs());
    const unsubscribe = driveLogger.subscribe(() => {
      setLogs(driveLogger.getLogs());
    });
    return () => unsubscribe();
  }, []);

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

  return (
    <div
      className={`fixed bottom-0 right-0 z-50 transition-all duration-300 ${
        isConsoleOpen ? "w-full md:w-[600px] h-96" : "w-48 h-10"
      } bg-[#1E1E1E] text-white border-t border-l border-brand-sand shadow-2xl rounded-tl-xl flex flex-col font-mono text-[11px]`}
    >
      <div
        onClick={() => setIsConsoleOpen(!isConsoleOpen)}
        className="h-10 px-4 flex items-center justify-between cursor-pointer border-b border-neutral-700 bg-neutral-900 rounded-tl-xl hover:bg-neutral-800 transition-colors select-none"
      >
        <span className="font-bold flex items-center gap-2">
          ⚙️ Consola Dev ({logs.length} logs)
        </span>
        <span className="text-[10px] text-text-sub font-bold">
          {isConsoleOpen ? "▼ Minimizar" : "▲ Expandir"}
        </span>
      </div>

      {isConsoleOpen && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex justify-between items-center bg-neutral-950 px-3 py-1.5 border-b border-neutral-800">
            <span className="text-[9px] text-neutral-400 font-bold">
              LOGS DE GOOGLE DRIVE API
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleCopyAll}
                className="bg-brand-indigo/20 hover:bg-brand-indigo/40 text-brand-indigo border border-brand-indigo/30 px-2 py-0.5 rounded text-[10px] cursor-pointer font-bold transition-colors"
                title="Copiar todos los logs al portapapeles"
              >
                📋 Copiar Todo
              </button>
              <button
                onClick={handleClear}
                className="bg-status-cancelled-light hover:bg-status-cancelled-light/80 text-status-cancelled-dark border border-status-cancelled-dark/30 px-2 py-0.5 rounded text-[10px] cursor-pointer font-bold transition-colors"
              >
                🗑️ Limpiar
              </button>
            </div>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-[#121212]">
            {logs.length === 0 ? (
              <div className="text-neutral-500 text-center py-8">
                No hay logs registrados en esta sesión.
              </div>
            ) : (
              logs.map((log, index) => {
                let colorClass = "text-neutral-300";
                if (log.type === "request") colorClass = "text-yellow-200";
                else if (log.type === "response") colorClass = "text-green-300";
                else if (log.type === "error") colorClass = "text-red-400 font-bold";

                return (
                  <div key={index} className="border-b border-neutral-900 pb-1.5 last:border-0">
                    <div className="flex items-start gap-2">
                      <span className="text-neutral-600 shrink-0 select-none">
                        [{log.timestamp}]
                      </span>
                      <span
                        className={`shrink-0 select-none px-1 rounded text-[9px] uppercase font-bold ${
                          log.type === "request"
                            ? "bg-yellow-950/40 text-yellow-300 border border-yellow-800/30"
                            : log.type === "response"
                            ? "bg-green-950/40 text-green-300 border border-green-800/30"
                            : log.type === "error"
                            ? "bg-red-950/40 text-red-300 border border-red-800/30"
                            : "bg-neutral-800 text-neutral-300"
                        }`}
                      >
                        {log.type}
                      </span>
                      <span className={`break-all ${colorClass}`}>{log.message}</span>
                    </div>
                    {log.details && (
                      <pre className="mt-1 ml-16 p-1.5 bg-neutral-950 rounded text-[9px] text-neutral-400 overflow-x-auto max-w-full whitespace-pre-wrap">
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
    </div>
  );
}
