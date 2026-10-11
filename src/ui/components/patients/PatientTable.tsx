"use client";

import React from "react";
import { Patient } from "../../../domain/patient.types";
import { calculateAge } from "../../../domain/patient.utils";
import { Icon } from "../common/Icon";

interface PatientTableProps {
  patients: Patient[];
  onSelectPatient: (patient: Patient) => void;
  onRemovePatient: (uuid: string) => Promise<void>;
}

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function PatientTable({
  patients,
  onSelectPatient,
  onRemovePatient,
}: PatientTableProps) {
  return (
    <>
      {/* Desktop Table (>= 768px) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-line text-ink-sub text-xs font-medium">
              <th scope="col" className="py-3 px-5 font-normal">
                Paciente
              </th>
              <th scope="col" className="py-3 px-5 font-normal">
                Contacto
              </th>
              <th scope="col" className="py-3 px-5 font-normal">
                Obra social o prepaga
              </th>
              <th scope="col" className="py-3 px-5 font-normal text-right">
                Costo de sesión
              </th>
              <th scope="col" className="py-3 px-5 font-normal text-right">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {patients.map((patient) => {
              const age = patient.birthDate ? calculateAge(patient.birthDate) : null;
              const isInactive = patient.status === "inactive";
              const isUnderage = patient.type === "underage";

              return (
                <tr
                  key={patient.uuid}
                  className="hover:bg-bg-base/40 transition-colors group"
                >
                  {/* Paciente */}
                  <td className="py-3.5 px-5">
                    <div
                      data-sensitive
                      className="font-semibold text-sm text-ink truncate"
                    >
                      {patient.fullName}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-ink-sub">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-medium ${
                          isUnderage
                            ? "bg-primary-tint text-primary"
                            : "bg-bg-base text-ink-sub border border-line/60"
                        }`}
                      >
                        {isUnderage ? "Infanto-juvenil" : "Adulto"}
                      </span>

                      {isInactive && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-line/40 text-ink-sub">
                          De alta
                        </span>
                      )}

                      {age !== null && (
                        <span data-sensitive className="text-[11px] text-ink-sub">
                          · {age} años
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Contacto */}
                  <td className="py-3.5 px-5">
                    <div
                      data-sensitive
                      className="text-xs font-semibold text-ink font-mono"
                    >
                      {patient.phone || "—"}
                    </div>
                    <div
                      data-sensitive
                      className="text-xs text-ink-sub truncate max-w-50"
                    >
                      {patient.email || "Sin correo"}
                    </div>
                    {patient.address && (
                      <div
                        data-sensitive
                        className="text-xs text-ink-sub flex items-center gap-1 mt-0.5"
                      >
                        <Icon name="pin" size={12} />
                        <span className="truncate max-w-45">
                          {patient.address}
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Obra Social */}
                  <td className="py-3.5 px-5">
                    <div data-sensitive className="text-xs font-semibold text-ink">
                      {patient.healthInsurance || "Particular"}
                    </div>
                    <div data-sensitive className="text-xs text-ink-sub">
                      {patient.affiliateNumber
                        ? `Credencial ${patient.affiliateNumber}`
                        : "Sin credencial"}
                    </div>
                  </td>

                  {/* Costo de sesión */}
                  <td className="py-3.5 px-5 text-right">
                    <span
                      data-sensitive
                      className="text-sm font-medium text-ink font-mono"
                    >
                      {currencyFormatter.format(patient.sessionPrice)}
                    </span>
                  </td>

                  {/* Acciones */}
                  <td className="py-3.5 px-5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onSelectPatient(patient)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-bg-base hover:bg-line/40 text-ink border border-line rounded-lg transition-colors cursor-pointer"
                      >
                        <Icon name="file" size={13} />
                        <span>Ver ficha</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (
                            confirm(
                              `¿Estás seguro de que deseas eliminar a ${patient.fullName}? Esta acción borrará todas sus sesiones e historial clínico.`
                            )
                          ) {
                            onRemovePatient(patient.uuid);
                          }
                        }}
                        title="Eliminar paciente"
                        className="opacity-0 group-hover:opacity-100 p-1 text-ink-sub hover:text-err hover:bg-err-tint rounded-md transition-all cursor-pointer"
                      >
                        <Icon name="x" size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Cards (< 768px) */}
      <div className="block md:hidden divide-y divide-line/60">
        {patients.map((patient) => {
          const age = patient.birthDate ? calculateAge(patient.birthDate) : null;
          const isInactive = patient.status === "inactive";
          const isUnderage = patient.type === "underage";

          return (
            <div key={patient.uuid} className="p-4 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3
                    data-sensitive
                    className="font-semibold text-sm text-ink truncate"
                  >
                    {patient.fullName}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5 text-xs text-ink-sub">
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-medium ${
                        isUnderage
                          ? "bg-primary-tint text-primary"
                          : "bg-bg-base text-ink-sub border border-line/60"
                      }`}
                    >
                      {isUnderage ? "Infanto-juvenil" : "Adulto"}
                    </span>
                    {isInactive && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-line/40 text-ink-sub">
                        De alta
                      </span>
                    )}
                    {age !== null && (
                      <span data-sensitive className="text-[11px] text-ink-sub">
                        · {age} años
                      </span>
                    )}
                  </div>
                </div>

                <span
                  data-sensitive
                  className="text-sm font-semibold text-ink font-mono shrink-0"
                >
                  {currencyFormatter.format(patient.sessionPrice)}
                </span>
              </div>

              {/* Contact info */}
              <div className="text-xs text-ink-sub space-y-0.5">
                <div data-sensitive className="font-mono text-ink">
                  {patient.phone || "Sin teléfono"}
                </div>
                <div data-sensitive>{patient.email || "Sin correo"}</div>
                {patient.healthInsurance && (
                  <div data-sensitive className="text-ink">
                    {patient.healthInsurance}
                    {patient.affiliateNumber ? ` · ${patient.affiliateNumber}` : ""}
                  </div>
                )}
              </div>

              {/* Action */}
              <div className="pt-2 flex items-center justify-between border-t border-line/40">
                <button
                  type="button"
                  onClick={() => onSelectPatient(patient)}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-bg-base hover:bg-line/40 text-ink border border-line rounded-lg transition-colors cursor-pointer"
                >
                  <Icon name="file" size={13} />
                  <span>Ver ficha</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (
                      confirm(
                        `¿Estás seguro de que deseas eliminar a ${patient.fullName}?`
                      )
                    ) {
                      onRemovePatient(patient.uuid);
                    }
                  }}
                  className="text-xs text-ink-sub hover:text-err transition-colors cursor-pointer"
                >
                  Eliminar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
