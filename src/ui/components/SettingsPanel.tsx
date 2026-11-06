"use client";

import React, { useState, useEffect } from "react";
import { useSettings } from "../hooks/useSettings";
import { MovementConfig, PunctuationConfig, ClinicalFeaturesSettings } from "../../domain/session.types";
import { MovementRow } from "./settings/MovementRow";
import { AvailabilitySettingsTab } from "./settings/AvailabilitySettingsTab";
import { FactoryResetTab } from "./settings/FactoryResetTab";
import { Icon } from "./common/Icon";

export function SettingsPanel() {
  const [settingsTab, setSettingsTab] = useState<"availability" | "categories" | "factory_reset">("availability");
  const {
    movementConfigs,
    punctuationConfigs,
    clinicalFeatures,
    updateAllMovementConfigs,
    updateAllPunctuationConfigs,
    updateClinicalFeatures,
  } = useSettings();

  const [localConfigs, setLocalConfigs] = useState<MovementConfig[]>([]);
  const [localPunctuation, setLocalPunctuation] = useState<PunctuationConfig[]>([]);
  const [features, setFeatures] = useState<ClinicalFeaturesSettings>({
    enableMovements: true,
    enablePunctuations: true,
  });
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const defaultConfigs: MovementConfig[] = [
    { key: "indigo", color: "#2D4C85", label: "Control" },
    { key: "rose", color: "#86315F", label: "Cognitivo" },
    { key: "emerald", color: "#2F6B4A", label: "Fisiológico" },
    { key: "amber", color: "#3D4C56", label: "Otro" },
  ];

  const defaultPunctuation: PunctuationConfig[] = [
    { key: "yellow", color: "#8A5A12", label: "Seguimiento" },
    { key: "green", color: "#2F6B4A", label: "Positivo" },
    { key: "purple", color: "#5A3E86", label: "Reflexión" },
    { key: "orange", color: "#2C5F6B", label: "Evaluación" },
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

  useEffect(() => {
    if (clinicalFeatures) {
      setFeatures({
        enableMovements: clinicalFeatures.enableMovements !== false,
        enablePunctuations: clinicalFeatures.enablePunctuations !== false,
        updatedAt: clinicalFeatures.updatedAt,
      });
    }
  }, [clinicalFeatures]);

  const handleToggleMovements = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !features.enableMovements;
    const updated: ClinicalFeaturesSettings = {
      ...features,
      enableMovements: next,
      updatedAt: new Date().toISOString(),
    };
    setFeatures(updated);
    await updateClinicalFeatures(updated);
  };

  const handleTogglePunctuations = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !features.enablePunctuations;
    const updated: ClinicalFeaturesSettings = {
      ...features,
      enablePunctuations: next,
      updatedAt: new Date().toISOString(),
    };
    setFeatures(updated);
    await updateClinicalFeatures(updated);
  };

  const handleLabelChange = (key: string, newLabel: string) => {
    setLocalConfigs((prev) =>
      prev.map((c) => (c.key === key ? { ...c, label: newLabel } : c))
    );
  };

  const handleColorChange = (key: string, newColor: string) => {
    setLocalConfigs((prev) =>
      prev.map((c) => (c.key === key ? { ...c, color: newColor } : c))
    );
  };

  const handleAddMovement = () => {
    const newKey = `mv_${Date.now()}`;
    const newConfig: MovementConfig = {
      key: newKey,
      color: "#2C5F6B",
      label: "Nuevo movimiento",
    };
    setLocalConfigs((prev) => [...prev, newConfig]);
  };

  const handleDeleteMovement = (key: string) => {
    setLocalConfigs((prev) => prev.filter((c) => c.key !== key));
  };

  const handlePunctuationLabelChange = (key: string, newLabel: string) => {
    setLocalPunctuation((prev) =>
      prev.map((p) => (p.key === key ? { ...p, label: newLabel } : p))
    );
  };

  const handlePunctuationColorChange = (key: string, newColor: string) => {
    setLocalPunctuation((prev) =>
      prev.map((p) => (p.key === key ? { ...p, color: newColor } : p))
    );
  };

  const handleAddPunctuation = () => {
    const newKey = `punc_${Date.now()}`;
    const newConfig: PunctuationConfig = {
      key: newKey,
      color: "#2D4C85",
      label: "Nueva puntuación",
    };
    setLocalPunctuation((prev) => [...prev, newConfig]);
  };

  const handleDeletePunctuation = (key: string) => {
    setLocalPunctuation((prev) => prev.filter((p) => p.key !== key));
  };

  const handleSave = async () => {
    setSaveStatus("saving");
    try {
      await updateAllMovementConfigs(localConfigs);
      await updateAllPunctuationConfigs(localPunctuation);
      await updateClinicalFeatures(features);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (e) {
      console.error("Error guardando configuraciones de la clínica:", e);
      setSaveStatus("idle");
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      {/* Header */}
      <header className="bg-surface border border-line rounded-2xl p-5 shadow-xs">
        <h1 className="font-serif font-medium text-2xl text-ink tracking-tight">
          Configuración de la clínica
        </h1>
        <p className="text-sm text-ink-sub mt-1">
          Ajustá la disponibilidad y duración de sesiones, así como los movimientos clínicos y puntuaciones.
        </p>

        {/* Navigation Tabs */}
        <div
          role="tablist"
          aria-label="Secciones de configuración"
          className="flex border-b border-line pt-4 gap-6 overflow-x-auto"
        >
          <button
            type="button"
            role="tab"
            aria-selected={settingsTab === "availability"}
            onClick={() => setSettingsTab("availability")}
            className={`pb-2.5 text-base font-semibold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              settingsTab === "availability"
                ? "border-primary text-primary"
                : "border-transparent text-ink-sub hover:text-ink"
            }`}
          >
            <Icon name="calendar" size={16} />
            <span>Disponibilidad y Turnos</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={settingsTab === "categories"}
            onClick={() => setSettingsTab("categories")}
            className={`pb-2.5 text-base font-semibold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              settingsTab === "categories"
                ? "border-primary text-primary"
                : "border-transparent text-ink-sub hover:text-ink"
            }`}
          >
            <Icon name="settings" size={16} />
            <span>Movimientos y Puntuaciones</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={settingsTab === "factory_reset"}
            onClick={() => setSettingsTab("factory_reset")}
            className={`pb-2.5 text-base font-semibold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              settingsTab === "factory_reset"
                ? "border-err text-err font-bold"
                : "border-transparent text-ink-sub hover:text-err"
            }`}
          >
            <Icon name="alert" size={16} />
            <span>Restablecimiento de fábrica</span>
          </button>
        </div>
      </header>

      {settingsTab === "availability" ? (
        <AvailabilitySettingsTab />
      ) : settingsTab === "factory_reset" ? (
        <FactoryResetTab />
      ) : (
        <div className="space-y-6">
          {/* Section 1: Movimientos de consulta */}
          <details
            className="group bg-surface border border-line rounded-2xl overflow-hidden shadow-xs"
            open={features.enableMovements}
          >
            <summary className="flex items-center justify-between p-4 cursor-pointer select-none text-sm font-semibold text-ink bg-bg-base/40 hover:bg-bg-base/70 transition-colors">
              <div className="flex items-center gap-3">
                <span>Movimientos de consulta</span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                    features.enableMovements
                      ? "bg-ok-tint text-ok border-ok/30"
                      : "bg-bg-base text-ink-sub border-line"
                  }`}
                >
                  {features.enableMovements ? "Activo" : "Deshabilitado"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleToggleMovements}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                    features.enableMovements
                      ? "border-err/40 text-err hover:bg-err-tint"
                      : "border-primary text-primary hover:bg-primary-tint"
                  }`}
                >
                  {features.enableMovements ? "Desactivar" : "Activar"}
                </button>
                <span className="text-ink-sub transition-transform group-open:rotate-180">
                  <Icon name="chev-d" size={16} />
                </span>
              </div>
            </summary>

            <div className="p-5 space-y-4">
              {!features.enableMovements && (
                <div className="p-3 bg-amber-500/10 border border-amber-300/40 rounded-xl text-xs text-amber-900 font-medium">
                  Los movimientos están deshabilitados. No se mostrarán en la ficha clínica ni al redactar notas de sesión.
                </div>
              )}

              <div className="hidden sm:grid grid-cols-12 gap-4 pb-2 border-b border-line text-sm text-ink-sub font-semibold">
                <div className="col-span-5">Nombre del movimiento</div>
                <div className="col-span-2 text-center">Color</div>
                <div className="col-span-4 text-center">Vista previa</div>
                <div className="col-span-1 text-center">Acción</div>
              </div>

              <div className="divide-y divide-line/60">
                {localConfigs.map((config) => (
                  <MovementRow
                    key={config.key}
                    label={config.label}
                    color={config.color}
                    onLabelChange={(val) => handleLabelChange(config.key, val)}
                    onColorChange={(val) => handleColorChange(config.key, val)}
                    onDelete={() => handleDeleteMovement(config.key)}
                    canDelete={localConfigs.length > 1}
                  />
                ))}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleAddMovement}
                  className="w-full py-2.5 rounded-xl border border-dashed border-primary/40 hover:border-primary text-primary text-sm font-semibold bg-primary-tint/20 hover:bg-primary-tint/40 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Icon name="plus" size={14} />
                  <span>Agregar movimiento</span>
                </button>
              </div>
            </div>
          </details>

          {/* Section 2: Puntuaciones (Editor) */}
          <details
            className="group bg-surface border border-line rounded-2xl overflow-hidden shadow-xs"
            open={features.enablePunctuations}
          >
            <summary className="flex items-center justify-between p-4 cursor-pointer select-none text-sm font-semibold text-ink bg-bg-base/40 hover:bg-bg-base/70 transition-colors">
              <div className="flex items-center gap-3">
                <span>Puntuaciones (resaltados del editor)</span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                    features.enablePunctuations
                      ? "bg-ok-tint text-ok border-ok/30"
                      : "bg-bg-base text-ink-sub border-line"
                  }`}
                >
                  {features.enablePunctuations ? "Activo" : "Deshabilitado"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleTogglePunctuations}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                    features.enablePunctuations
                      ? "border-err/40 text-err hover:bg-err-tint"
                      : "border-primary text-primary hover:bg-primary-tint"
                  }`}
                >
                  {features.enablePunctuations ? "Desactivar" : "Activar"}
                </button>
                <span className="text-ink-sub transition-transform group-open:rotate-180">
                  <Icon name="chev-d" size={16} />
                </span>
              </div>
            </summary>

            <div className="p-5 space-y-4">
              {!features.enablePunctuations && (
                <div className="p-3 bg-amber-500/10 border border-amber-300/40 rounded-xl text-xs text-amber-900 font-medium">
                  Las puntuaciones están deshabilitadas. No se mostrará la paleta de resaltado en el editor de notas ni la trazabilidad de puntuaciones en la ficha clínica.
                </div>
              )}

              <div className="hidden sm:grid grid-cols-12 gap-4 pb-2 border-b border-line text-sm text-ink-sub font-semibold">
                <div className="col-span-5">Nombre de la puntuación</div>
                <div className="col-span-2 text-center">Color</div>
                <div className="col-span-4 text-center">Vista previa</div>
                <div className="col-span-1 text-center">Acción</div>
              </div>

              <div className="divide-y divide-line/60">
                {localPunctuation.map((config) => (
                  <MovementRow
                    key={config.key}
                    label={config.label}
                    color={config.color}
                    onLabelChange={(val) => handlePunctuationLabelChange(config.key, val)}
                    onColorChange={(val) => handlePunctuationColorChange(config.key, val)}
                    onDelete={() => handleDeletePunctuation(config.key)}
                    canDelete={localPunctuation.length > 1}
                  />
                ))}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleAddPunctuation}
                  className="w-full py-2 rounded-xl border border-dashed border-primary/40 hover:border-primary text-primary text-sm font-semibold bg-primary-tint/20 hover:bg-primary-tint/40 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Icon name="plus" size={14} />
                  <span>Agregar puntuación</span>
                </button>
              </div>
            </div>
          </details>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saveStatus === "saving"}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-surface text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {saveStatus === "saving" ? (
                <>
                  <span className="h-3.5 w-3.5 border-2 border-surface border-t-transparent rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : saveStatus === "saved" ? (
                <>
                  <Icon name="check" size={15} />
                  <span>Guardado con éxito</span>
                </>
              ) : (
                <span>Guardar cambios</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
