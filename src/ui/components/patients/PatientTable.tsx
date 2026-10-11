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
            <tr className="border-b border-line text-ink-sub text-sm font-semibold">
              <th scope="col" className="py-3.5 px-5">
                Paciente
              </th>
              <th scope="col" className="py-3.5 px-5">
                Contacto
              </th>
              <th scope="col" className="py-3.5 px-5">
                Obra social o prepaga
              </th>
              <th scope="col" className="py-3.5 px-5 text-right">
                Costo de sesión
              </th>
              <th scope="col" className="py-3.5 px-5 text-right">
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
                  <td className="py-4 px-5">
                    <div
                      data-sensitive
                      className="font-semibold text-lg text-ink truncate"
                    >
                      {patient.fullName}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5 text-sm text-ink-sub">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          isUnderage
                            ? "bg-primary-tint text-primary"
                            : "bg-bg-base text-ink-sub border border-line/60"
                        }`}
                      >
                        {isUnderage ? "Infanto-juvenil" : "Adulto"}
                      </span>

                      {isInactive && (
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-line/40 text-ink-sub">
                          De alta
                        </span>
                      )}

                      {age !== null && (
                        <span data-sensitive className="text-sm text-ink-sub">
                          · {age} años
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Contacto */}
                  <td className="py-4 px-5">
                    <div
                      data-sensitive
                      className="text-base font-semibold text-ink font-mono"
                    >
                      {patient.phone || "—"}
                    </div>
                    <div
                      data-sensitive
                      className="text-base text-ink-sub truncate max-w-50"
                    >
                      {patient.email || "Sin correo"}
                    </div>
                    {patient.address && (
                      <div
                        data-sensitive
                        className="text-base text-ink-sub flex items-center gap-1.5 mt-0.5"
                      >
                        <Icon name="pin" size={14} />
                        <span className="truncate max-w-45">
                          {patient.address}
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Obra Social */}
                  <td className="py-4 px-5">
                    <div data-sensitive className="text-base font-semibold text-ink">
                      {patient.healthInsurance || "Particular"}
                    </div>
                    <div data-sensitive className="text-sm text-ink-sub mt-0.5">
                      {patient.affiliateNumber
                        ? `Credencial ${patient.affiliateNumber}`
                        : "Sin credencial"}
                    </div>
                  </td>

                  {/* Costo de sesión */}
                  <td className="py-4 px-5 text-right">
                    <span
                      data-sensitive
                      className="text-lg font-semibold text-ink font-mono"
                    >
                      {currencyFormatter.format(patient.sessionPrice)}
                    </span>
                  </td>

                  {/* Acciones */}
                  <td className="py-4 px-5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onSelectPatient(patient)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-bg-base hover:bg-line/40 text-ink border border-line rounded-lg transition-colors cursor-pointer"
                      >
                        <Icon name="file" size={14} />
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
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-ink-sub hover:text-err hover:bg-err-tint rounded-md transition-all cursor-pointer"
                      >
                        <Icon name="x" size={15} />
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
            <div key={patient.uuid} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3
                    data-sensitive
                    className="font-semibold text-base text-ink truncate"
                  >
                    {patient.fullName}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1 text-sm text-ink-sub">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        isUnderage
                          ? "bg-primary-tint text-primary"
                          : "bg-bg-base text-ink-sub border border-line/60"
                      }`}
                    >
                      {isUnderage ? "Infanto-juvenil" : "Adulto"}
                    </span>
                    {isInactive && (
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-line/40 text-ink-sub">
                        De alta
                      </span>
                    )}
                    {age !== null && (
                      <span data-sensitive className="text-sm text-ink-sub">
                        · {age} años
                      </span>
                    )}
                  </div>
                </div>

                <span
                  data-sensitive
                  className="text-base font-semibold text-ink font-mono shrink-0"
                >
                  {currencyFormatter.format(patient.sessionPrice)}
                </span>
              </div>

              {/* Contact info */}
              <div className="text-sm text-ink-sub space-y-1">
                <div data-sensitive className="font-mono text-ink font-semibold">
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
              <div className="pt-2.5 flex items-center justify-between border-t border-line/40">
                <button
                  type="button"
                  onClick={() => onSelectPatient(patient)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-semibold bg-bg-base hover:bg-line/40 text-ink border border-line rounded-lg transition-colors cursor-pointer"
                >
                  <Icon name="file" size={14} />
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
                  className="text-sm text-ink-sub hover:text-err transition-colors cursor-pointer p-1"
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
