import { useState } from "react";
import { Session } from "../../domain/session.types";

interface ActiveSessionHeaderProps {
  selectedSession: Session;
  selectedSessionNumber: number | null;
  selectedSessionDateFormatted: string;
  changeSessionDescription: (uuid: string, description: string) => void;
  changeSessionColor: (uuid: string, color: string) => void;
}

export function ActiveSessionHeader({
  selectedSession,
  selectedSessionNumber,
  selectedSessionDateFormatted,
  changeSessionDescription,
  changeSessionColor,
}: ActiveSessionHeaderProps) {
  const [localDescription, setLocalDescription] = useState(selectedSession.description || "");
  const [lastSessionUuid, setLastSessionUuid] = useState(selectedSession.uuid);

  if (selectedSession.uuid !== lastSessionUuid) {
    setLocalDescription(selectedSession.description || "");
    setLastSessionUuid(selectedSession.uuid);
  }
  return (
    <div className="bg-bg-base/50 border-l-4 border-brand-indigo rounded-r-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm select-none">
      <div className="flex-1">
        <h4 className="font-title font-bold text-sm text-brand-indigo">
          📅 Sesión N° {selectedSessionNumber} — {selectedSessionDateFormatted} hs
        </h4>
        <div className="flex items-center gap-1 mt-1 text-xs">
          <span className="text-text-sub font-semibold">Motivo:</span>
          <input
            type="text"
            value={localDescription}
            onChange={(e) => setLocalDescription(e.target.value)}
            onBlur={() => {
              if (localDescription !== (selectedSession.description || "")) {
                changeSessionDescription(selectedSession.uuid, localDescription);
              }
            }}
            placeholder="Escribí el motivo de consulta..."
            className="bg-transparent border-b border-transparent hover:border-brand-sand/50 focus:border-brand-indigo focus:outline-none px-1 py-0.5 text-text-main font-semibold w-full max-w-[280px] sm:max-w-md transition-all rounded-sm"
          />
        </div>
      </div>

      {/* Selector de Etiquetas de Color */}
      <div className="flex items-center gap-1.5 self-start md:self-auto bg-white/70 border border-brand-sand/30 px-2.5 py-1 rounded-2xl">
        <span className="text-[9px] text-text-sub font-bold mr-1">Categoría:</span>
        {["indigo", "rose", "emerald", "amber"].map((color) => {
          const colorLabels: Record<string, string> = {
            indigo: "Control",
            rose: "Cognitivo",
            emerald: "Fisiológico",
            amber: "Otro",
          };
          const colorStyles: Record<string, string> = {
            indigo: "bg-brand-indigo/10 text-brand-indigo border-brand-indigo/25 hover:bg-brand-indigo/20",
            rose: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100",
            emerald: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
            amber: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
          };
          const activeStyles: Record<string, string> = {
            indigo: "ring-1.5 ring-brand-indigo bg-brand-indigo/25 text-brand-indigo font-black border-brand-indigo/55",
            rose: "ring-1.5 ring-rose-500 bg-rose-100 text-rose-800 font-black border-rose-300",
            emerald: "ring-1.5 ring-emerald-500 bg-emerald-100 text-emerald-800 font-black border-emerald-300",
            amber: "ring-1.5 ring-amber-500 bg-amber-100 text-amber-800 font-black border-amber-300",
          };
          const isSelected = (selectedSession.colorTag || "indigo") === color;
          return (
            <button
              key={color}
              type="button"
              onClick={() => changeSessionColor(selectedSession.uuid, color)}
              className={`text-[9px] font-bold px-2 py-0.5 rounded transition-all cursor-pointer border ${
                isSelected ? activeStyles[color] : colorStyles[color]
              }`}
            >
              {colorLabels[color]}
            </button>
          );
        })}
      </div>

      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border self-start md:self-auto uppercase tracking-wider ${
        selectedSession.status === "completed"
          ? "bg-status-confirmed-light text-status-confirmed-dark border-status-confirmed-dark/20"
          : selectedSession.status === "cancelled"
          ? "bg-status-cancelled-light text-status-cancelled-dark border-status-cancelled-dark/20"
          : "bg-brand-sand/30 text-text-sub border-brand-sand/55"
      }`}>
        {selectedSession.status === "completed" ? "Atendido" : selectedSession.status === "cancelled" ? "Cancelado" : "Programado"}
      </span>
    </div>
  );
}
