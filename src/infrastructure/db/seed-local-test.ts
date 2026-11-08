import { container } from "../container";
import { Patient } from "../../domain/patient.types";
import { Session } from "../../domain/session.types";
import { ExtraNote } from "../../domain/extra-note.types";

export const LOCAL_TEST_PATIENT_UUID = "patient-prueba-local-axel";

/**
 * Injects a local test patient with rich clinical history, highlights, and extra notes
 * exclusively into the current browser's local IndexedDB.
 * Completely isolated from other sessions and never executed on production or client devices.
 */
export async function seedLocalTestPatient(): Promise<void> {
  const patientRepo = container.getPatientRepository();
  const sessionRepo = container.getSessionRepository();
  const extraNoteRepo = container.getExtraNoteRepository();

  const now = new Date().toISOString();

  const testPatient: Patient = {
    uuid: LOCAL_TEST_PATIENT_UUID,
    fullName: "Axel Paciente (Prueba Local)",
    type: "adult",
    birthDate: "1992-08-14",
    healthInsurance: "OSDE 310",
    affiliateNumber: "889900-01",
    phone: "11-4567-8901",
    email: "axel.prueba@consultorio.local",
    address: "Av. Corrientes 1500, CABA",
    ceciConviveCon: "Solo",
    ceciFamilia: "Vínculo fluido con padres y hermanos",
    ceciOcupacion: "Desarrollo de software",
    ceciEstudios: "Universitarios completos",
    ceciTratamientosAnteriores: "Terapia previa en 2022 durante 6 meses",
    ceciInicioConsulta: "01 de Noviembre de 2026",
    ceciDiaHorarioAtencion: "Jueves 17:00 hs",
    ceciFrecuenciaTratamiento: "Semanal",
    ceciDatosAdicionales: "Paciente de prueba para verificar exportación en LibreOffice y visualización.",
    sessionPrice: 28000,
    createdAt: now,
    updatedAt: now,
  };

  await patientRepo.save(testPatient);

  const session1: Session = {
    uuid: "session-prueba-axel-1",
    patientUuid: LOCAL_TEST_PATIENT_UUID,
    dateTime: "2026-11-01T17:00:00.000Z",
    status: "completed",
    priceAtSession: 28000,
    colorTag: "indigo",
    description: "Primera entrevista y encuadre clínico",
    notes: '<p><strong>Entrevista inicial y apertura clínica:</strong></p><p>El paciente consulta para revisar la gestión de tiempos y <mark data-color="#FFF275">momentos de sobrecarga laboral</mark>.</p><p>Se trabaja sobre las expectativas del espacio. <mark data-color="#B3E5BE">Buena articulación discursiva y compromiso con el encuadre.</mark></p>',
    createdAt: now,
    updatedAt: now,
  };

  const session2: Session = {
    uuid: "session-prueba-axel-2",
    patientUuid: LOCAL_TEST_PATIENT_UUID,
    dateTime: "2026-11-08T17:00:00.000Z",
    status: "completed",
    priceAtSession: 28000,
    colorTag: "rose",
    description: "Evolución y registro de hábitos",
    notes: '<p><strong>Segunda sesión terapéutica:</strong></p><p>Se revisan los registros de la semana. Refiere mejoría en los descansos diurnos. <mark data-color="#E6C8E8">Se analizan exigencias internas vinculadas a la productividad constante.</mark></p>',
    createdAt: now,
    updatedAt: now,
  };

  await sessionRepo.save(session1);
  await sessionRepo.save(session2);

  const extraNote: ExtraNote = {
    uuid: "note-prueba-axel-1",
    patientUuid: LOCAL_TEST_PATIENT_UUID,
    content: '<p><strong>Anotaciones Clínicas Extras para Supervisión:</strong></p><p>Observar si emergen defensas intelectualizadas al abordar el malestar.</p><p><mark data-color="#FFE0B2">Próximo paso:</mark> Chequear el impacto del descanso en la concentración cotidiana.</p>',
    tags: ["supervision"],
    isPinned: false,
    createdAt: now,
    updatedAt: now,
  };

  await extraNoteRepo.save(extraNote);
}
