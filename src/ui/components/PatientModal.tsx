"use client";

import { useState } from "react";
import { Patient } from "../../domain/patient.types";

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (patientData: Omit<Patient, "uuid" | "createdAt" | "updatedAt">) => Promise<void>;
}

export function PatientModal({ isOpen, onClose, onCreate }: PatientModalProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [healthInsurance, setHealthInsurance] = useState("");
  const [affiliateNumber, setAffiliateNumber] = useState("");
  const [sessionPrice, setSessionPrice] = useState("20000");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || Number(sessionPrice) <= 0) return;

    await onCreate({
      fullName,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      healthInsurance: healthInsurance.trim() || undefined,
      affiliateNumber: affiliateNumber.trim() || undefined,
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
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl shadow-black/80 animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-lg text-slate-100">Registrar Nuevo Paciente</h3>
          <button
            onClick={onClose}
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
              placeholder="Ej: Juan Perez"
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
              onClick={onClose}
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
  );
}
