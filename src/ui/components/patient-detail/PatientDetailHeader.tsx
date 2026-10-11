"use client";

import React from "react";
import { Patient } from "../../../domain/patient.types";
import { calculateAge } from "../../../domain/patient.utils";
import { exportFullHistoryToWord } from "../../../infrastructure/export/docx-exporter";

interface PatientDetailHeaderProps {
  patient: Patient;
  onBack: () => void;
  onEdit: (patient: Patient) => void;
}

export function PatientDetailHeader({ patient, onBack, onEdit }: PatientDetailHeaderProps) {
  return (
    <div className="bg-bg-card border border-brand-sand rounded-3xl p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-brand-sand/50 pb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="h-10 w-10 rounded-xl bg-bg-base border border-brand-sand hover:bg-brand-sand/20 text-brand-indigo flex items-center justify-center font-bold transition-all cursor-pointer shadow-sm text-sm"
            title="Volver al Fichero"
          >
            ←
          </button>
          <div>
            <span className="text-[10px] text-text-sub font-bold uppercase tracking-wider block">Historial Clínico</span>
            <div className="flex items-center gap-2 mt-0.5">
              <h2 className="font-title font-bold text-2xl text-text-main">{patient.fullName}</h2>
              {patient.type && (
                <span className={`text-[10px] font-title font-bold px-2.5 py-0.5 rounded-full ${
                  patient.type === "adult"
                    ? "bg-brand-indigo/10 text-brand-indigo border border-brand-indigo/20"
                    : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                }`}>
                  {patient.type === "adult" ? "Adulto" : "Infanto-Juvenil"}
                </span>
              )}
              {patient.birthDate && (
                <span className="text-sm text-text-sub font-semibold">
                  ({calculateAge(patient.birthDate)} años)
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-bold bg-brand-lavender/30 text-text-main border border-brand-lavender/40 px-3 py-1.5 rounded-xl shadow-sm select-none">
            Arancel: ${patient.sessionPrice.toLocaleString("es-AR")} ARS
          </span>
          <button
            onClick={() => onEdit(patient)}
            className="bg-bg-base hover:bg-brand-sand/20 border border-brand-sand text-brand-indigo font-title font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
            title="Editar datos personales de la ficha del paciente"
          >
            ✏️ Editar Ficha
          </button>
          <button
            disabled={patient.isHistoryLoaded === false}
            onClick={() => exportFullHistoryToWord(patient)}
            className="bg-brand-indigo hover:bg-brand-indigo/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-title font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
            title="Exportar todo el historial clínico a un único Word (.doc)"
          >
            📥 Exportar Historial Completo
          </button>
        </div>
      </div>

      {/* Detalles Rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 text-xs font-medium">
        <div className="bg-bg-base/50 p-3 rounded-2xl border border-brand-sand/30">
          <span className="text-text-sub block text-[10px] uppercase font-bold tracking-wider">Teléfono de Contacto</span>
          <span className="text-text-main block mt-1 text-sm font-semibold">{patient.phone || "—"}</span>
        </div>
        <div className="bg-bg-base/50 p-3 rounded-2xl border border-brand-sand/30">
          <span className="text-text-sub block text-[10px] uppercase font-bold tracking-wider">Correo Electrónico</span>
          <span className="text-text-main block mt-1 text-sm font-semibold truncate" title={patient.email}>{patient.email || "Sin correo"}</span>
        </div>
        <div className="bg-bg-base/50 p-3 rounded-2xl border border-brand-sand/30">
          <span className="text-text-sub block text-[10px] uppercase font-bold tracking-wider">Obra Social / Prepaga</span>
          <span className="text-text-main block mt-1 text-sm font-semibold">
            {patient.healthInsurance ? `${patient.healthInsurance} (N° ${patient.affiliateNumber || "—"})` : "Particular"}
          </span>
        </div>
        <div className="bg-bg-base/50 p-3 rounded-2xl border border-brand-sand/30">
          <span className="text-text-sub block text-[10px] uppercase font-bold tracking-wider">Dirección Física</span>
          <span className="text-text-main block mt-1 text-sm font-semibold truncate" title={patient.address}>{patient.address || "—"}</span>
        </div>
      </div>
    </div>
  );
}
