"use client";

import { useState } from "react";
import { Patient } from "../../domain/patient.types";

interface PatientManagerProps {
  patients: Patient[];
  loading: boolean;
  onRemovePatient: (uuid: string) => Promise<void>;
  onOpenPatientModal: () => void;
}

export function PatientManager({
  patients,
  loading,
  onRemovePatient,
  onOpenPatientModal,
}: PatientManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPatients = patients.filter((p) =>
    p.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section className="bg-slate-950/40 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm">
      <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-bold text-lg text-slate-100">Fichero de Pacientes</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Reactivo en tiempo real</p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="🔍 Buscar paciente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 text-xs w-full sm:w-48 transition-all"
          />
          <button
            onClick={onOpenPatientModal}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all whitespace-nowrap"
          >
            + Nuevo Paciente
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 font-medium">
          Cargando base de datos IndexedDB...
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="p-16 text-center">
          <div className="h-16 w-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800 text-2xl">
            📂
          </div>
          <h3 className="font-bold text-slate-300 mb-1">
            {searchTerm ? "No se encontraron coincidencias" : "No hay pacientes registrados"}
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
            {searchTerm
              ? "Probá ingresando otro nombre en la barra de búsqueda."
              : "Los datos se guardan exclusivamente en el almacenamiento local seguro de tu navegador."}
          </p>
          {!searchTerm && (
            <button
              onClick={onOpenPatientModal}
              className="bg-slate-900 hover:bg-slate-800 text-violet-400 border border-slate-700/60 font-semibold text-sm px-4 py-2 rounded-lg transition-all"
            >
              Crear tu primer paciente
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="py-4 px-6">Paciente</th>
                <th className="py-4 px-6">Contacto</th>
                <th className="py-4 px-6">Obra Social / Prepaga</th>
                <th className="py-4 px-6">Costo de Sesión</th>
                <th className="py-4 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredPatients.map((patient) => (
                <tr
                  key={patient.uuid}
                  className="hover:bg-slate-900/30 transition-colors group"
                >
                  <td className="py-4 px-6">
                    <span className="font-semibold text-slate-200 block">
                      {patient.fullName}
                    </span>
                    <span className="text-xs text-slate-500 font-mono block">
                      ID: {patient.uuid.substring(0, 8)}...
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm text-slate-300 block">{patient.phone || "—"}</span>
                    <span className="text-xs text-slate-500 block">{patient.email || "Sin email"}</span>
                    {patient.address && (
                      <span className="text-xs text-slate-400 block mt-1">
                        📍 {patient.address}
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    {patient.healthInsurance ? (
                      <div>
                        <span className="text-sm text-slate-300 block">{patient.healthInsurance}</span>
                        <span className="text-xs text-slate-500 block">
                          Cred: {patient.affiliateNumber || "Sin N°"}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-500">—</span>
                    )}
                  </td>
                  <td className="py-4 px-6 font-semibold text-violet-400">
                    ${patient.sessionPrice.toLocaleString("es-AR")} ARS
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => onRemovePatient(patient.uuid)}
                      className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-400 text-xs font-bold px-3 py-1 rounded border border-rose-950/20 hover:bg-rose-950/30 transition-all cursor-pointer"
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
