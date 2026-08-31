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

  return (
    <div className="bg-bg-card border border-brand-sand/60 border-l-4 border-l-brand-indigo rounded-3xl p-5 shadow-sm space-y-4 select-none animate-in fade-in duration-200">
      {/* Fila 1: Título e Info de Sesión + Estado */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xl">📅</span>
          <div>
            <h4 className="font-title font-black text-sm md:text-base text-text-main leading-tight">
              Sesión N° {selectedSessionNumber}
            </h4>
            <p className="text-[9px] md:text-[10px] text-text-sub font-bold mt-0.5 uppercase tracking-wide">
              {selectedSessionDateFormatted} hs
            </p>
          </div>
        </div>

        <span className={`text-[9px] font-extrabold px-3 py-1 rounded-full border uppercase tracking-wider ${
          selectedSession.status === "completed"
            ? "bg-status-confirmed-light text-status-confirmed-dark border-status-confirmed-dark/20"
            : selectedSession.status === "cancelled"
            ? "bg-status-cancelled-light text-status-cancelled-dark border-status-cancelled-dark/20"
            : "bg-brand-sand/35 text-text-sub border-brand-sand/60"
        }`}>
          {selectedSession.status === "completed" ? "Atendido" : selectedSession.status === "cancelled" ? "Cancelado" : "Programado"}
        </span>
      </div>

      {/* Divisor */}
      <div className="border-t border-brand-sand/40 w-full" />

      {/* Fila 2: Formulario de Tema y Selección de Movimientos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Campo Tema */}
        <div className="col-span-1 lg:col-span-5 flex items-center gap-2.5 w-full">
          <span className="text-[10px] text-text-sub font-bold uppercase tracking-wider whitespace-nowrap">Tema:</span>
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

        {/* Selector de Movimiento */}
        <div className="col-span-1 lg:col-span-7 flex flex-wrap items-center gap-2 lg:justify-end w-full">
          <span className="text-[10px] text-text-sub font-bold uppercase tracking-wider mr-1 whitespace-nowrap">Movimiento:</span>
          <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto pr-1">
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
    </div>
  );
}
