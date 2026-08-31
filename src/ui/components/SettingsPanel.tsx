"use client";

import { useState, useEffect } from "react";
import { useSettings } from "../hooks/useSettings";
import { MOVEMENT_COLOR_STYLES, AVAILABLE_MOVEMENT_COLORS } from "../utils/movement-styles";
import { MovementConfig } from "../../domain/session.types";

export function SettingsPanel() {
  const { movementConfigs, updateAllMovementConfigs } = useSettings();
  const [localConfigs, setLocalConfigs] = useState<MovementConfig[]>([]);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const defaultConfigs = [
    { key: "indigo", color: "indigo", label: "Control" },
    { key: "rose", color: "rose", label: "Cognitivo" },
    { key: "emerald", color: "emerald", label: "Fisiológico" },
    { key: "amber", color: "amber", label: "Otro" }
  ];

  useEffect(() => {
    if (movementConfigs && movementConfigs.length > 0) {
      setLocalConfigs(JSON.parse(JSON.stringify(movementConfigs)));
    } else {
      setLocalConfigs(JSON.parse(JSON.stringify(defaultConfigs)));
    }
  }, [movementConfigs]);

  const handleLabelChange = (key: string, newLabel: string) => {
    setLocalConfigs(prev =>
      prev.map(c => (c.key === key ? { ...c, label: newLabel } : c))
    );
  };

  const handleColorChange = (key: string, newColor: string) => {
    setLocalConfigs(prev =>
      prev.map(c => (c.key === key ? { ...c, color: newColor } : c))
    );
  };

  const handleSave = async () => {
    setSaveStatus("saving");
    try {
      await updateAllMovementConfigs(localConfigs);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (e) {
      console.error("Error guardando configuraciones de movimientos:", e);
      setSaveStatus("idle");
    }
  };

  const colorHexes: Record<string, string> = {
    indigo: "#6366F1",
    rose: "#F43F5E",
    emerald: "#10B981",
    amber: "#F59E0B",
    sky: "#0EA5E9",
    violet: "#8B5CF6",
    teal: "#14B8A6",
    orange: "#F97316"
  };

  const colorNamesEs: Record<string, string> = {
    indigo: "Índigo",
    rose: "Rosa",
    emerald: "Esmeralda",
    amber: "Ámbar",
    sky: "Celeste",
    violet: "Violeta",
    teal: "Cian/Teal",
    orange: "Naranja"
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto">
      {/* Cabecera de Configuración */}
      <div className="bg-bg-card border border-brand-sand rounded-3xl p-6 shadow-sm">
        <h2 className="font-title font-bold text-2xl text-text-main flex items-center gap-2">
          ⚙️ Configuración del Sistema
        </h2>
        <p className="text-xs text-text-sub font-semibold mt-1">
          Personalizá las etiquetas y colores de los Movimientos clínicos utilizados en la agenda y el dossier del paciente.
        </p>
      </div>

      {/* Grid de Movimientos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {localConfigs.map((config) => {
          const styles = MOVEMENT_COLOR_STYLES[config.color] || MOVEMENT_COLOR_STYLES.indigo;
          return (
            <div key={config.key} className="bg-bg-card border border-brand-sand rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-brand-sand/40 pb-2">
                  <span className="text-[10px] text-text-sub font-bold uppercase tracking-wider">
                    Ranura de Movimiento ({config.key})
                  </span>
                  {/* Preview Badge */}
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase transition-all duration-300 ${styles.label}`}>
                    {config.label || "Sin etiqueta"}
                  </span>
                </div>

                {/* Input de Nombre */}
                <div className="space-y-1">
                  <label className="text-xs text-text-sub font-bold">Nombre del Movimiento</label>
                  <input
                    type="text"
                    value={config.label}
                    onChange={(e) => handleLabelChange(config.key, e.target.value)}
                    placeholder="Ej: Cognitivo, Conductual, etc."
                    className="w-full bg-bg-base/70 border border-brand-sand hover:border-brand-sand/80 focus:border-brand-indigo focus:outline-none px-3.5 py-2.5 rounded-xl text-xs font-semibold text-text-main transition-all"
                  />
                </div>

                {/* Selector de Color */}
                <div className="space-y-1.5">
                  <label className="text-xs text-text-sub font-bold">Tema de Color asociado</label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {AVAILABLE_MOVEMENT_COLORS.map((colorName) => {
                      const isActive = config.color === colorName;
                      return (
                        <button
                          key={colorName}
                          onClick={() => handleColorChange(config.key, colorName)}
                          className={`h-7 w-7 rounded-full border transition-all flex items-center justify-center cursor-pointer hover:scale-110 ${
                            isActive 
                              ? "ring-2 ring-brand-indigo ring-offset-2 border-transparent scale-105" 
                              : "border-brand-sand/40"
                          }`}
                          style={{ backgroundColor: colorHexes[colorName] }}
                          title={colorNamesEs[colorName]}
                          type="button"
                        >
                          {isActive && <span className="text-[10px] text-white font-bold">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Botón de Guardado */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saveStatus === "saving"}
          className="bg-brand-indigo hover:bg-brand-indigo/90 text-white font-title font-bold text-xs px-6 py-3 rounded-2xl transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-2"
        >
          {saveStatus === "saving" ? (
            <>
              <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Guardando...
            </>
          ) : saveStatus === "saved" ? (
            "✓ ¡Guardado con éxito!"
          ) : (
            "💾 Guardar Cambios"
          )}
        </button>
      </div>
    </div>
  );
}
