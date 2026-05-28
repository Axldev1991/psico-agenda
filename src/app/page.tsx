"use client";

import { useState } from "react";
import { usePatients } from "../ui/hooks/usePatients";

export default function Home() {
  const { patients, loading, addPatient, removePatient } = usePatients();
  
  // Estados para UI interactiva
  const [showModal, setShowModal] = useState(false);
  const [isBlurred, setIsBlurred] = useState(false); // Botón de pánico / Blur
  
  // Campos del formulario
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [healthInsurance, setHealthInsurance] = useState("");
  const [affiliateNumber, setAffiliateNumber] = useState("");
  const [sessionPrice, setSessionPrice] = useState("20000");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || Number(sessionPrice) <= 0) return;

    await addPatient({
      fullName,
      email: email || undefined,
      phone: phone || undefined,
      address: address || undefined,
      healthInsurance: healthInsurance || undefined,
      affiliateNumber: affiliateNumber || undefined,
      sessionPrice: Number(sessionPrice),
    });

    // Resetear formulario
    setFullName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setHealthInsurance("");
    setAffiliateNumber("");
    setSessionPrice("20000");
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans antialiased">
      {/* Navbar Premium */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-violet-900/30">
              Ψ
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-violet-400 to-indigo-200 bg-clip-text text-transparent">
                PSICO-AGENDA
              </span>
              <span className="text-xs block text-slate-500 font-medium">Soberanía de Datos Clínicos</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Botón de pánico (Blur) */}
            <button
              onClick={() => setIsBlurred(!isBlurred)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                isBlurred
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/30 ring-2 ring-emerald-400"
                  : "bg-rose-950/40 text-rose-300 border border-rose-800/50 hover:bg-rose-900/30 hover:text-rose-200"
              }`}
            >
              🔒 {isBlurred ? "Datos Protegidos (Click para revelar)" : "Botón de Privacidad (Ocultar)"}
            </button>

            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-all shadow-md shadow-violet-900/20 active:scale-95"
            >
              + Nuevo Paciente
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-all duration-500 ${
        isBlurred ? "blur-md pointer-events-none select-none" : ""
      }`}>
        {/* Estadísticas rápidas */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-950/50 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm">
            <span className="text-slate-400 text-sm font-medium">Pacientes Activos</span>
            <h3 className="text-3xl font-bold mt-2 text-violet-400">{patients.length}</h3>
          </div>
          <div className="bg-slate-950/50 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm">
            <span className="text-slate-400 text-sm font-medium">Estado del Sistema</span>
            <h3 className="text-3xl font-bold mt-2 text-emerald-400">Offline-First</h3>
          </div>
          <div className="bg-slate-950/50 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm">
            <span className="text-slate-400 text-sm font-medium">Persistencia local</span>
            <h3 className="text-3xl font-bold mt-2 text-indigo-400">IndexedDB (Dexie)</h3>
          </div>
        </section>

        {/* Listado de Pacientes */}
        <section className="bg-slate-950/40 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <h2 className="font-bold text-lg text-slate-100">Fichero de Pacientes</h2>
            <span className="text-xs text-slate-500 font-medium">Reactivo en tiempo real</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 font-medium">
              Cargando base de datos IndexedDB...
            </div>
          ) : patients.length === 0 ? (
            <div className="p-16 text-center">
              <div className="h-16 w-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800 text-2xl">
                📂
              </div>
              <h3 className="font-bold text-slate-300 mb-1">No hay pacientes registrados</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
                Los datos se guardan exclusivamente en el almacenamiento local seguro de tu navegador.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="bg-slate-900 hover:bg-slate-800 text-violet-400 border border-slate-700/60 font-semibold text-sm px-4 py-2 rounded-lg transition-all"
              >
                Crear tu primer paciente
              </button>
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
                  {patients.map((patient) => (
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
                          onClick={() => removePatient(patient.uuid)}
                          className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-400 text-xs font-bold px-3 py-1 rounded border border-rose-950/20 hover:bg-rose-950/30 transition-all"
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
      </main>

      {/* Modal para Crear Paciente */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl shadow-black/80 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-100">Registrar Nuevo Paciente</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-500 hover:text-slate-300 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Lic. Juan Perez"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-all text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Teléfono</label>
                  <input
                    type="text"
                    placeholder="Ej: 11 1234-5678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="Ej: paciente@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Domicilio</label>
                <input
                  type="text"
                  placeholder="Ej: Av. Santa Fe 1234, CABA"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-all text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Obra Social / Prepaga</label>
                  <input
                    type="text"
                    placeholder="Ej: OSDE"
                    value={healthInsurance}
                    onChange={(e) => setHealthInsurance(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Número de Afiliado</label>
                  <input
                    type="text"
                    placeholder="Ej: 123456/01"
                    value={affiliateNumber}
                    onChange={(e) => setAffiliateNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Costo Acordado de la Sesión (ARS) *</label>
                <input
                  type="number"
                  required
                  placeholder="Ej: 20000"
                  value={sessionPrice}
                  onChange={(e) => setSessionPrice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-all text-sm"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-slate-200 text-sm font-semibold px-4 py-2 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-all"
                >
                  Guardar Paciente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
