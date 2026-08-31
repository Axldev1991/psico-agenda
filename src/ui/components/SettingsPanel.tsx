"use client";

import { useState, useEffect } from "react";
import { useSettings } from "../hooks/useSettings";
import { resolveMovementStyles } from "../utils/movement-styles";
import { MovementConfig, PunctuationConfig } from "../../domain/session.types";

export function SettingsPanel() {
  const { 
    movementConfigs, 
    punctuationConfigs, 
    updateAllMovementConfigs, 
    updateAllPunctuationConfigs 
  } = useSettings();

  const [localConfigs, setLocalConfigs] = useState<MovementConfig[]>([]);
  const [localPunctuation, setLocalPunctuation] = useState<PunctuationConfig[]>([]);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const defaultConfigs = [
    { key: "indigo", color: "#6366F1", label: "Control" },
    { key: "rose", color: "#F43F5E", label: "Cognitivo" },
    { key: "emerald", color: "#10B981", label: "Fisiológico" },
    { key: "amber", color: "#F59E0B", label: "Otro" }
  ];

  const defaultPunctuation = [
    { key: "yellow", color: "#FEF08A", label: "Amarillo" },
    { key: "green", color: "#BBF7D0", label: "Verde" },
    { key: "purple", color: "#E9D5FF", label: "Lavanda" },
    { key: "orange", color: "#FED7AA", label: "Arena" }
  ];

  useEffect(() => {
    if (movementConfigs && movementConfigs.length > 0) {
      setLocalConfigs(JSON.parse(JSON.stringify(movementConfigs)));
    } else {
      setLocalConfigs(JSON.parse(JSON.stringify(defaultConfigs)));
    }
  }, [movementConfigs]);

  useEffect(() => {
    if (punctuationConfigs && punctuationConfigs.length > 0) {
      setLocalPunctuation(JSON.parse(JSON.stringify(punctuationConfigs)));
    } else {
      setLocalPunctuation(JSON.parse(JSON.stringify(defaultPunctuation)));
    }
  }, [punctuationConfigs]);

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

  // Handlers para Puntuaciones
  const handlePunctuationLabelChange = (key: string, newLabel: string) => {
    setLocalPunctuation(prev =>
      prev.map(p => (p.key === key ? { ...p, label: newLabel } : p))
    );
  };

  const handlePunctuationColorChange = (key: string, newColor: string) => {
    setLocalPunctuation(prev =>
      prev.map(p => (p.key === key ? { ...p, color: newColor } : p))
    );
  };

  const handleAddPunctuation = () => {
    const newKey = `punc_${Date.now()}`;
    const newConfig: PunctuationConfig = {
      key: newKey,
      color: "#FEF08A",
      label: "Nueva Puntuación"
    };
    setLocalPunctuation(prev => [...prev, newConfig]);
  };

  const handleDeletePunctuation = (key: string) => {
    setLocalPunctuation(prev => prev.filter(p => p.key !== key));
  };

  const handleSave = async () => {
    setSaveStatus("saving");
    try {
      await updateAllMovementConfigs(localConfigs);
      await updateAllPunctuationConfigs(localPunctuation);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (e) {
      console.error("Error guardando configuraciones de la clínica:", e);
      setSaveStatus("idle");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-2xl mx-auto">
      {/* Cabecera de Configuración */}
      <div className="bg-bg-card border border-brand-sand rounded-3xl p-6 shadow-sm">
        <h2 className="font-title font-bold text-xl text-text-main flex items-center gap-2">
          ⚙️ Configuración de la Clínica
        </h2>
        <p className="text-xs text-text-sub font-semibold mt-1">
          Ajustá y personalizá los nombres y colores de los Movimientos clínicos y las Puntuaciones (Resaltados del Editor).
        </p>
      </div>

      {/* SECCIÓN 1: MOVIMIENTOS */}
      <div className="space-y-3">
        <h3 className="font-title font-bold text-sm text-text-main px-1 flex items-center gap-1.5">
          📂 Movimientos de Consulta
        </h3>
        <div className="bg-bg-card border border-brand-sand rounded-3xl p-6 shadow-sm space-y-4">
          <div className="hidden sm:grid grid-cols-12 gap-4 pb-2 border-b border-brand-sand/50 text-[10px] text-text-sub font-bold uppercase tracking-wider">
            <div className="col-span-6">Nombre del Movimiento</div>
            <div className="col-span-2 text-center">Color</div>
            <div className="col-span-3 text-center">Vista Previa</div>
            <div className="col-span-1 text-center">Acción</div>
          </div>

          <div className="divide-y divide-brand-sand/30 space-y-3 sm:space-y-0">
            {localConfigs.map((config) => {
              const { labelStyle } = resolveMovementStyles(config.color);
              return (
                <div 
                  key={config.key} 
                  className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 py-2.5 items-center border-b sm:border-b-0 border-brand-sand/30 last:border-b-0"
                >
                  <div className="col-span-1 sm:col-span-6">
                    <input
                      type="text"
                      value={config.label}
                      onChange={(e) => handleLabelChange(config.key, e.target.value)}
                      className="w-full bg-bg-base/40 border border-brand-sand/40 hover:border-brand-sand/65 focus:border-brand-indigo focus:bg-white focus:outline-none px-3 py-1.5 rounded-xl text-xs font-semibold text-text-main transition-all"
                    />
                  </div>

                  <div className="col-span-1 sm:col-span-2 flex justify-center items-center">
                    <label 
                      className="h-6 w-6 rounded-full border border-brand-sand/40 transition-transform hover:scale-110 flex items-center justify-center cursor-pointer shadow-sm relative overflow-hidden" 
                      style={{ backgroundColor: config.color }}
                    >
                      <input
                        type="color"
                        value={config.color}
                        onChange={(e) => handleColorChange(config.key, e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <span className="text-[8px] text-white font-bold select-none pointer-events-none">🎨</span>
                    </label>
                  </div>

                  <div className="col-span-1 sm:col-span-3 flex justify-center">
                    <span className="text-[9px] font-bold px-2.5 py-0.5 rounded border uppercase select-none" style={labelStyle}>
                      {config.label || "Sin etiqueta"}
                    </span>
                  </div>

                  <div className="col-span-1 sm:col-span-1 flex justify-center">
                    <button
                      onClick={() => handleDeleteMovement(config.key)}
                      disabled={localConfigs.length <= 1}
                      className="h-7 w-7 rounded-lg bg-status-cancelled-light hover:bg-status-cancelled-light/80 text-status-cancelled-dark disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center border border-status-cancelled-dark/10 transition-colors cursor-pointer text-xs"
                      type="button"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

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
      </div>

      {/* SECCIÓN 2: PUNTUACIONES (RESALTADOS) */}
      <div className="space-y-3">
        <h3 className="font-title font-bold text-sm text-text-main px-1 flex items-center gap-1.5">
          ⭐ Puntuaciones (Resaltados del Editor)
        </h3>
        <div className="bg-bg-card border border-brand-sand rounded-3xl p-6 shadow-sm space-y-4">
          <div className="hidden sm:grid grid-cols-12 gap-4 pb-2 border-b border-brand-sand/50 text-[10px] text-text-sub font-bold uppercase tracking-wider">
            <div className="col-span-6">Nombre de la Puntuación</div>
            <div className="col-span-2 text-center">Color</div>
            <div className="col-span-3 text-center">Vista Previa</div>
            <div className="col-span-1 text-center">Acción</div>
          </div>

          <div className="divide-y divide-brand-sand/30 space-y-3 sm:space-y-0">
            {localPunctuation.map((config) => {
              const { labelStyle } = resolveMovementStyles(config.color);
              return (
                <div 
                  key={config.key} 
                  className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 py-2.5 items-center border-b sm:border-b-0 border-brand-sand/30 last:border-b-0"
                >
                  <div className="col-span-1 sm:col-span-6">
                    <input
                      type="text"
                      value={config.label}
                      onChange={(e) => handlePunctuationLabelChange(config.key, e.target.value)}
                      className="w-full bg-bg-base/40 border border-brand-sand/40 hover:border-brand-sand/65 focus:border-brand-indigo focus:bg-white focus:outline-none px-3 py-1.5 rounded-xl text-xs font-semibold text-text-main transition-all"
                    />
                  </div>

                  <div className="col-span-1 sm:col-span-2 flex justify-center items-center">
                    <label 
                      className="h-6 w-6 rounded-full border border-brand-sand/40 transition-transform hover:scale-110 flex items-center justify-center cursor-pointer shadow-sm relative overflow-hidden" 
                      style={{ backgroundColor: config.color }}
                    >
                      <input
                        type="color"
                        value={config.color}
                        onChange={(e) => handlePunctuationColorChange(config.key, e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <span className="text-[8px] text-white font-bold select-none pointer-events-none">🎨</span>
                    </label>
                  </div>

                  <div className="col-span-1 sm:col-span-3 flex justify-center">
                    <span className="text-[9px] font-bold px-2.5 py-0.5 rounded border uppercase select-none font-sans" style={labelStyle}>
                      {config.label || "Sin etiqueta"}
                    </span>
                  </div>

                  <div className="col-span-1 sm:col-span-1 flex justify-center">
                    <button
                      onClick={() => handleDeletePunctuation(config.key)}
                      disabled={localPunctuation.length <= 1}
                      className="h-7 w-7 rounded-lg bg-status-cancelled-light hover:bg-status-cancelled-light/80 text-status-cancelled-dark disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center border border-status-cancelled-dark/10 transition-colors cursor-pointer text-xs"
                      type="button"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-brand-sand/30">
            <button
              onClick={handleAddPunctuation}
              className="w-full py-2 rounded-xl border border-dashed border-brand-indigo/40 hover:border-brand-indigo text-brand-indigo font-title font-bold text-xs bg-brand-indigo/5 hover:bg-brand-indigo/10 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              type="button"
            >
              <span>➕</span> Agregar Nueva Puntuación
            </button>
          </div>
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
