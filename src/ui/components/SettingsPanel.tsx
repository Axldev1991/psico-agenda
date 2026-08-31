"use client";

import { useState, useEffect } from "react";
import { useSettings } from "../hooks/useSettings";
import { resolveMovementStyles } from "../utils/movement-styles";
import { MovementConfig } from "../../domain/session.types";

export function SettingsPanel() {
  const { movementConfigs, updateAllMovementConfigs } = useSettings();
  const [localConfigs, setLocalConfigs] = useState<MovementConfig[]>([]);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const defaultConfigs = [
    { key: "indigo", color: "#6366F1", label: "Control" },
    { key: "rose", color: "#F43F5E", label: "Cognitivo" },
    { key: "emerald", color: "#10B981", label: "Fisiológico" },
    { key: "amber", color: "#F59E0B", label: "Otro" }
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

  const handleAddMovement = () => {
    const newKey = `mv_${Date.now()}`;
    const newConfig: MovementConfig = {
      key: newKey,
      color: "#64748B",
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-2xl mx-auto">
      {/* Cabecera de Configuración */}
      <div className="bg-bg-card border border-brand-sand rounded-3xl p-6 shadow-sm">
        <h2 className="font-title font-bold text-xl text-text-main flex items-center gap-2">
          ⚙️ Configuración del Sistema
        </h2>
        <p className="text-xs text-text-sub font-semibold mt-1">
          Personalizá las etiquetas y colores de los Movimientos clínicos. Hacé clic en el ícono de paleta para elegir cualquier color personalizado del sistema.
        </p>
      </div>

      {/* Lista Minimalista de Movimientos */}
      <div className="bg-bg-card border border-brand-sand rounded-3xl p-6 shadow-sm space-y-4">
        {/* Table Header (hidden on mobile) */}
        <div className="hidden sm:grid grid-cols-12 gap-4 pb-2 border-b border-brand-sand/50 text-[10px] text-text-sub font-bold uppercase tracking-wider">
          <div className="col-span-6">Nombre del Movimiento</div>
          <div className="col-span-2 text-center">Color</div>
          <div className="col-span-3 text-center">Vista Previa</div>
          <div className="col-span-1 text-center">Acción</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-brand-sand/30 space-y-3 sm:space-y-0">
          {localConfigs.map((config) => {
            const { labelStyle } = resolveMovementStyles(config.color);
            return (
              <div 
                key={config.key} 
                className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 py-3 items-center border-b sm:border-b-0 border-brand-sand/30 last:border-b-0"
              >
                {/* Nombre Input */}
                <div className="col-span-1 sm:col-span-6">
                  <input
                    type="text"
                    value={config.label}
                    onChange={(e) => handleLabelChange(config.key, e.target.value)}
                    placeholder="Ej: Terapia Cognitiva..."
                    className="w-full bg-bg-base/40 border border-brand-sand/40 hover:border-brand-sand/65 focus:border-brand-indigo focus:bg-white focus:outline-none px-3 py-1.5 rounded-xl text-xs font-semibold text-text-main transition-all"
                  />
                </div>

                {/* Color Input Picker */}
                <div className="col-span-1 sm:col-span-2 flex justify-center items-center">
                  <div className="flex items-center gap-2">
                    <label 
                      className="h-6 w-6 rounded-full border border-brand-sand/40 transition-transform hover:scale-110 flex items-center justify-center cursor-pointer shadow-sm relative overflow-hidden" 
                      style={{ backgroundColor: config.color }}
                      title="Personalizar Color"
                    >
                      <input
                        type="color"
                        value={config.color}
                        onChange={(e) => handleColorChange(config.key, e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <span className="text-[8px] text-white font-bold select-none drop-shadow-sm pointer-events-none">🎨</span>
                    </label>
                    <span className="text-[10px] text-text-sub font-mono uppercase sm:hidden">
                      {config.color}
                    </span>
                  </div>
                </div>

                {/* Vista Previa Badge */}
                <div className="col-span-1 sm:col-span-3 flex justify-center">
                  <span 
                    className="text-[9px] font-bold px-2.5 py-0.5 rounded border uppercase transition-all duration-300 select-none"
                    style={labelStyle}
                  >
                    {config.label || "Sin etiqueta"}
                  </span>
                </div>

                {/* Eliminar Button */}
                <div className="col-span-1 sm:col-span-1 flex justify-center">
                  <button
                    onClick={() => handleDeleteMovement(config.key)}
                    disabled={localConfigs.length <= 1}
                    className="h-7 w-7 rounded-lg bg-status-cancelled-light hover:bg-status-cancelled-light/80 text-status-cancelled-dark disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center border border-status-cancelled-dark/10 transition-colors cursor-pointer text-xs"
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
            className="w-full py-2 rounded-xl border border-dashed border-brand-indigo/40 hover:border-brand-indigo text-brand-indigo font-title font-bold text-xs bg-brand-indigo/5 hover:bg-brand-indigo/10 transition-all cursor-pointer flex items-center justify-center gap-1.5"
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
