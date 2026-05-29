"use client";

import { useState } from "react";
import { Patient } from "../../domain/patient.types";

interface PatientManagerProps {
  patients: Patient[];
  loading: boolean;
  onRemovePatient: (uuid: string) => Promise<void>;
  onOpenPatientModal: () => void;
  onSelectPatient: (patient: Patient) => void;
}

export function PatientManager({
  patients,
  loading,
  onRemovePatient,
  onOpenPatientModal,
  onSelectPatient,
}: PatientManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPatients = patients.filter((p) =>
    p.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section className="bg-bg-card border border-brand-sand rounded-2xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-brand-sand flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-title font-bold text-lg text-text-main">Fichero de Pacientes</h2>
          <p className="text-xs text-text-sub font-medium mt-0.5">Reactivo en tiempo real</p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="🔍 Buscar paciente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-bg-base border border-brand-sand rounded-xl px-4 py-2 text-text-main placeholder:text-text-sub/50 focus:outline-none focus:border-brand-indigo focus:ring-1 focus:ring-brand-indigo text-xs w-full sm:w-48 transition-all cursor-pointer"
          />
          <button
            onClick={onOpenPatientModal}
            className="bg-brand-indigo hover:bg-brand-indigo/90 text-white font-title font-bold text-xs px-4 py-2.5 rounded-xl transition-all whitespace-nowrap cursor-pointer shadow-sm"
          >
            + Nuevo Paciente
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-text-sub font-medium">
          Cargando base de datos IndexedDB...
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="p-16 text-center">
          <div className="h-16 w-16 bg-bg-base rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-sand text-2xl">
            📂
          </div>
          <h3 className="font-title font-bold text-text-main mb-1">
            {searchTerm ? "No se encontraron coincidencias" : "No hay pacientes registrados"}
          </h3>
          <p className="text-sm text-text-sub max-w-sm mx-auto mb-6">
            {searchTerm
              ? "Probá ingresando otro nombre en la barra de búsqueda."
              : "Los datos se guardan exclusivamente en el almacenamiento local seguro de tu navegador."}
          </p>
          {!searchTerm && (
            <button
              onClick={onOpenPatientModal}
              className="bg-bg-base hover:bg-brand-sand/30 text-brand-indigo border border-brand-sand font-title font-bold text-sm px-4 py-2 rounded-xl transition-all cursor-pointer"
            >
              Crear tu primer paciente
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-sand/10 border-b border-brand-sand text-text-sub text-[11px] font-title font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Paciente</th>
                <th className="py-4 px-6">Contacto</th>
                <th className="py-4 px-6">Obra Social / Prepaga</th>
                <th className="py-4 px-6">Costo de Sesión</th>
                <th className="py-4 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-sand/40">
              {filteredPatients.map((patient) => (
                <tr
                  key={patient.uuid}
                  className="hover:bg-brand-sand/10 transition-colors group"
                >
                  {/* Paciente (DM Sans + IBM Plex Mono) */}
                  <td className="py-4 px-6">
                    <span className="font-title font-bold text-text-main block">
                      {patient.fullName}
                    </span>
                    <span className="font-mono text-[10px] text-text-sub block mt-0.5">
                      ID: {patient.uuid.substring(0, 8)}...
                    </span>
                  </td>

                  {/* Contacto (Inter + Arena) */}
                  <td className="py-4 px-6">
                    <span className="text-sm text-text-main block font-semibold">{patient.phone || "—"}</span>
                    <span className="text-xs text-text-sub block">{patient.email || "Sin email"}</span>
                    {patient.address && (
                      <span className="font-sans text-[10px] text-text-main font-semibold bg-brand-sand/40 px-1.5 py-0.5 rounded inline-block mt-1">
                        📍 {patient.address}
                      </span>
                    )}
                  </td>

                  {/* Obra Social */}
                  <td className="py-4 px-6">
                    {patient.healthInsurance ? (
                      <div>
                        <span className="text-sm text-text-main font-bold block">{patient.healthInsurance}</span>
                        <span className="text-xs text-text-sub block mt-0.5">
                          Cred: {patient.affiliateNumber || "Sin N°"}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-text-sub">—</span>
                    )}
                  </td>

                  {/* Costo (Lavanda suave + IBM Plex Mono!) */}
                  <td className="py-4 px-6">
                    <span className="font-mono text-xs font-bold bg-brand-lavender/30 text-text-main border border-brand-lavender/40 px-2.5 py-1 rounded-lg inline-block">
                      ${patient.sessionPrice.toLocaleString("es-AR")} ARS
                    </span>
                  </td>

                  {/* Acciones */}
                  <td className="py-4 px-6 text-right space-x-2">
                    <button
                      onClick={() => onSelectPatient(patient)}
                      className="bg-brand-indigo/10 hover:bg-brand-indigo/25 text-brand-indigo text-[11px] font-title font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-sm"
                    >
                      📝 Ver Ficha
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Estás seguro de que deseas eliminar a ${patient.fullName}? Esta acción borrará todas sus sesiones e historial clínico de forma irreversible.`)) {
                          onRemovePatient(patient.uuid);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 bg-status-cancelled-light text-status-cancelled-dark hover:bg-status-cancelled-light/85 border border-status-cancelled-dark/20 text-[10px] font-title font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
