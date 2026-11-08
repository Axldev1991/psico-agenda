"use client";

import React from "react";
import { Patient } from "../../../domain/patient.types";
import { Session, RecurrenceRule } from "../../../domain/session.types";
import { calculateAge } from "../../../domain/patient.utils";
import { generateClinicalHistoryDocument } from "../../../domain/export.service";
import { formatRecurrenceRuleSummary, formatRecurrenceStartDate } from "../../../domain/agenda.service";
import { container } from "../../../infrastructure/container";
import { Icon } from "../common/Icon";

const extraNoteRepo = container.getExtraNoteRepository();

interface PatientDetailHeaderProps {
  patient: Patient;
  sessions: Session[];
  recurrenceRule?: RecurrenceRule | null;
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
  recurrenceRule,
  onBack,
  onEdit,
}: PatientDetailHeaderProps) {
  const handleExport = async () => {
    let extraNotesContent = "";
    try {
      const extraNotes = await extraNoteRepo.getByPatient(patient.uuid);
      if (extraNotes.length > 0) {
        extraNotesContent = extraNotes.map((n) => n.content).join("<br/><br/>");
      }
    } catch (e) {
      console.warn("Falla al recuperar anotaciones extras para exportar:", e);
    }

    const htmlContent = generateClinicalHistoryDocument(patient, sessions, undefined, extraNotesContent);
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
  const age = patient.birthDate ? calculateAge(patient.birthDate) : null;
  const isUnderage = patient.type === "underage";
  const hasRecurrence = Boolean(recurrenceRule && recurrenceRule.rruleString);
  const recurrenceSummary = formatRecurrenceRuleSummary(recurrenceRule);
  const recurrenceStartDateStr = formatRecurrenceStartDate(recurrenceRule);

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

      {/* Turno Fijo / Recurrencia Programada */}
      <div
        data-testid="patient-recurrence-banner"
        className={`mt-4 p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
          hasRecurrence
            ? "bg-primary/5 border-primary/25 shadow-2xs"
            : "bg-bg-base/40 border-line/80 border-dashed"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
              hasRecurrence
                ? "bg-primary-tint text-primary"
                : "bg-bg-base text-ink-sub border border-line"
            }`}
          >
            <Icon name="calendar" size={18} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs uppercase font-bold tracking-wider ${
                  hasRecurrence ? "text-primary" : "text-ink-sub"
                }`}
              >
                Turno Fijo Programado
              </span>
              {hasRecurrence && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {recurrenceRule?.modality === "online" ? "Virtual" : "Presencial"}
                </span>
              )}
            </div>
            <div
              data-testid="patient-recurrence-summary"
              className={`text-base font-semibold mt-0.5 ${
                hasRecurrence ? "text-ink" : "text-ink-sub font-normal"
              }`}
            >
              {recurrenceSummary}
            </div>
          </div>
        </div>

        {recurrenceStartDateStr && (
          <div
            data-testid="patient-recurrence-start-date"
            className="text-sm font-medium text-ink-sub self-start sm:self-auto pl-13 sm:pl-0"
          >
            <span>{recurrenceStartDateStr}</span>
          </div>
        )}
      </div>
    </header>
  );
}
