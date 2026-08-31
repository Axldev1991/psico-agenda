import { useState } from "react";
import { Session } from "../../domain/session.types";
import { useSettings } from "../hooks/useSettings";
import { resolveMovementStyles } from "../utils/movement-styles";

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
  const { movementConfigs } = useSettings();
  const [localDescription, setLocalDescription] = useState(selectedSession.description || "");
  const [lastSessionUuid, setLastSessionUuid] = useState(selectedSession.uuid);

  if (selectedSession.uuid !== lastSessionUuid) {
    setLocalDescription(selectedSession.description || "");
    setLastSessionUuid(selectedSession.uuid);
  }

  const defaultConfigs = [
    { key: "indigo", color: "indigo", label: "Control" },
    { key: "rose", color: "rose", label: "Cognitivo" },
    { key: "emerald", color: "emerald", label: "Fisiológico" },
    { key: "amber", color: "amber", label: "Otro" }
  ];
  const configsToUse = movementConfigs.length > 0 ? movementConfigs : defaultConfigs;

  return (
    <div className="bg-bg-base/50 border-l-4 border-brand-indigo rounded-r-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm select-none">
      <div className="flex-1">
        <h4 className="font-title font-bold text-sm text-brand-indigo">
          📅 Sesión N° {selectedSessionNumber} — {selectedSessionDateFormatted} hs
        </h4>
        <div className="flex items-center gap-1 mt-1 text-xs">
          <span className="text-text-sub font-semibold">Tema:</span>
          <input
            type="text"
            value={localDescription}
            onChange={(e) => setLocalDescription(e.target.value)}
            onBlur={() => {
              if (localDescription !== (selectedSession.description || "")) {
                changeSessionDescription(selectedSession.uuid, localDescription);
              }
            }}
            placeholder="Escribí el tema de consulta..."
            className="bg-transparent border-b border-transparent hover:border-brand-sand/50 focus:border-brand-indigo focus:outline-none px-1 py-0.5 text-text-main font-semibold w-full max-w-[280px] sm:max-w-md transition-all rounded-sm"
          />
        </div>
      </div>

      {/* Selector de Etiquetas de Color */}
      <div className="flex items-center gap-1.5 self-start md:self-auto bg-white/70 border border-brand-sand/30 px-2.5 py-1 rounded-2xl">
        <span className="text-[9px] text-text-sub font-bold mr-1">Movimientos:</span>
        {configsToUse.map((config) => {
          const isSelected = (selectedSession.colorTag || "indigo") === config.key;
          const { baseStyle, activeStyle } = resolveMovementStyles(config.color);
          return (
            <button
              key={config.key}
              type="button"
              onClick={() => changeSessionColor(selectedSession.uuid, config.key)}
              style={isSelected ? activeStyle : baseStyle}
              className="text-[9px] font-bold px-2.5 py-0.5 rounded transition-all cursor-pointer border"
            >
              {config.label}
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
