import { Session } from "../../domain/session.types";
import { useSettings } from "../hooks/useSettings";
import { resolveMovementStyles } from "../utils/movement-styles";

interface SessionSidebarProps {
  sortedSessions: Session[];
  selectedSessionUuid: string | null;
  setSelectedSessionUuid: (uuid: string | null) => void;
  setActiveTab: (tab: "timeline" | "ceci") => void;
}

export function SessionSidebar({
  sortedSessions,
  selectedSessionUuid,
  setSelectedSessionUuid,
  setActiveTab,
}: SessionSidebarProps) {
  const { movementConfigs } = useSettings();
  const defaultConfigs = [
    { key: "indigo", color: "indigo", label: "Control" },
    { key: "rose", color: "rose", label: "Cognitivo" },
    { key: "emerald", color: "emerald", label: "Fisiológico" },
    { key: "amber", color: "amber", label: "Otro" }
  ];
  const configsToUse = movementConfigs.length > 0 ? movementConfigs : defaultConfigs;
  return (
    <div className="lg:col-span-3 bg-bg-card border border-brand-sand rounded-3xl p-5 shadow-sm space-y-4 max-h-[75vh] overflow-y-auto">
      <div>
        <h3 className="font-title font-bold text-sm text-text-main">📍 Índice de Sesiones</h3>
        <p className="text-[10px] text-text-sub font-semibold mt-0.5">Hacé clic para desplazarte en el historial</p>
      </div>
      
      {sortedSessions.length === 0 ? (
        <p className="text-xs text-text-sub/70 italic py-4">No hay sesiones programadas.</p>
      ) : (
        <div className="space-y-2">
          {sortedSessions.map((session, index) => {
            const sessionDate = new Date(session.dateTime);
            const dateFormatted = sessionDate.toLocaleDateString("es-AR", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            });
            const sessionNumber = sortedSessions.length - index;

            // Resolving tag colors
            const config = configsToUse.find(c => c.key === (session.colorTag || "indigo")) || configsToUse[0];
            const { labelStyle } = resolveMovementStyles(config.color);
            const resolvedLabel = config.label;

            return (
              <button
                key={session.uuid}
                onClick={() => {
                  setActiveTab("timeline");
                  setSelectedSessionUuid(session.uuid);
                }}
                className={`w-full text-left p-3 rounded-2xl transition-all cursor-pointer flex flex-col gap-1 group border ${
                  selectedSessionUuid === session.uuid
                    ? "bg-brand-indigo/15 border-brand-indigo/60 shadow-sm"
                    : "bg-bg-base/50 hover:bg-brand-indigo/10 border-brand-sand/30 hover:border-brand-indigo/35"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-title font-bold text-xs text-text-main block group-hover:text-brand-indigo">
                    Sesión N° {sessionNumber}
                  </span>
                  <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full border ${
                    session.status === "completed"
                      ? "bg-status-confirmed-light text-status-confirmed-dark border-status-confirmed-dark/20"
                      : session.status === "cancelled"
                      ? "bg-status-cancelled-light text-status-cancelled-dark border-status-cancelled-dark/20"
                      : "bg-brand-sand/30 text-text-sub border-brand-sand/55"
                  }`}>
                    {session.status === "completed" ? "Atendido" : session.status === "cancelled" ? "Cancelado" : "Programado"}
                  </span>
                </div>
                
                {session.description && (
                  <p className="text-[11px] text-text-main font-semibold line-clamp-1">
                    {session.description}
                  </p>
                )}

                <div className="flex items-center justify-between mt-1">
                  <span className="text-[9px] text-text-sub font-mono">
                    {dateFormatted} hs
                  </span>
                  {session.colorTag && (
                    <span 
                      className="text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase"
                      style={labelStyle}
                    >
                      {resolvedLabel}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
