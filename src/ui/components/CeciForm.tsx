import { Patient } from "../../domain/patient.types";

interface CeciFormProps {
  patient: Patient;
  handleCeciChange: (key: string, value: string) => void;
}

export function CeciForm({ patient, handleCeciChange }: CeciFormProps) {
  return (
    <div className="bg-white border border-brand-sand rounded-b-3xl p-6 md:p-8 shadow-md max-h-[75vh] overflow-y-auto space-y-6">
      <div>
        <h3 className="font-title font-bold text-base text-text-main">📋 Ficha del Paciente (CECI)</h3>
        <p className="text-[10px] text-text-sub font-semibold mt-0.5">Marco y variables clínicas estructuradas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <div className="md:col-span-2">
          <label className="text-xs text-text-sub font-bold block mb-1">Convive Con</label>
          <input
            type="text"
            value={patient.ceciConviveCon || ""}
            onChange={(e) => handleCeciChange("ceciConviveCon", e.target.value)}
            placeholder="Ej: Padres y un hermano menor..."
            className="w-full bg-bg-base border border-brand-sand rounded-xl px-4 py-2 text-text-main placeholder:text-text-sub/30 focus:outline-none focus:border-brand-indigo focus:ring-1 focus:ring-brand-indigo text-xs cursor-pointer"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-xs text-text-sub font-bold block mb-1">Familia (Estructura familiar)</label>
          <textarea
            value={patient.ceciFamilia || ""}
            onChange={(e) => handleCeciChange("ceciFamilia", e.target.value)}
            placeholder="Describa la composición y dinámica familiar..."
            className="w-full bg-bg-base border border-brand-sand rounded-xl px-4 py-2 text-text-main placeholder:text-text-sub/30 focus:outline-none focus:border-brand-indigo focus:ring-1 focus:ring-brand-indigo text-xs cursor-pointer h-20"
          />
        </div>

        <div>
          <label className="text-xs text-text-sub font-bold block mb-1">Ocupación</label>
          <input
            type="text"
            value={patient.ceciOcupacion || ""}
            onChange={(e) => handleCeciChange("ceciOcupacion", e.target.value)}
            placeholder="Ej: Profesional independiente, Estudiante..."
            className="w-full bg-bg-base border border-brand-sand rounded-xl px-4 py-2 text-text-main placeholder:text-text-sub/30 focus:outline-none focus:border-brand-indigo focus:ring-1 focus:ring-brand-indigo text-xs cursor-pointer"
          />
        </div>

        <div>
          <label className="text-xs text-text-sub font-bold block mb-1">Estudios</label>
          <input
            type="text"
            value={patient.ceciEstudios || ""}
            onChange={(e) => handleCeciChange("ceciEstudios", e.target.value)}
            placeholder="Ej: Universitario en curso, Primario..."
            className="w-full bg-bg-base border border-brand-sand rounded-xl px-4 py-2 text-text-main placeholder:text-text-sub/30 focus:outline-none focus:border-brand-indigo focus:ring-1 focus:ring-brand-indigo text-xs cursor-pointer"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-xs text-text-sub font-bold block mb-1">Tratamientos Anteriores</label>
          <textarea
            value={patient.ceciTratamientosAnteriores || ""}
            onChange={(e) => handleCeciChange("ceciTratamientosAnteriores", e.target.value)}
            placeholder="Detalle tratamientos psicológicos o psiquiátricos previos..."
            className="w-full bg-bg-base border border-brand-sand rounded-xl px-4 py-2 text-text-main placeholder:text-text-sub/30 focus:outline-none focus:border-brand-indigo focus:ring-1 focus:ring-brand-indigo text-xs cursor-pointer h-20"
          />
        </div>

        <div>
          <label className="text-xs text-text-sub font-bold block mb-1">Inicio de Consulta</label>
          <input
            type="date"
            value={patient.ceciInicioConsulta || ""}
            onChange={(e) => handleCeciChange("ceciInicioConsulta", e.target.value)}
            className="w-full bg-bg-base border border-brand-sand rounded-xl px-4 py-2 text-text-main focus:outline-none focus:border-brand-indigo focus:ring-1 focus:ring-brand-indigo text-xs cursor-pointer"
          />
        </div>

        <div>
          <label className="text-xs text-text-sub font-bold block mb-1">Día y Horario de Atención</label>
          <input
            type="text"
            value={patient.ceciDiaHorarioAtencion || ""}
            onChange={(e) => handleCeciChange("ceciDiaHorarioAtencion", e.target.value)}
            placeholder="Ej: Miércoles 16:00 hs..."
            className="w-full bg-bg-base border border-brand-sand rounded-xl px-4 py-2 text-text-main placeholder:text-text-sub/30 focus:outline-none focus:border-brand-indigo focus:ring-1 focus:ring-brand-indigo text-xs cursor-pointer"
          />
        </div>

        <div>
          <label className="text-xs text-text-sub font-bold block mb-1">Frecuencia del Tratamiento</label>
          <input
            type="text"
            value={patient.ceciFrecuenciaTratamiento || ""}
            onChange={(e) => handleCeciChange("ceciFrecuenciaTratamiento", e.target.value)}
            placeholder="Ej: Semanal, Quincenal..."
            className="w-full bg-bg-base border border-brand-sand rounded-xl px-4 py-2 text-text-main placeholder:text-text-sub/30 focus:outline-none focus:border-brand-indigo focus:ring-1 focus:ring-brand-indigo text-xs cursor-pointer"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-xs text-text-sub font-bold block mb-1">Datos Adicionales / Notas</label>
          <textarea
            value={patient.ceciDatosAdicionales || ""}
            onChange={(e) => handleCeciChange("ceciDatosAdicionales", e.target.value)}
            placeholder="Notas adicionales relevantes para la admisión..."
            className="w-full bg-bg-base border border-brand-sand rounded-xl px-4 py-2 text-text-main placeholder:text-text-sub/30 focus:outline-none focus:border-brand-indigo focus:ring-1 focus:ring-brand-indigo text-xs cursor-pointer h-20"
          />
        </div>
      </div>
    </div>
  );
}
