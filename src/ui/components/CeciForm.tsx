"use client";

import React from "react";
import { Patient } from "../../domain/patient.types";

interface CeciFormProps {
  patient: Patient;
  handleCeciChange: (key: string, value: string) => void;
}

export function CeciForm({ patient, handleCeciChange }: CeciFormProps) {
  return (
    <div className="bg-surface border border-line rounded-b-2xl p-6 shadow-xs max-h-[75vh] overflow-y-auto space-y-5">
      <div>
        <h3 className="font-semibold text-sm text-ink">
          Ficha del paciente (CECI)
        </h3>
        <p className="text-[11px] text-ink-sub mt-0.5">
          Marco clínico y variables diagnósticas estructuradas
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label htmlFor="ceci-convive" className="text-xs font-semibold text-ink block mb-1">
            Convive con
          </label>
          <input
            id="ceci-convive"
            type="text"
            value={patient.ceciConviveCon || ""}
            onChange={(e) => handleCeciChange("ceciConviveCon", e.target.value)}
            placeholder="Ej: Pareja e hijos, o padres y hermanos..."
            className="w-full bg-surface border border-line rounded-lg px-3 py-1.5 text-xs text-ink placeholder:text-ink-sub/50 focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="ceci-familia" className="text-xs font-semibold text-ink block mb-1">
            Familia (Estructura familiar)
          </label>
          <textarea
            id="ceci-familia"
            value={patient.ceciFamilia || ""}
            onChange={(e) => handleCeciChange("ceciFamilia", e.target.value)}
            placeholder="Describí la composición y dinámica familiar..."
            className="w-full bg-surface border border-line rounded-lg px-3 py-1.5 text-xs text-ink placeholder:text-ink-sub/50 focus:outline-none focus:border-primary transition-colors h-20"
          />
        </div>

        <div>
          <label htmlFor="ceci-ocupacion" className="text-xs font-semibold text-ink block mb-1">
            Ocupación
          </label>
          <input
            id="ceci-ocupacion"
            type="text"
            value={patient.ceciOcupacion || ""}
            onChange={(e) => handleCeciChange("ceciOcupacion", e.target.value)}
            placeholder="Ej: Docente, Diseñador..."
            className="w-full bg-surface border border-line rounded-lg px-3 py-1.5 text-xs text-ink placeholder:text-ink-sub/50 focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div>
          <label htmlFor="ceci-estudios" className="text-xs font-semibold text-ink block mb-1">
            Estudios
          </label>
          <input
            id="ceci-estudios"
            type="text"
            value={patient.ceciEstudios || ""}
            onChange={(e) => handleCeciChange("ceciEstudios", e.target.value)}
            placeholder="Ej: Universitario completo..."
            className="w-full bg-surface border border-line rounded-lg px-3 py-1.5 text-xs text-ink placeholder:text-ink-sub/50 focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="ceci-tratamientos" className="text-xs font-semibold text-ink block mb-1">
            Tratamientos anteriores
          </label>
          <textarea
            id="ceci-tratamientos"
            value={patient.ceciTratamientosAnteriores || ""}
            onChange={(e) => handleCeciChange("ceciTratamientosAnteriores", e.target.value)}
            placeholder="Detalle de tratamientos psicológicos o psiquiátricos previos..."
            className="w-full bg-surface border border-line rounded-lg px-3 py-1.5 text-xs text-ink placeholder:text-ink-sub/50 focus:outline-none focus:border-primary transition-colors h-20"
          />
        </div>

        <div>
          <label htmlFor="ceci-inicio" className="text-xs font-semibold text-ink block mb-1">
            Inicio de consulta
          </label>
          <input
            id="ceci-inicio"
            type="date"
            value={patient.ceciInicioConsulta || ""}
            onChange={(e) => handleCeciChange("ceciInicioConsulta", e.target.value)}
            className="w-full bg-surface border border-line rounded-lg px-3 py-1.5 text-xs text-ink focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div>
          <label htmlFor="ceci-horario" className="text-xs font-semibold text-ink block mb-1">
            Día y horario habitual
          </label>
          <input
            id="ceci-horario"
            type="text"
            value={patient.ceciDiaHorarioAtencion || ""}
            onChange={(e) => handleCeciChange("ceciDiaHorarioAtencion", e.target.value)}
            placeholder="Ej: Miércoles 16:00 hs..."
            className="w-full bg-surface border border-line rounded-lg px-3 py-1.5 text-xs text-ink placeholder:text-ink-sub/50 focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div>
          <label htmlFor="ceci-frecuencia" className="text-xs font-semibold text-ink block mb-1">
            Frecuencia del tratamiento
          </label>
          <input
            id="ceci-frecuencia"
            type="text"
            value={patient.ceciFrecuenciaTratamiento || ""}
            onChange={(e) => handleCeciChange("ceciFrecuenciaTratamiento", e.target.value)}
            placeholder="Ej: Semanal, Quincenal..."
            className="w-full bg-surface border border-line rounded-lg px-3 py-1.5 text-xs text-ink placeholder:text-ink-sub/50 focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="ceci-adicionales" className="text-xs font-semibold text-ink block mb-1">
            Datos adicionales y observaciones
          </label>
          <textarea
            id="ceci-adicionales"
            value={patient.ceciDatosAdicionales || ""}
            onChange={(e) => handleCeciChange("ceciDatosAdicionales", e.target.value)}
            placeholder="Notas adicionales relevantes para la admisión o evolución..."
            className="w-full bg-surface border border-line rounded-lg px-3 py-1.5 text-xs text-ink placeholder:text-ink-sub/50 focus:outline-none focus:border-primary transition-colors h-20"
          />
        </div>
      </div>
    </div>
  );
}
