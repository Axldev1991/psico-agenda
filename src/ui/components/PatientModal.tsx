"use client";

import { useState, useEffect } from "react";
import { Patient } from "../../domain/patient.types";

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (patientData: Omit<Patient, "uuid" | "createdAt" | "updatedAt">) => Promise<void>;
  patientToEdit?: Patient | null;
  onUpdate?: (uuid: string, patientData: Omit<Patient, "uuid" | "createdAt" | "updatedAt">) => Promise<void>;
}

export function PatientModal({
  isOpen,
  onClose,
  onCreate,
  patientToEdit = null,
  onUpdate,
}: PatientModalProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [healthInsurance, setHealthInsurance] = useState("");
  const [affiliateNumber, setAffiliateNumber] = useState("");
  const [sessionPrice, setSessionPrice] = useState("20000");
  const [type, setType] = useState<'adult' | 'underage'>("adult");
  const [birthDate, setBirthDate] = useState("");
  const [status, setStatus] = useState<'active' | 'inactive'>("active");
  const [ceciConviveCon, setCeciConviveCon] = useState("");
  const [ceciFamilia, setCeciFamilia] = useState("");
  const [ceciOcupacion, setCeciOcupacion] = useState("");
  const [ceciEstudios, setCeciEstudios] = useState("");
  const [ceciTratamientosAnteriores, setCeciTratamientosAnteriores] = useState("");
  const [ceciInicioConsulta, setCeciInicioConsulta] = useState("");
  const [ceciDiaHorarioAtencion, setCeciDiaHorarioAtencion] = useState("");
  const [ceciFrecuenciaTratamiento, setCeciFrecuenciaTratamiento] = useState("");
  const [ceciDatosAdicionales, setCeciDatosAdicionales] = useState("");

  useEffect(() => {
    if (patientToEdit) {
      setFullName(patientToEdit.fullName || "");
      setEmail(patientToEdit.email || "");
      setPhone(patientToEdit.phone || "");
      setAddress(patientToEdit.address || "");
      setHealthInsurance(patientToEdit.healthInsurance || "");
      setAffiliateNumber(patientToEdit.affiliateNumber || "");
      setSessionPrice(String(patientToEdit.sessionPrice || "20000"));
      setType(patientToEdit.type || "adult");
      setBirthDate(patientToEdit.birthDate || "");
      setStatus(patientToEdit.status || "active");
      setCeciConviveCon(patientToEdit.ceciConviveCon || "");
      setCeciFamilia(patientToEdit.ceciFamilia || "");
      setCeciOcupacion(patientToEdit.ceciOcupacion || "");
      setCeciEstudios(patientToEdit.ceciEstudios || "");
      setCeciTratamientosAnteriores(patientToEdit.ceciTratamientosAnteriores || "");
      setCeciInicioConsulta(patientToEdit.ceciInicioConsulta || "");
      setCeciDiaHorarioAtencion(patientToEdit.ceciDiaHorarioAtencion || "");
      setCeciFrecuenciaTratamiento(patientToEdit.ceciFrecuenciaTratamiento || "");
      setCeciDatosAdicionales(patientToEdit.ceciDatosAdicionales || "");
    } else {
      setFullName("");
      setEmail("");
      setPhone("");
      setAddress("");
      setHealthInsurance("");
      setAffiliateNumber("");
      setSessionPrice("20000");
      setType("adult");
      setBirthDate("");
      setStatus("active");
      setCeciConviveCon("");
      setCeciFamilia("");
      setCeciOcupacion("");
      setCeciEstudios("");
      setCeciTratamientosAnteriores("");
      setCeciInicioConsulta("");
      setCeciDiaHorarioAtencion("");
      setCeciFrecuenciaTratamiento("");
      setCeciDatosAdicionales("");
    }
  }, [patientToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || Number(sessionPrice) <= 0) return;

    const patientData = {
      fullName,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      healthInsurance: healthInsurance.trim() || undefined,
      affiliateNumber: affiliateNumber.trim() || undefined,
      sessionPrice: Number(sessionPrice),
      type,
      birthDate: birthDate.trim() || undefined,
      status,
      ceciConviveCon: ceciConviveCon.trim() || undefined,
      ceciFamilia: ceciFamilia.trim() || undefined,
      ceciOcupacion: ceciOcupacion.trim() || undefined,
      ceciEstudios: ceciEstudios.trim() || undefined,
      ceciTratamientosAnteriores: ceciTratamientosAnteriores.trim() || undefined,
      ceciInicioConsulta: ceciInicioConsulta.trim() || undefined,
      ceciDiaHorarioAtencion: ceciDiaHorarioAtencion.trim() || undefined,
      ceciFrecuenciaTratamiento: ceciFrecuenciaTratamiento.trim() || undefined,
      ceciDatosAdicionales: ceciDatosAdicionales.trim() || undefined,
    };

    if (patientToEdit && onUpdate) {
      await onUpdate(patientToEdit.uuid, patientData);
    } else {
      await onCreate(patientData);
    }

    // Resetear formulario
    setFullName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setHealthInsurance("");
    setAffiliateNumber("");
    setSessionPrice("20000");
    setType("adult");
    setBirthDate("");
    setStatus("active");
    setCeciConviveCon("");
    setCeciFamilia("");
    setCeciOcupacion("");
    setCeciEstudios("");
    setCeciTratamientosAnteriores("");
    setCeciInicioConsulta("");
    setCeciDiaHorarioAtencion("");
    setCeciFrecuenciaTratamiento("");
    setCeciDatosAdicionales("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-bg-card border border-brand-sand rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl shadow-text-main/10 animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-brand-sand flex items-center justify-between">
          <h3 className="font-title font-bold text-lg text-text-main">
            {patientToEdit ? "Editar Ficha de Paciente" : "Registrar Nuevo Paciente"}
          </h3>
          <button
            onClick={onClose}
            className="text-text-sub hover:text-text-main text-xl font-bold cursor-pointer"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs text-text-sub font-semibold block mb-1">Nombre Completo *</label>
            <input
              type="text"
              required
              placeholder="Ej: Juan Perez"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-bg-base border border-brand-sand rounded-xl px-4 py-2 text-text-main placeholder:text-text-sub/40 focus:outline-none focus:border-brand-indigo focus:ring-1 focus:ring-brand-indigo transition-all text-sm cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-text-sub font-semibold block mb-1">Teléfono</label>
              <input
                type="text"
                placeholder="Ej: 11 1234-5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-bg-base border border-brand-sand rounded-xl px-4 py-2 text-text-main placeholder:text-text-sub/40 focus:outline-none focus:border-brand-indigo focus:ring-1 focus:ring-brand-indigo transition-all text-sm cursor-pointer"
              />
            </div>
            <div>
              <label className="text-xs text-text-sub font-semibold block mb-1">Email</label>
              <input
                type="email"
                placeholder="Ej: paciente@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-bg-base border border-brand-sand rounded-xl px-4 py-2 text-text-main placeholder:text-text-sub/40 focus:outline-none focus:border-brand-indigo focus:ring-1 focus:ring-brand-indigo transition-all text-sm cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-text-sub font-semibold block mb-1">Domicilio</label>
            <input
              type="text"
              placeholder="Ej: Av. Santa Fe 1234, CABA"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-bg-base border border-brand-sand rounded-xl px-4 py-2 text-text-main placeholder:text-text-sub/40 focus:outline-none focus:border-brand-indigo focus:ring-1 focus:ring-brand-indigo transition-all text-sm cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-text-sub font-semibold block mb-1">Obra Social / Prepaga</label>
              <input
                type="text"
                placeholder="Ej: OSDE"
                value={healthInsurance}
                onChange={(e) => setHealthInsurance(e.target.value)}
                className="w-full bg-bg-base border border-brand-sand rounded-xl px-4 py-2 text-text-main placeholder:text-text-sub/40 focus:outline-none focus:border-brand-indigo focus:ring-1 focus:ring-brand-indigo transition-all text-sm cursor-pointer"
              />
            </div>
            <div>
              <label className="text-xs text-text-sub font-semibold block mb-1">Número de Afiliado</label>
              <input
                type="text"
                placeholder="Ej: 123456/01"
                value={affiliateNumber}
                onChange={(e) => setAffiliateNumber(e.target.value)}
                className="w-full bg-bg-base border border-brand-sand rounded-xl px-4 py-2 text-text-main placeholder:text-text-sub/40 focus:outline-none focus:border-brand-indigo focus:ring-1 focus:ring-brand-indigo transition-all text-sm cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-text-sub font-semibold block mb-1">Tipo de Paciente *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'adult' | 'underage')}
                className="w-full bg-bg-base border border-brand-sand rounded-xl px-4 py-2 text-text-main focus:outline-none focus:border-brand-indigo focus:ring-1 focus:ring-brand-indigo transition-all text-sm cursor-pointer"
              >
                <option value="adult">Adulto</option>
                <option value="underage">Infanto-Juvenil</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-text-sub font-semibold block mb-1">Fecha de Nacimiento</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full bg-bg-base border border-brand-sand rounded-xl px-4 py-2 text-text-main focus:outline-none focus:border-brand-indigo focus:ring-1 focus:ring-brand-indigo transition-all text-sm cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-text-sub font-semibold block mb-1">Estado de Tratamiento *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                className="w-full bg-bg-base border border-brand-sand rounded-xl px-4 py-2 text-text-main focus:outline-none focus:border-brand-indigo focus:ring-1 focus:ring-brand-indigo transition-all text-sm cursor-pointer"
              >
                <option value="active">En Tratamiento</option>
                <option value="inactive">De Alta / Inactivo</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-text-sub font-semibold block mb-1">Costo Acordado de la Sesión (ARS) *</label>
              <input
                type="number"
                required
                placeholder="Ej: 20000"
                value={sessionPrice}
                onChange={(e) => setSessionPrice(e.target.value)}
                className="w-full bg-bg-base border border-brand-sand rounded-xl px-4 py-2 text-text-main placeholder:text-text-sub/40 focus:outline-none focus:border-brand-indigo focus:ring-1 focus:ring-brand-indigo transition-all text-sm cursor-pointer"
              />
            </div>
          </div>

          <details className="group border border-brand-sand rounded-xl bg-bg-base/40 overflow-hidden">
            <summary className="text-xs font-title font-bold text-text-main px-4 py-2.5 bg-brand-sand/15 cursor-pointer select-none flex items-center justify-between">
              <span>📋 Datos Ficha CECI (Opcional)</span>
              <span className="text-[10px] text-text-sub transition-transform group-open:rotate-180">▼</span>
            </summary>
            <div className="p-4 space-y-3 border-t border-brand-sand/50 bg-bg-card grid grid-cols-2 gap-x-4 gap-y-3">
              <div className="col-span-2">
                <label className="text-[10px] text-text-sub font-semibold block mb-0.5">Convive Con</label>
                <input
                  type="text"
                  value={ceciConviveCon}
                  onChange={(e) => setCeciConviveCon(e.target.value)}
                  placeholder="Ej: Padres y hermanos..."
                  className="w-full bg-bg-base border border-brand-sand rounded-lg px-3 py-1.5 text-text-main placeholder:text-text-sub/30 focus:outline-none focus:border-brand-indigo text-xs cursor-pointer"
                />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] text-text-sub font-semibold block mb-0.5">Familia (Estructura familiar)</label>
                <textarea
                  value={ceciFamilia}
                  onChange={(e) => setCeciFamilia(e.target.value)}
                  placeholder="Ej: Padres casados, un hermano de 14 años..."
                  className="w-full bg-bg-base border border-brand-sand rounded-lg px-3 py-1.5 text-text-main placeholder:text-text-sub/30 focus:outline-none focus:border-brand-indigo text-xs cursor-pointer h-12"
                />
              </div>
              <div>
                <label className="text-[10px] text-text-sub font-semibold block mb-0.5">Ocupación</label>
                <input
                  type="text"
                  value={ceciOcupacion}
                  onChange={(e) => setCeciOcupacion(e.target.value)}
                  placeholder="Ej: Diseñador, Estudiante..."
                  className="w-full bg-bg-base border border-brand-sand rounded-lg px-3 py-1.5 text-text-main placeholder:text-text-sub/30 focus:outline-none focus:border-brand-indigo text-xs cursor-pointer"
                />
              </div>
              <div>
                <label className="text-[10px] text-text-sub font-semibold block mb-0.5">Estudios</label>
                <input
                  type="text"
                  value={ceciEstudios}
                  onChange={(e) => setCeciEstudios(e.target.value)}
                  placeholder="Ej: Secundario Completo..."
                  className="w-full bg-bg-base border border-brand-sand rounded-lg px-3 py-1.5 text-text-main placeholder:text-text-sub/30 focus:outline-none focus:border-brand-indigo text-xs cursor-pointer"
                />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] text-text-sub font-semibold block mb-0.5">Tratamientos Anteriores</label>
                <textarea
                  value={ceciTratamientosAnteriores}
                  onChange={(e) => setCeciTratamientosAnteriores(e.target.value)}
                  placeholder="Ej: Psicólogo cognitivo en 2024..."
                  className="w-full bg-bg-base border border-brand-sand rounded-lg px-3 py-1.5 text-text-main placeholder:text-text-sub/30 focus:outline-none focus:border-brand-indigo text-xs cursor-pointer h-12"
                />
              </div>
              <div>
                <label className="text-[10px] text-text-sub font-semibold block mb-0.5">Inicio de Consulta</label>
                <input
                  type="date"
                  value={ceciInicioConsulta}
                  onChange={(e) => setCeciInicioConsulta(e.target.value)}
                  className="w-full bg-bg-base border border-brand-sand rounded-lg px-3 py-1.5 text-text-main focus:outline-none focus:border-brand-indigo text-xs cursor-pointer"
                />
              </div>
              <div>
                <label className="text-[10px] text-text-sub font-semibold block mb-0.5">Día y Horario</label>
                <input
                  type="text"
                  value={ceciDiaHorarioAtencion}
                  onChange={(e) => setCeciDiaHorarioAtencion(e.target.value)}
                  placeholder="Ej: Lunes 16:30 hs..."
                  className="w-full bg-bg-base border border-brand-sand rounded-lg px-3 py-1.5 text-text-main placeholder:text-text-sub/30 focus:outline-none focus:border-brand-indigo text-xs cursor-pointer"
                />
              </div>
              <div>
                <label className="text-[10px] text-text-sub font-semibold block mb-0.5">Frecuencia</label>
                <input
                  type="text"
                  value={ceciFrecuenciaTratamiento}
                  onChange={(e) => setCeciFrecuenciaTratamiento(e.target.value)}
                  placeholder="Ej: Semanal, Quincenal..."
                  className="w-full bg-bg-base border border-brand-sand rounded-lg px-3 py-1.5 text-text-main placeholder:text-text-sub/30 focus:outline-none focus:border-brand-indigo text-xs cursor-pointer"
                />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] text-text-sub font-semibold block mb-0.5">Datos Adicionales</label>
                <textarea
                  value={ceciDatosAdicionales}
                  onChange={(e) => setCeciDatosAdicionales(e.target.value)}
                  placeholder="Información adicional relevante..."
                  className="w-full bg-bg-base border border-brand-sand rounded-lg px-3 py-1.5 text-text-main placeholder:text-text-sub/30 focus:outline-none focus:border-brand-indigo text-xs cursor-pointer h-12"
                />
              </div>
            </div>
          </details>

          <div className="pt-4 border-t border-brand-sand flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="text-text-sub hover:text-text-main text-xs font-title font-bold px-4 py-2 transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-brand-indigo hover:bg-brand-indigo/90 text-white font-title font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
            >
              Guardar Paciente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
