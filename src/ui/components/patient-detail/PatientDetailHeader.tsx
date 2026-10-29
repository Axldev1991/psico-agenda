"use client";

import React from "react";
import { Patient } from "../../../domain/patient.types";
import { Session } from "../../../domain/session.types";
import { calculateAge } from "../../../domain/patient.utils";
import { generateClinicalHistoryDocument } from "../../../domain/export.service";
import { Icon } from "../common/Icon";

interface PatientDetailHeaderProps {
  patient: Patient;
  sessions: Session[];
  onBack: () => void;
  onEdit: (patient: Patient) => void;
}

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function PatientDetailHeader({
  patient,
  sessions,
  onBack,
  onEdit,
}: PatientDetailHeaderProps) {
  const handleExport = () => {
    const htmlContent = generateClinicalHistoryDocument(patient, sessions);
    const blob = new Blob(['\ufeff' + htmlContent], {
      type: 'application/msword;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = patient.fullName.replace(/\s+/g, '_');
    
    a.href = url;
    a.download = `${safeName}_historial.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  const age = patient.birthDate ? calculateAge(patient.birthDate) : (patient.age ?? null);
  const isUnderage = patient.type === "underage";

  return (
    <header className="bg-surface border border-line rounded-2xl p-5 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-line pb-5">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={onBack}
            className="h-9 w-9 rounded-lg bg-bg-base border border-line hover:bg-line/40 text-ink flex items-center justify-center transition-colors cursor-pointer shadow-xs"
            title="Volver al fichero de pacientes"
            aria-label="Volver al fichero de pacientes"
          >
            <Icon name="chev-l" size={16} />
          </button>

          <div>
            <span className="text-sm text-ink-sub font-semibold uppercase tracking-wider block">
              Historial Clínico
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <h1
                data-sensitive
                className="font-serif font-medium text-2xl text-ink tracking-tight"
              >
                {patient.fullName}
              </h1>

              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded ${
                  isUnderage
                    ? "bg-primary-tint text-primary"
                    : "bg-bg-base text-ink-sub border border-line"
                }`}
              >
                {isUnderage ? "Infanto-juvenil" : "Adulto"}
              </span>

              {age !== null && (
                <span data-sensitive className="text-sm text-ink-sub font-medium">
                  · {age} años
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span
            data-sensitive
            className="font-mono text-sm font-semibold bg-bg-base text-ink border border-line px-3 py-1.5 rounded-lg select-none"
          >
            Arancel: {currencyFormatter.format(patient.sessionPrice)}
          </span>

          <button
            type="button"
            onClick={() => onEdit(patient)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-bg-base hover:bg-line/40 border border-line text-ink text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            title="Editar datos personales de la ficha del paciente"
          >
            <Icon name="file" size={14} />
            <span>Editar ficha</span>
          </button>

          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-surface text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            title="Exportar todo el historial clínico a un único Word (.doc)"
          >
            <Icon name="download" size={14} />
            <span>Exportar historial</span>
          </button>
        </div>
      </div>

      {/* Quick Personal Information Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 text-sm">
        <div className="bg-bg-base/60 p-3 rounded-xl border border-line">
          <span className="text-ink-sub block text-xs uppercase font-semibold tracking-wider">
            Teléfono de contacto
          </span>
          <span
            data-sensitive
            className="text-ink block mt-1 font-mono font-medium text-base"
          >
            {patient.phone || "—"}
          </span>
        </div>

        <div className="bg-bg-base/60 p-3 rounded-xl border border-line">
          <span className="text-ink-sub block text-xs uppercase font-semibold tracking-wider">
            Correo electrónico
          </span>
          <span
            data-sensitive
            className="text-ink block mt-1 font-medium truncate text-base"
            title={patient.email}
          >
            {patient.email || "Sin correo"}
          </span>
        </div>

        <div className="bg-bg-base/60 p-3 rounded-xl border border-line">
          <span className="text-ink-sub block text-xs uppercase font-semibold tracking-wider">
            Obra social o prepaga
          </span>
          <span data-sensitive className="text-ink block mt-1 font-medium truncate text-base">
            {patient.healthInsurance
              ? `${patient.healthInsurance} ${
                  patient.affiliateNumber ? `(N° ${patient.affiliateNumber})` : ""
                }`
              : "Particular"}
          </span>
        </div>

        <div className="bg-bg-base/60 p-3 rounded-xl border border-line">
          <span className="text-ink-sub block text-xs uppercase font-semibold tracking-wider">
            Domicilio
          </span>
          <span
            data-sensitive
            className="text-ink block mt-1 font-medium truncate text-base"
            title={patient.address}
          >
            {patient.address || "—"}
          </span>
        </div>
      </div>
    </header>
  );
}
