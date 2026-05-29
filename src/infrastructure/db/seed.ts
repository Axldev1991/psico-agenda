import { db } from './dexie.db';
import { Patient } from '../../domain/patient.types';
import { Session } from '../../domain/session.types';

export async function seedDemoData() {
  // 1. Pacientes de Demostración con Historias Clínicas Consolidadas (HTML WYSIWYG)
  const demoPatients: Patient[] = [
    {
      uuid: 'patient-demo-1',
      fullName: 'María Florencia González',
      email: 'florencia.gonzalez@gmail.com',
      phone: '+54 11 5829-1022',
      address: 'Av. Santa Fe 3420, CABA',
      healthInsurance: 'OSDE',
      affiliateNumber: '3-1022394-02',
      sessionPrice: 12000,
      clinicalHistory: `
        <h3 id="session-session-demo-1c" style="color: #4f46e5; margin-top: 24px; margin-bottom: 8px; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; font-family: sans-serif;">📅 Sesión N° 3 — Viernes, 22 de Mayo de 2026, 01:00 P. M.</h3>
        <p style="margin-top: 4px; color: #64748b; font-size: 10px;">Estado: Atendido</p>
        <div style="font-family: sans-serif; font-size: 11pt; line-height: 1.6; color: #334155;">
          La paciente implementó límites asertivos con sus supervisores respecto a tareas fuera del horario laboral. Refiere disminución significativa de las palpitaciones diarias y un nivel de ansiedad basal moderado.<br/><br/>
          <strong>Estrategia Terapéutica:</strong><br/>
          - Consolidación de técnicas asertivas.<br/>
          - Roleplaying de conversaciones complejas pendientes en el ámbito familiar.
        </div>
        <br/>
        <h3 id="session-session-demo-1b" style="color: #4f46e5; margin-top: 24px; margin-bottom: 8px; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; font-family: sans-serif;">📅 Sesión N° 2 — Viernes, 15 de Mayo de 2026, 01:00 P. M.</h3>
        <p style="margin-top: 4px; color: #64748b; font-size: 10px;">Estado: Atendido</p>
        <div style="font-family: sans-serif; font-size: 11pt; line-height: 1.6; color: #334155;">
          Se revisa el registro de pensamientos. Aparecen esquemas de autoexigencia elevados ("Tengo que hacerlo perfecto o soy un fracaso"). Refiere mejoría parcial en el descanso tras aplicar la higiene de sueño.<br/><br/>
          <strong>Estrategia Terapéutica:</strong><br/>
          - <span style="background-color: #fef08a;">Reestructuración cognitiva</span> enfocada en el perfeccionamiento desadaptativo.<br/>
          - Ejercicios de respiración diafragmática pausada durante la jornada laboral.
        </div>
        <br/>
        <h3 id="session-session-demo-1a" style="color: #4f46e5; margin-top: 24px; margin-bottom: 8px; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; font-family: sans-serif;">📅 Sesión N° 1 — Viernes, 8 de Mayo de 2026, 01:00 P. M.</h3>
        <p style="margin-top: 4px; color: #64748b; font-size: 10px;">Estado: Atendido</p>
        <div style="font-family: sans-serif; font-size: 11pt; line-height: 1.6; color: #334155;">
          La paciente acude a consulta refiriendo síntomas persistentes de ansiedad vinculados a su entorno laboral. Describe insomnio de conciliación, palpitaciones ocasionales ante entregas de proyectos y tensión muscular generalizada.<br/><br/>
          <strong>Estrategia Terapéutica:</strong><br/>
          - Psicoeducación sobre la respuesta de estrés.<br/>
          - Planificación de rutinas de desactivación fisiológica nocturna.<br/>
          - Registro conductual de pensamientos automáticos disfuncionales.
        </div>
      `,
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      uuid: 'patient-demo-2',
      fullName: 'Juan Ignacio Rodríguez',
      email: 'juani.rodriguez@outlook.com.ar',
      phone: '+54 341 629-8811',
      address: 'Bv. Oroño 1240, Rosario',
      healthInsurance: 'Swiss Medical',
      affiliateNumber: 'SM-9923849',
      sessionPrice: 14000,
      clinicalHistory: `
        <h3 id="session-session-demo-2b" style="color: #4f46e5; margin-top: 24px; margin-bottom: 8px; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; font-family: sans-serif;">📅 Sesión N° 2 — Jueves, 21 de Mayo de 2026, 06:00 P. M.</h3>
        <p style="margin-top: 4px; color: #64748b; font-size: 10px;">Estado: Atendido</p>
        <div style="font-family: sans-serif; font-size: 11pt; line-height: 1.6; color: #334155;">
          Abordamos los sentimientos de culpa no resueltos respecto a no haber pasado suficiente tiempo con su padre en la última etapa. El paciente se muestra receptivo y con buena alianza terapéutica.<br/><br/>
          <strong>Estrategia Terapéutica:</strong><br/>
          - <span style="background-color: #e9d5ff;">Ejercicio gestáltico de la silla vacía</span> para elaboración simbólica y despedida.<br/>
          - Fomento de la red de apoyo social activa.
        </div>
        <br/>
        <h3 id="session-session-demo-2a" style="color: #4f46e5; margin-top: 24px; margin-bottom: 8px; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; font-family: sans-serif;">📅 Sesión N° 1 — Jueves, 14 de Mayo de 2026, 06:00 P. M.</h3>
        <p style="margin-top: 4px; color: #64748b; font-size: 10px;">Estado: Atendido</p>
        <div style="font-family: sans-serif; font-size: 11pt; line-height: 1.6; color: #334155;">
          El paciente consulta motivado por un proceso de duelo reciente (fallecimiento del padre hace 4 meses). Expresa anhedonia, llanto fácil recurrente ante estímulos específicos y sensación de vacío existencial.<br/><br/>
          <strong>Estrategia Terapéutica:</strong><br/>
          - Facilitación de la expresión emocional y contención afectiva.<br/>
          - Validación del dolor y normalización de las etapas del duelo.
        </div>
      `,
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      uuid: 'patient-demo-3',
      fullName: 'Sofía Milagros Bianchi',
      email: 'sofia.bianchi@yahoo.com.ar',
      phone: '+54 261 498-3322',
      address: 'Arístides Villanueva 450, Mendoza',
      healthInsurance: 'Particular',
      affiliateNumber: '',
      sessionPrice: 16000,
      clinicalHistory: `
        <h3 id="session-session-demo-3a" style="color: #4f46e5; margin-top: 24px; margin-bottom: 8px; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; font-family: sans-serif;">📅 Sesión N° 1 — Martes, 19 de Mayo de 2026, 03:00 P. M.</h3>
        <p style="margin-top: 4px; color: #64748b; font-size: 10px;">Estado: Atendido</p>
        <div style="font-family: sans-serif; font-size: 11pt; line-height: 1.6; color: #334155;">
          Sofía presenta dificultades de vinculación con pares académicos. Describe inhibición conductual y pensamientos de autocrítica rigurosa ("Voy a quedar en ridículo").<br/><br/>
          <strong>Estrategia Terapéutica:</strong><br/>
          - Análisis de situaciones temidas y ordenación en una jerarquía de exposición asincrónica.<br/>
          - Entrenamiento elemental en asertividad social.
        </div>
      `,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      uuid: 'patient-demo-4',
      fullName: 'Lucas Emmanuel Peralta',
      email: 'lucas.peralta@gmail.com',
      phone: '+54 351 772-9104',
      address: 'Duarte Quirós 1800, Córdoba',
      healthInsurance: 'Galeno',
      affiliateNumber: 'GAL-440239-1',
      sessionPrice: 11000,
      clinicalHistory: `
        <h3 id="session-session-demo-4c" style="color: #4f46e5; margin-top: 24px; margin-bottom: 8px; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; font-family: sans-serif;">📅 Sesión N° 3 — Miércoles, 13 de Mayo de 2026, 10:00 A. M.</h3>
        <p style="margin-top: 4px; color: #64748b; font-size: 10px;">Estado: Atendido</p>
        <div style="font-family: sans-serif; font-size: 11pt; line-height: 1.6; color: #334155;">
          El paciente logró cumplir con el 70% de las metas programadas en el plan de activación conductual. Refiere sentirse con mayor energía y mejor estado de ánimo.<br/><br/>
          <strong>Estrategia Terapéutica:</strong><br/>
          - Consolidación del programa y aumento gradual de la complejidad de actividades.<br/>
          - Prevención preliminar de recaídas.
        </div>
        <br/>
        <h3 id="session-session-demo-4b" style="color: #4f46e5; margin-top: 24px; margin-bottom: 8px; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; font-family: sans-serif;">📅 Sesión N° 2 — Miércoles, 6 de Mayo de 2026, 10:00 A. M.</h3>
        <p style="margin-top: 4px; color: #64748b; font-size: 10px;">Estado: Cancelado</p>
        <div style="font-family: sans-serif; font-size: 11pt; line-height: 1.6; color: #334155;">
          El paciente avisa con 24 horas de antelación que debe ausentarse por examen universitario. Se reprograma el turno recurrente sin cargo adicional.
        </div>
        <br/>
        <h3 id="session-session-demo-4a" style="color: #4f46e5; margin-top: 24px; margin-bottom: 8px; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; font-family: sans-serif;">📅 Sesión N° 1 — Miércoles, 29 de Abril de 2026, 10:00 A. M.</h3>
        <p style="margin-top: 4px; color: #64748b; font-size: 10px;">Estado: Atendido</p>
        <div style="font-family: sans-serif; font-size: 11pt; line-height: 1.6; color: #334155;">
          Lucas refiere abulia generalizada, cansancio diurno permanente y abandono progresivo de actividades recreativas habituales (ej. fútbol semanal).<br/><br/>
          <strong>Estrategia Terapéutica:</strong><br/>
          - Activación conductual programando actividades de agrado mínimo.<br/>
          - Control de higiene del sueño y derivación optativa a interconsulta clínica.
        </div>
      `,
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      uuid: 'patient-demo-5',
      fullName: 'Camila Belén Fernández',
      email: 'camila.fernandez@icloud.com',
      phone: '+54 11 3004-9210',
      address: 'Scalabrini Ortiz 1540, CABA',
      healthInsurance: 'Particular',
      affiliateNumber: '',
      sessionPrice: 15000,
      clinicalHistory: `
        <h3 id="session-session-demo-5a" style="color: #4f46e5; margin-top: 24px; margin-bottom: 8px; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; font-family: sans-serif;">📅 Sesión N° 1 — Miércoles, 20 de Mayo de 2026, 04:00 P. M.</h3>
        <p style="margin-top: 4px; color: #64748b; font-size: 10px;">Estado: Atendido</p>
        <div style="font-family: sans-serif; font-size: 11pt; line-height: 1.6; color: #334155;">
          Entrevista de admisión clínica. Camila refiere dificultades adaptativas tras mudanza reciente a Capital Federal. Expresa soledad e insomnio transitorio.
        </div>
      `,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];

  // 2. Historial de Sesiones Físicas y Excepciones para mantener sincronismo del calendario
  const demoSessions: Session[] = [
    {
      uuid: 'session-demo-1a',
      patientUuid: 'patient-demo-1',
      dateTime: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T16:00:00.000Z',
      status: 'completed',
      priceAtSession: 12000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      uuid: 'session-demo-1b',
      patientUuid: 'patient-demo-1',
      dateTime: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T16:00:00.000Z',
      status: 'completed',
      priceAtSession: 12000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      uuid: 'session-demo-1c',
      patientUuid: 'patient-demo-1',
      dateTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T16:00:00.000Z',
      status: 'completed',
      priceAtSession: 12000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      uuid: 'session-demo-2a',
      patientUuid: 'patient-demo-2',
      dateTime: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T18:00:00.000Z',
      status: 'completed',
      priceAtSession: 14000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      uuid: 'session-demo-2b',
      patientUuid: 'patient-demo-2',
      dateTime: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T18:00:00.000Z',
      status: 'completed',
      priceAtSession: 14000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      uuid: 'session-demo-3a',
      patientUuid: 'patient-demo-3',
      dateTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T15:00:00.000Z',
      status: 'completed',
      priceAtSession: 16000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      uuid: 'session-demo-4a',
      patientUuid: 'patient-demo-4',
      dateTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T10:00:00.000Z',
      status: 'completed',
      priceAtSession: 11000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      uuid: 'session-demo-4b',
      patientUuid: 'patient-demo-4',
      dateTime: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T10:00:00.000Z',
      status: 'cancelled',
      priceAtSession: 11000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      uuid: 'session-demo-4c',
      patientUuid: 'patient-demo-4',
      dateTime: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T10:00:00.000Z',
      status: 'completed',
      priceAtSession: 11000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];

  // 3. Escribir masivamente en IndexedDB
  await db.patients.bulkPut(demoPatients);
  await db.sessions.bulkPut(demoSessions);
}
