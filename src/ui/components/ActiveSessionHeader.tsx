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
    { key: "indigo", color: "#6366F1", label: "Control" },
    { key: "rose", color: "#F43F5E", label: "Cognitivo" },
    { key: "emerald", color: "#10B981", label: "Fisiológico" },
    { key: "amber", color: "#F59E0B", label: "Otro" }
  ];
  const configsToUse = movementConfigs.length > 0 ? movementConfigs : defaultConfigs;

  // Formatear fecha y hora de manera precisa y desglosada
  const dateObj = new Date(selectedSession.dateTime);
  const dayName = dateObj.toLocaleDateString("es-AR", { weekday: "long" });
  const dateFormatted = dateObj.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
  const timeFormatted = dateObj.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="bg-bg-card border border-brand-sand/65 border-l-4 border-l-brand-indigo rounded-3xl p-5 shadow-sm space-y-4 select-none animate-in fade-in duration-200">
      {/* Fila 1: sesion n°: N°, Día: Horario: */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-text-main font-semibold">
          <span className="font-title font-bold text-brand-indigo">Sesión N°:</span>
          <span className="text-text-main">{selectedSessionNumber}</span>
          <span className="text-brand-sand/60 mx-0.5">|</span>
          <span className="font-title font-bold text-brand-indigo">Día:</span>
          <span className="capitalize">{dayName}, {dateFormatted}</span>
          <span className="text-brand-sand/60 mx-0.5">|</span>
          <span className="font-title font-bold text-brand-indigo">Horario:</span>
          <span>{timeFormatted} hs</span>
        </div>

        <span className={`text-[9px] font-extrabold px-3 py-1 rounded-full border uppercase tracking-wider self-start sm:self-auto ${
          selectedSession.status === "completed"
            ? "bg-status-confirmed-light text-status-confirmed-dark border-status-confirmed-dark/20"
            : selectedSession.status === "cancelled"
            ? "bg-status-cancelled-light text-status-cancelled-dark border-status-cancelled-dark/20"
            : "bg-brand-sand/35 text-text-sub border-brand-sand/60"
        }`}>
          {selectedSession.status === "completed" ? "Atendido" : selectedSession.status === "cancelled" ? "Cancelado" : "Programado"}
        </span>
      </div>

      <div className="border-t border-brand-sand/30" />

      {/* Fila 2: Tema */}
      <div className="flex items-center gap-2.5 w-full">
        <span className="text-[10px] text-text-sub font-bold uppercase tracking-wider whitespace-nowrap min-w-[85px]">Tema:</span>
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
          className="w-full bg-bg-base/30 border border-brand-sand/40 hover:border-brand-sand/70 focus:border-brand-indigo focus:bg-white focus:outline-none px-3.5 py-1.5 text-xs font-semibold text-text-main rounded-xl transition-all"
        />
      </div>

      <div className="border-t border-brand-sand/30" />

      {/* Fila 3: Movimientos */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-2.5 w-full">
        <span className="text-[10px] text-text-sub font-bold uppercase tracking-wider whitespace-nowrap min-w-[85px] pt-1.5">Movimientos:</span>
        <div className="flex flex-wrap gap-1.5 pr-1 w-full">
          {configsToUse.map((config) => {
            const isSelected = (selectedSession.colorTag || "indigo") === config.key;
            const { baseStyle, activeStyle } = resolveMovementStyles(config.color);
            return (
              <button
                key={config.key}
                type="button"
                onClick={() => changeSessionColor(selectedSession.uuid, config.key)}
                style={isSelected ? activeStyle : baseStyle}
                className="text-[9px] font-bold px-3 py-1 rounded-xl transition-all cursor-pointer border select-none hover:scale-105 active:scale-95"
              >
                {config.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
