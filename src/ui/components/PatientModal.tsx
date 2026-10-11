"use client";

import React, { useState, useEffect } from "react";
import { Patient } from "../../domain/patient.types";
import { Icon } from "./common/Icon";

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
  const [type, setType] = useState<"adult" | "underage">("adult");
  const [birthDate, setBirthDate] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
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

    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="patient-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div className="bg-surface border border-line rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-xl animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Header */}
        <div className="p-5 border-b border-line flex items-center justify-between shrink-0">
          <h3 id="patient-modal-title" className="font-serif font-medium text-lg text-ink">
            {patientToEdit ? "Editar ficha de paciente" : "Registrar nuevo paciente"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="p-1.5 text-ink-sub hover:text-ink hover:bg-bg-base rounded-md transition-colors cursor-pointer"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          <p className="text-xs text-ink-sub">
            Los campos con <span className="text-primary font-bold">*</span> son obligatorios.
          </p>

          <div>
            <label htmlFor="p-name" className="text-xs font-semibold text-ink block mb-1">
              Nombre completo <span className="text-primary font-bold">*</span>
            </label>
            <input
              id="p-name"
              type="text"
              required
              placeholder="Ej: Lucía Martínez"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-ink placeholder:text-ink-sub/60 focus:outline-none focus:border-primary text-sm cursor-pointer transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="p-phone" className="text-xs font-semibold text-ink block mb-1">
                Teléfono
              </label>
              <input
                id="p-phone"
                type="text"
                placeholder="Ej: +54 11 5555-0143"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-ink placeholder:text-ink-sub/60 focus:outline-none focus:border-primary text-sm cursor-pointer transition-colors"
              />
            </div>
            <div>
              <label htmlFor="p-email" className="text-xs font-semibold text-ink block mb-1">
                Correo electrónico
              </label>
              <input
                id="p-email"
                type="email"
                placeholder="Ej: paciente@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-ink placeholder:text-ink-sub/60 focus:outline-none focus:border-primary text-sm cursor-pointer transition-colors"
              />
            </div>
          </div>

          <div>
            <label htmlFor="p-addr" className="text-xs font-semibold text-ink block mb-1">
              Domicilio
            </label>
            <input
              id="p-addr"
              type="text"
              placeholder="Ej: Av. Santa Fe 1234, CABA"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-ink placeholder:text-ink-sub/60 focus:outline-none focus:border-primary text-sm cursor-pointer transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="p-insurance" className="text-xs font-semibold text-ink block mb-1">
                Obra social o prepaga
              </label>
              <input
                id="p-insurance"
                type="text"
                placeholder="Ej: OSDE, Swiss Medical"
                value={healthInsurance}
                onChange={(e) => setHealthInsurance(e.target.value)}
                className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-ink placeholder:text-ink-sub/60 focus:outline-none focus:border-primary text-sm cursor-pointer transition-colors"
              />
            </div>
            <div>
              <label htmlFor="p-affiliate" className="text-xs font-semibold text-ink block mb-1">
                Número de afiliado / Credencial
              </label>
              <input
                id="p-affiliate"
                type="text"
                placeholder="Ej: 123456/01"
                value={affiliateNumber}
                onChange={(e) => setAffiliateNumber(e.target.value)}
                className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-ink placeholder:text-ink-sub/60 focus:outline-none focus:border-primary text-sm cursor-pointer transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="p-type" className="text-xs font-semibold text-ink block mb-1">
                Grupo de atención <span className="text-primary font-bold">*</span>
              </label>
              <select
                id="p-type"
                value={type}
                onChange={(e) => setType(e.target.value as "adult" | "underage")}
                className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-primary text-sm cursor-pointer transition-colors"
              >
                <option value="adult">Adulto</option>
                <option value="underage">Infanto-juvenil</option>
              </select>
            </div>
            <div>
              <label htmlFor="p-birth" className="text-xs font-semibold text-ink block mb-1">
                Fecha de nacimiento
              </label>
              <input
                id="p-birth"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-primary text-sm cursor-pointer transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="p-status" className="text-xs font-semibold text-ink block mb-1">
                Estado de tratamiento <span className="text-primary font-bold">*</span>
              </label>
              <select
                id="p-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
                className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-primary text-sm cursor-pointer transition-colors"
              >
                <option value="active">En tratamiento</option>
                <option value="inactive">De alta</option>
              </select>
            </div>
            <div>
              <label htmlFor="p-fee" className="text-xs font-semibold text-ink block mb-1">
                Costo de sesión (ARS) <span className="text-primary font-bold">*</span>
              </label>
              <input
                id="p-fee"
                type="number"
                required
                min="1"
                placeholder="20000"
                value={sessionPrice}
                onChange={(e) => setSessionPrice(e.target.value)}
                className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-ink font-mono focus:outline-none focus:border-primary text-sm cursor-pointer transition-colors"
              />
            </div>
          </div>

          {/* Ficha CECI Opcional */}
          <details className="group border border-line rounded-xl bg-bg-base/40 overflow-hidden">
            <summary className="text-xs font-semibold text-ink px-4 py-2.5 bg-bg-base cursor-pointer select-none flex items-center justify-between">
              <span>Datos clínicos adicionales (Ficha CECI)</span>
              <span className="text-ink-sub transition-transform group-open:rotate-180">
                <Icon name="chev-d" size={14} />
              </span>
            </summary>
            <div className="p-4 space-y-3 border-t border-line bg-surface grid grid-cols-1 sm:grid-cols-2 gap-x-3.5 gap-y-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] text-ink-sub font-semibold block mb-0.5">
                  Convive con
                </label>
                <input
                  type="text"
                  value={ceciConviveCon}
                  onChange={(e) => setCeciConviveCon(e.target.value)}
                  placeholder="Ej: Pareja e hijos..."
                  className="w-full bg-surface border border-line rounded-lg px-3 py-1.5 text-ink text-xs focus:outline-none focus:border-primary"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[11px] text-ink-sub font-semibold block mb-0.5">
                  Familia (Estructura familiar)
                </label>
                <textarea
                  value={ceciFamilia}
                  onChange={(e) => setCeciFamilia(e.target.value)}
                  placeholder="Ej: Padres casados, un hermano..."
                  className="w-full bg-surface border border-line rounded-lg px-3 py-1.5 text-ink text-xs focus:outline-none focus:border-primary h-12"
                />
              </div>
              <div>
                <label className="text-[11px] text-ink-sub font-semibold block mb-0.5">
                  Ocupación
                </label>
                <input
                  type="text"
                  value={ceciOcupacion}
                  onChange={(e) => setCeciOcupacion(e.target.value)}
                  placeholder="Ej: Docente..."
                  className="w-full bg-surface border border-line rounded-lg px-3 py-1.5 text-ink text-xs focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-[11px] text-ink-sub font-semibold block mb-0.5">
                  Estudios
                </label>
                <input
                  type="text"
                  value={ceciEstudios}
                  onChange={(e) => setCeciEstudios(e.target.value)}
                  placeholder="Ej: Universitario completo..."
                  className="w-full bg-surface border border-line rounded-lg px-3 py-1.5 text-ink text-xs focus:outline-none focus:border-primary"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[11px] text-ink-sub font-semibold block mb-0.5">
                  Tratamientos anteriores
                </label>
                <textarea
                  value={ceciTratamientosAnteriores}
                  onChange={(e) => setCeciTratamientosAnteriores(e.target.value)}
                  placeholder="Ej: Terapia psicoanalítica en 2022..."
                  className="w-full bg-surface border border-line rounded-lg px-3 py-1.5 text-ink text-xs focus:outline-none focus:border-primary h-12"
                />
              </div>
              <div>
                <label className="text-[11px] text-ink-sub font-semibold block mb-0.5">
                  Inicio de consulta
                </label>
                <input
                  type="date"
                  value={ceciInicioConsulta}
                  onChange={(e) => setCeciInicioConsulta(e.target.value)}
                  className="w-full bg-surface border border-line rounded-lg px-3 py-1.5 text-ink text-xs focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-[11px] text-ink-sub font-semibold block mb-0.5">
                  Día y horario habitual
                </label>
                <input
                  type="text"
                  value={ceciDiaHorarioAtencion}
                  onChange={(e) => setCeciDiaHorarioAtencion(e.target.value)}
                  placeholder="Ej: Martes 15:00 hs..."
                  className="w-full bg-surface border border-line rounded-lg px-3 py-1.5 text-ink text-xs focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-[11px] text-ink-sub font-semibold block mb-0.5">
                  Frecuencia sugerida
                </label>
                <input
                  type="text"
                  value={ceciFrecuenciaTratamiento}
                  onChange={(e) => setCeciFrecuenciaTratamiento(e.target.value)}
                  placeholder="Ej: Semanal..."
                  className="w-full bg-surface border border-line rounded-lg px-3 py-1.5 text-ink text-xs focus:outline-none focus:border-primary"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[11px] text-ink-sub font-semibold block mb-0.5">
                  Datos adicionales
                </label>
                <textarea
                  value={ceciDatosAdicionales}
                  onChange={(e) => setCeciDatosAdicionales(e.target.value)}
                  placeholder="Observaciones de ingreso..."
                  className="w-full bg-surface border border-line rounded-lg px-3 py-1.5 text-ink text-xs focus:outline-none focus:border-primary h-12"
                />
              </div>
            </div>
          </details>

          {/* Footer */}
          <div className="pt-4 border-t border-line flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-ink-sub hover:text-ink hover:bg-bg-base rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-surface text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Guardar paciente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
