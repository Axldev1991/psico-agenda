"use client";

import React, { useState, useEffect } from "react";
import { Patient } from "../../domain/patient.types";
import { calculateAge } from "../../domain/patient.utils";
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
  // 1. Identificación y Contacto
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [type, setType] = useState<"adult" | "underage">("adult");
  const [status, setStatus] = useState<"active" | "inactive">("active");

  // 2. Encuadre Clínico y Administrativo
  const [sessionPrice, setSessionPrice] = useState("20000");
  const [healthInsurance, setHealthInsurance] = useState("");
  const [affiliateNumber, setAffiliateNumber] = useState("");
  const [ceciInicioConsulta, setCeciInicioConsulta] = useState("");
  const [ceciDiaHorarioAtencion, setCeciDiaHorarioAtencion] = useState("");
  const [ceciFrecuenciaTratamiento, setCeciFrecuenciaTratamiento] = useState("");

  // 3. Contexto Personal y Antecedentes (anteriormente en ficha separada)
  const [ceciConviveCon, setCeciConviveCon] = useState("");
  const [ceciOcupacion, setCeciOcupacion] = useState("");
  const [ceciEstudios, setCeciEstudios] = useState("");
  const [ceciFamilia, setCeciFamilia] = useState("");
  const [ceciTratamientosAnteriores, setCeciTratamientosAnteriores] = useState("");
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
      if (patientToEdit.birthDate) {
        setAge(String(calculateAge(patientToEdit.birthDate)));
      } else if (patientToEdit.age !== undefined && patientToEdit.age !== null) {
        setAge(String(patientToEdit.age));
      } else {
        setAge("");
      }
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
      setAge("");
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

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Sincronización inteligente entre fecha de nacimiento y edad
  const handleBirthDateChange = (val: string) => {
    setBirthDate(val);
    if (val) {
      const calc = calculateAge(val);
      if (!isNaN(calc) && calc >= 0 && calc <= 125) {
        setAge(String(calc));
        setType(calc < 18 ? "underage" : "adult");
      }
    }
  };

  const handleAgeChange = (val: string) => {
    setAge(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 0 && num <= 125) {
      setType(num < 18 ? "underage" : "adult");
      if (!birthDate) {
        const approxYear = new Date().getFullYear() - num;
        setBirthDate(`${approxYear}-01-01`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || Number(sessionPrice) <= 0) return;

    const parsedAge = age.trim()
      ? parseInt(age, 10)
      : birthDate
      ? calculateAge(birthDate)
      : undefined;

    const patientData = {
      fullName: fullName.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      healthInsurance: healthInsurance.trim() || undefined,
      affiliateNumber: affiliateNumber.trim() || undefined,
      sessionPrice: Number(sessionPrice),
      type,
      birthDate: birthDate.trim() || undefined,
      age: !isNaN(parsedAge as number) ? parsedAge : undefined,
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto"
    >
      <div className="bg-surface border border-line rounded-2xl max-w-4xl lg:max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Header */}
        <div className="p-5 sm:px-6 border-b border-line flex items-center justify-between shrink-0 bg-surface rounded-t-2xl">
          <div>
            <h3 id="patient-modal-title" className="font-serif font-bold text-xl text-ink">
              {patientToEdit ? "Editar ficha de paciente" : "Registrar nuevo paciente"}
            </h3>
            <p className="text-sm text-ink-sub mt-0.5">
              Completá los datos personales, encuadre de atención y antecedentes clínicos.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-2 text-ink-sub hover:text-ink hover:bg-bg-base rounded-xl transition-colors cursor-pointer"
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        {/* Form Body (Scrollable, Desktop-first Spacious Grid) */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-7 overflow-y-auto flex-1">
          {/* SECCIÓN 1: Identificación y Contacto */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-line pb-2">
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary-tint text-primary text-xs font-bold font-mono">
                1
              </span>
              <h4 className="text-sm font-bold uppercase tracking-wider text-ink">
                Identificación y Contacto
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Nombre completo */}
              <div className="md:col-span-2">
                <label htmlFor="p-name" className="text-sm font-semibold text-ink block mb-1.5">
                  Nombre completo <span className="text-primary font-bold">*</span>
                </label>
                <input
                  id="p-name"
                  type="text"
                  required
                  placeholder="Ej: Lucía Martínez"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-surface border border-line rounded-lg px-3.5 py-2.5 text-ink placeholder:text-ink-sub/50 focus:outline-none focus:border-primary text-base transition-colors"
                />
              </div>

              {/* Fecha de nacimiento */}
              <div>
                <label htmlFor="p-birth" className="text-sm font-semibold text-ink block mb-1.5">
                  Fecha de nacimiento
                </label>
                <input
                  id="p-birth"
                  type="date"
                  value={birthDate}
                  onChange={(e) => handleBirthDateChange(e.target.value)}
                  className="w-full bg-surface border border-line rounded-lg px-3.5 py-2.5 text-ink focus:outline-none focus:border-primary text-base cursor-pointer transition-colors"
                />
              </div>

              {/* Edad */}
              <div>
                <label htmlFor="p-age" className="text-sm font-semibold text-ink block mb-1.5">
                  Edad <span className="text-xs font-normal text-ink-sub">(años)</span>
                </label>
                <input
                  id="p-age"
                  type="number"
                  min="0"
                  max="125"
                  placeholder={birthDate ? String(calculateAge(birthDate)) : "Ej: 34"}
                  value={age}
                  onChange={(e) => handleAgeChange(e.target.value)}
                  className="w-full bg-surface border border-line rounded-lg px-3.5 py-2.5 text-ink placeholder:text-ink-sub/50 focus:outline-none focus:border-primary text-base transition-colors font-mono"
                />
              </div>

              {/* Teléfono */}
              <div>
                <label htmlFor="p-phone" className="text-sm font-semibold text-ink block mb-1.5">
                  Teléfono
                </label>
                <input
                  id="p-phone"
                  type="text"
                  placeholder="Ej: +54 11 5555-0143"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-surface border border-line rounded-lg px-3.5 py-2.5 text-ink placeholder:text-ink-sub/50 focus:outline-none focus:border-primary text-base transition-colors"
                />
              </div>

              {/* Correo electrónico */}
              <div>
                <label htmlFor="p-email" className="text-sm font-semibold text-ink block mb-1.5">
                  Correo electrónico
                </label>
                <input
                  id="p-email"
                  type="email"
                  placeholder="Ej: paciente@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface border border-line rounded-lg px-3.5 py-2.5 text-ink placeholder:text-ink-sub/50 focus:outline-none focus:border-primary text-base transition-colors"
                />
              </div>

              {/* Domicilio */}
              <div>
                <label htmlFor="p-addr" className="text-sm font-semibold text-ink block mb-1.5">
                  Domicilio
                </label>
                <input
                  id="p-addr"
                  type="text"
                  placeholder="Ej: Av. Santa Fe 1234, CABA"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-surface border border-line rounded-lg px-3.5 py-2.5 text-ink placeholder:text-ink-sub/50 focus:outline-none focus:border-primary text-base transition-colors"
                />
              </div>

              {/* Grupo de atención */}
              <div>
                <label htmlFor="p-type" className="text-sm font-semibold text-ink block mb-1.5">
                  Grupo de atención <span className="text-primary font-bold">*</span>
                </label>
                <select
                  id="p-type"
                  value={type}
                  onChange={(e) => setType(e.target.value as "adult" | "underage")}
                  className="w-full bg-surface border border-line rounded-lg px-3.5 py-2.5 text-ink focus:outline-none focus:border-primary text-base cursor-pointer transition-colors"
                >
                  <option value="adult">Adulto</option>
                  <option value="underage">Infanto-juvenil</option>
                </select>
              </div>
            </div>
          </section>

          {/* SECCIÓN 2: Encuadre Clínico y Aranceles */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-line pb-2">
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary-tint text-primary text-xs font-bold font-mono">
                2
              </span>
              <h4 className="text-sm font-bold uppercase tracking-wider text-ink">
                Encuadre de Atención y Aranceles
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Estado de tratamiento */}
              <div>
                <label htmlFor="p-status" className="text-sm font-semibold text-ink block mb-1.5">
                  Estado de tratamiento <span className="text-primary font-bold">*</span>
                </label>
                <select
                  id="p-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
                  className="w-full bg-surface border border-line rounded-lg px-3.5 py-2.5 text-ink focus:outline-none focus:border-primary text-base cursor-pointer transition-colors"
                >
                  <option value="active">En tratamiento</option>
                  <option value="inactive">De alta</option>
                </select>
              </div>

              {/* Costo de sesión */}
              <div>
                <label htmlFor="p-fee" className="text-sm font-semibold text-ink block mb-1.5">
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
                  className="w-full bg-surface border border-line rounded-lg px-3.5 py-2.5 text-ink font-mono focus:outline-none focus:border-primary text-base transition-colors"
                />
              </div>

              {/* Inicio de consulta */}
              <div>
                <label htmlFor="p-admission" className="text-sm font-semibold text-ink block mb-1.5">
                  Inicio de consulta / Admisión
                </label>
                <input
                  id="p-admission"
                  type="date"
                  value={ceciInicioConsulta}
                  onChange={(e) => setCeciInicioConsulta(e.target.value)}
                  className="w-full bg-surface border border-line rounded-lg px-3.5 py-2.5 text-ink focus:outline-none focus:border-primary text-base cursor-pointer transition-colors"
                />
              </div>

              {/* Obra social o prepaga */}
              <div>
                <label htmlFor="p-insurance" className="text-sm font-semibold text-ink block mb-1.5">
                  Obra social o prepaga
                </label>
                <input
                  id="p-insurance"
                  type="text"
                  placeholder="Ej: OSDE, Swiss Medical, Particular"
                  value={healthInsurance}
                  onChange={(e) => setHealthInsurance(e.target.value)}
                  className="w-full bg-surface border border-line rounded-lg px-3.5 py-2.5 text-ink placeholder:text-ink-sub/50 focus:outline-none focus:border-primary text-base transition-colors"
                />
              </div>

              {/* Número de afiliado / Credencial */}
              <div>
                <label htmlFor="p-affiliate" className="text-sm font-semibold text-ink block mb-1.5">
                  N° de afiliado / Credencial
                </label>
                <input
                  id="p-affiliate"
                  type="text"
                  placeholder="Ej: 123456/01"
                  value={affiliateNumber}
                  onChange={(e) => setAffiliateNumber(e.target.value)}
                  className="w-full bg-surface border border-line rounded-lg px-3.5 py-2.5 text-ink placeholder:text-ink-sub/50 focus:outline-none focus:border-primary text-base transition-colors"
                />
              </div>

              {/* Día y horario habitual */}
              <div>
                <label htmlFor="p-habitual-slot" className="text-sm font-semibold text-ink block mb-1.5">
                  Día y horario habitual
                </label>
                <input
                  id="p-habitual-slot"
                  type="text"
                  placeholder="Ej: Martes 15:00 hs"
                  value={ceciDiaHorarioAtencion}
                  onChange={(e) => setCeciDiaHorarioAtencion(e.target.value)}
                  className="w-full bg-surface border border-line rounded-lg px-3.5 py-2.5 text-ink placeholder:text-ink-sub/50 focus:outline-none focus:border-primary text-base transition-colors"
                />
              </div>

              {/* Frecuencia sugerida */}
              <div>
                <label htmlFor="p-frequency" className="text-sm font-semibold text-ink block mb-1.5">
                  Frecuencia sugerida
                </label>
                <input
                  id="p-frequency"
                  type="text"
                  placeholder="Ej: Semanal, Quincenal"
                  value={ceciFrecuenciaTratamiento}
                  onChange={(e) => setCeciFrecuenciaTratamiento(e.target.value)}
                  className="w-full bg-surface border border-line rounded-lg px-3.5 py-2.5 text-ink placeholder:text-ink-sub/50 focus:outline-none focus:border-primary text-base transition-colors"
                />
              </div>
            </div>
          </section>

          {/* SECCIÓN 3: Contexto Personal y Antecedentes (Unificado) */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-line pb-2">
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary-tint text-primary text-xs font-bold font-mono">
                3
              </span>
              <h4 className="text-sm font-bold uppercase tracking-wider text-ink">
                Contexto Personal y Antecedentes
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Convive con */}
              <div>
                <label htmlFor="p-convive" className="text-sm font-semibold text-ink block mb-1.5">
                  Convive con
                </label>
                <input
                  id="p-convive"
                  type="text"
                  value={ceciConviveCon}
                  onChange={(e) => setCeciConviveCon(e.target.value)}
                  placeholder="Ej: Pareja e hijos..."
                  className="w-full bg-surface border border-line rounded-lg px-3.5 py-2.5 text-ink placeholder:text-ink-sub/50 focus:outline-none focus:border-primary text-base transition-colors"
                />
              </div>

              {/* Ocupación */}
              <div>
                <label htmlFor="p-occupation" className="text-sm font-semibold text-ink block mb-1.5">
                  Ocupación
                </label>
                <input
                  id="p-occupation"
                  type="text"
                  value={ceciOcupacion}
                  onChange={(e) => setCeciOcupacion(e.target.value)}
                  placeholder="Ej: Docente, Diseñador..."
                  className="w-full bg-surface border border-line rounded-lg px-3.5 py-2.5 text-ink placeholder:text-ink-sub/50 focus:outline-none focus:border-primary text-base transition-colors"
                />
              </div>

              {/* Estudios */}
              <div>
                <label htmlFor="p-studies" className="text-sm font-semibold text-ink block mb-1.5">
                  Nivel de estudios
                </label>
                <input
                  id="p-studies"
                  type="text"
                  value={ceciEstudios}
                  onChange={(e) => setCeciEstudios(e.target.value)}
                  placeholder="Ej: Universitario completo..."
                  className="w-full bg-surface border border-line rounded-lg px-3.5 py-2.5 text-ink placeholder:text-ink-sub/50 focus:outline-none focus:border-primary text-base transition-colors"
                />
              </div>

              {/* Estructura familiar */}
              <div className="md:col-span-3 lg:col-span-1">
                <label htmlFor="p-family" className="text-sm font-semibold text-ink block mb-1.5">
                  Estructura familiar y vínculos
                </label>
                <textarea
                  id="p-family"
                  value={ceciFamilia}
                  onChange={(e) => setCeciFamilia(e.target.value)}
                  placeholder="Composición familiar, figuras de apoyo..."
                  rows={3}
                  className="w-full bg-surface border border-line rounded-lg px-3.5 py-2.5 text-ink placeholder:text-ink-sub/50 focus:outline-none focus:border-primary text-base transition-colors resize-y"
                />
              </div>

              {/* Tratamientos anteriores */}
              <div className="md:col-span-3 lg:col-span-2">
                <label htmlFor="p-prev-treatment" className="text-sm font-semibold text-ink block mb-1.5">
                  Tratamientos psicológicos anteriores
                </label>
                <textarea
                  id="p-prev-treatment"
                  value={ceciTratamientosAnteriores}
                  onChange={(e) => setCeciTratamientosAnteriores(e.target.value)}
                  placeholder="Detalle de consultas, terapias o medicación previas..."
                  rows={3}
                  className="w-full bg-surface border border-line rounded-lg px-3.5 py-2.5 text-ink placeholder:text-ink-sub/50 focus:outline-none focus:border-primary text-base transition-colors resize-y"
                />
              </div>

              {/* Datos adicionales y observaciones */}
              <div className="md:col-span-3">
                <label htmlFor="p-extra-notes" className="text-sm font-semibold text-ink block mb-1.5">
                  Observaciones clínicas y motivo de consulta inicial
                </label>
                <textarea
                  id="p-extra-notes"
                  value={ceciDatosAdicionales}
                  onChange={(e) => setCeciDatosAdicionales(e.target.value)}
                  placeholder="Notas adicionales relevantes para la admisión..."
                  rows={3}
                  className="w-full bg-surface border border-line rounded-lg px-3.5 py-2.5 text-ink placeholder:text-ink-sub/50 focus:outline-none focus:border-primary text-base transition-colors resize-y"
                />
              </div>
            </div>
          </section>

          {/* Footer Sticky/Bottom */}
          <div className="pt-4 border-t border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-sm text-ink-sub">
              Los campos con <span className="text-primary font-bold">*</span> son obligatorios.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-semibold text-ink-sub hover:text-ink hover:bg-bg-base rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-surface text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {patientToEdit ? "Guardar cambios" : "Guardar paciente"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
