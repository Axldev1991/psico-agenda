"use client";

import { useState, useEffect } from "react";
import { useSettings } from "../hooks/useSettings";
import { MOVEMENT_COLOR_STYLES, AVAILABLE_MOVEMENT_COLORS } from "../utils/movement-styles";
import { MovementConfig } from "../../domain/session.types";

export function SettingsPanel() {
  const { movementConfigs, updateAllMovementConfigs } = useSettings();
  const [localConfigs, setLocalConfigs] = useState<MovementConfig[]>([]);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [activePickerKey, setActivePickerKey] = useState<string | null>(null);

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
    setActivePickerKey(null); // Close picker after selection
  };

  const handleAddMovement = () => {
    // Generate a unique key and assign default color/label
    const newKey = `mv_${Date.now()}`;
    const newConfig: MovementConfig = {
      key: newKey,
      color: "slate",
      label: "Nuevo Movimiento"
    };
    setLocalConfigs(prev => [...prev, newConfig]);
  };

  const handleDeleteMovement = (key: string) => {
    setLocalConfigs(prev => prev.filter(c => c.key !== key));
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
    orange: "#F97316",
    slate: "#64748B",
    pink: "#EC4899",
    fuchsia: "#D946EF",
    purple: "#A855F7",
    blue: "#3B82F6",
    cyan: "#06B6D4",
    lime: "#84CC16",
    yellow: "#EAB308",
    red: "#EF4444"
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-3xl mx-auto">
      {/* Cabecera de Configuración */}
      <div className="bg-bg-card border border-brand-sand rounded-3xl p-6 shadow-sm">
        <h2 className="font-title font-bold text-2xl text-text-main flex items-center gap-2">
          ⚙️ Configuración del Sistema
        </h2>
        <p className="text-xs text-text-sub font-semibold mt-1">
          Personalizá las etiquetas y colores de los Movimientos clínicos. Podés agregar nuevos temas y eliminar los que no uses.
        </p>
      </div>

      {/* Lista Minimalista de Movimientos */}
      <div className="bg-bg-card border border-brand-sand rounded-3xl p-6 shadow-sm space-y-4">
        <div className="hidden sm:grid grid-cols-12 gap-4 pb-2 border-b border-brand-sand/50 text-[10px] text-text-sub font-bold uppercase tracking-wider">
          <div className="col-span-5">Nombre del Movimiento</div>
          <div className="col-span-3 text-center">Color</div>
          <div className="col-span-3 text-center">Vista Previa</div>
          <div className="col-span-1 text-center">Acción</div>
        </div>

        <div className="divide-y divide-brand-sand/30 space-y-3 sm:space-y-0">
          {localConfigs.map((config, index) => {
            const styles = MOVEMENT_COLOR_STYLES[config.color] || MOVEMENT_COLOR_STYLES.indigo;
            return (
              <div 
                key={config.key} 
                className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 py-3.5 items-center relative border-b sm:border-b-0 border-brand-sand/30 last:border-b-0"
              >
                {/* Nombre */}
                <div className="col-span-1 sm:col-span-5">
                  <input
                    type="text"
                    value={config.label}
                    onChange={(e) => handleLabelChange(config.key, e.target.value)}
                    placeholder="Ej: Terapia Cognitiva..."
                    className="w-full bg-bg-base/40 border border-brand-sand/40 hover:border-brand-sand/65 focus:border-brand-indigo focus:bg-white focus:outline-none px-3 py-2 rounded-xl text-xs font-semibold text-text-main transition-all"
                  />
                </div>

                {/* Selector de Color con Popover */}
                <div className="col-span-1 sm:col-span-3 flex justify-center relative">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActivePickerKey(activePickerKey === config.key ? null : config.key)}
                      className="h-6 w-6 rounded-full border border-brand-sand/40 transition-transform hover:scale-110 flex items-center justify-center cursor-pointer shadow-sm"
                      style={{ backgroundColor: colorHexes[config.color] || "#6366F1" }}
                      title="Elegir Color"
                      type="button"
                    >
                      <span className="text-[8px] text-white font-bold">🎨</span>
                    </button>
                    <span className="text-[10px] text-text-sub font-mono capitalize sm:hidden">
                      Color: {config.color}
                    </span>
                  </div>

                  {/* Popover de Paleta extendida */}
                  {activePickerKey === config.key && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setActivePickerKey(null)} 
                      />
                      <div className="absolute top-8 z-20 bg-white border border-brand-sand p-3 rounded-2xl shadow-xl w-48 animate-in zoom-in-95 duration-150">
                        <span className="text-[9px] text-text-sub font-bold uppercase tracking-wider block mb-2 text-center">
                          Seleccionar Color
                        </span>
                        <div className="grid grid-cols-4 gap-2">
                          {AVAILABLE_MOVEMENT_COLORS.map((colorName) => {
                            const isCurrent = config.color === colorName;
                            return (
                              <button
                                key={colorName}
                                onClick={() => handleColorChange(config.key, colorName)}
                                className={`h-6 w-6 rounded-full border flex items-center justify-center cursor-pointer hover:scale-110 transition-transform ${
                                  isCurrent ? "ring-2 ring-brand-indigo border-transparent" : "border-brand-sand/40"
                                }`}
                                style={{ backgroundColor: colorHexes[colorName] }}
                                type="button"
                              >
                                {isCurrent && <span className="text-[8px] text-white font-bold">✓</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Previsualización del Badge */}
                <div className="col-span-1 sm:col-span-3 flex justify-center">
                  <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded border uppercase transition-all duration-300 ${styles.label}`}>
                    {config.label || "Sin etiqueta"}
                  </span>
                </div>

                {/* Eliminar */}
                <div className="col-span-1 sm:col-span-1 flex justify-center">
                  <button
                    onClick={() => handleDeleteMovement(config.key)}
                    disabled={localConfigs.length <= 1}
                    className="h-8 w-8 rounded-xl bg-status-cancelled-light hover:bg-status-cancelled-light/80 text-status-cancelled-dark disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center border border-status-cancelled-dark/10 transition-colors cursor-pointer"
                    title="Eliminar Movimiento"
                    type="button"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Botón Agregar */}
        <div className="pt-2 border-t border-brand-sand/30">
          <button
            onClick={handleAddMovement}
            className="w-full py-2.5 rounded-xl border border-dashed border-brand-indigo/40 hover:border-brand-indigo text-brand-indigo font-title font-bold text-xs bg-brand-indigo/5 hover:bg-brand-indigo/10 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            type="button"
          >
            <span>➕</span> Agregar Nuevo Movimiento
          </button>
        </div>
      </div>

      {/* Botones de Guardado */}
      <div className="flex items-center justify-end gap-3">
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
