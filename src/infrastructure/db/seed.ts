import { db } from './dexie.db';
import { Patient } from '../../domain/patient.types';
import { Session } from '../../domain/session.types';

export async function seedDemoData() {
  // 1. Pacientes de Demostración Realistas (Nombres, Obras Sociales y Precios en Pesos Argentinos)
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
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // Hace 60 días
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
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
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
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
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
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
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];

  // 2. Historial de Sesiones Físicas y Evoluciones Clínicas (Notas Markdown Realistas)
  const demoSessions: Session[] = [
    // Paciente 1: Florencia González (Ansiedad por sobrecarga laboral)
    {
      uuid: 'session-demo-1a',
      patientUuid: 'patient-demo-1',
      dateTime: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T16:00:00.000Z',
      status: 'completed',
      priceAtSession: 12000,
      notes: `## EVOLUCIÓN CLÍNICA\n**Fecha:** Sesión Inicial | **Paciente:** María Florencia González\n\n**Motivo de consulta / Evolución:**\nLa paciente acude a consulta refiriendo síntomas persistentes de ansiedad vinculados a su entorno laboral. Describe insomnio de conciliación, palpitaciones ocasionales ante entregas de proyectos y tensión muscular generalizada.\n\n**Estrategia Terapéutica:**\n- Psicoeducación sobre la respuesta de estrés.\n- Planificación de rutinas de desactivación fisiológica nocturna.\n- Registro conductual de pensamientos automáticos disfuncionales.`,
      createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      uuid: 'session-demo-1b',
      patientUuid: 'patient-demo-1',
      dateTime: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T16:00:00.000Z',
      status: 'completed',
      priceAtSession: 12000,
      notes: `## EVOLUCIÓN CLÍNICA\n**Fecha:** Segunda Sesión | **Paciente:** María Florencia González\n\n**Motivo de consulta / Evolución:**\nSe revisa el registro de pensamientos. Aparecen esquemas de autoexigencia elevados ("Tengo que hacerlo perfecto o soy un fracaso"). Refiere mejoría parcial en el descanso tras aplicar la higiene de sueño.\n\n**Estrategia Terapéutica:**\n- Reestructuración cognitiva enfocada en el perfeccionamiento desadaptativo.\n- Ejercicios de respiración diafragmática pausada durante la jornada laboral.`,
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      uuid: 'session-demo-1c',
      patientUuid: 'patient-demo-1',
      dateTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T16:00:00.000Z',
      status: 'completed',
      priceAtSession: 12000,
      notes: `## EVOLUCIÓN CLÍNICA\n**Fecha:** Tercera Sesión | **Paciente:** María Florencia González\n\n**Motivo de consulta / Evolución:**\nLa paciente implementó límites asertivos con sus supervisores respecto a tareas fuera del horario laboral. Refiere disminución significativa de las palpitaciones diarias y un nivel de ansiedad basal moderado.\n\n**Estrategia Terapéutica:**\n- Consolidación de técnicas asertivas.\n- Roleplaying de conversaciones complejas pendientes en el ámbito familiar.`,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },

    // Paciente 2: Juan Ignacio (Duelo y reorganización familiar)
    {
      uuid: 'session-demo-2a',
      patientUuid: 'patient-demo-2',
      dateTime: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T18:00:00.000Z',
      status: 'completed',
      priceAtSession: 14000,
      notes: `## EVOLUCIÓN CLÍNICA\n**Fecha:** Primera Sesión | **Paciente:** Juan Ignacio Rodríguez\n\n**Motivo de consulta / Evolución:**\nEl paciente consulta motivado por un proceso de duelo reciente (fallecimiento del padre hace 4 meses). Expresa anhedonia, llanto fácil recurrente ante estímulos específicos y sensación de vacío existencial.\n\n**Estrategia Terapéutica:**\n- Facilitación de la expresión emocional y contención afectiva.\n- Validación del dolor y normalización de las etapas del duelo.`,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      uuid: 'session-demo-2b',
      patientUuid: 'patient-demo-2',
      dateTime: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T18:00:00.000Z',
      status: 'completed',
      priceAtSession: 14000,
      notes: `## EVOLUCIÓN CLÍNICA\n**Fecha:** Segunda Sesión | **Paciente:** Juan Ignacio Rodríguez\n\n**Motivo de consulta / Evolución:**\nAbordamos los sentimientos de culpa no resueltos respecto a no haber pasado suficiente tiempo con su padre en la última etapa. El paciente se muestra receptivo y con buena alianza terapéutica.\n\n**Estrategia Terapéutica:**\n- Ejercicio gestáltico de la silla vacía para elaboración simbólica y despedida.\n- Fomento de la red de apoyo social activa.`,
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    },

    // Paciente 3: Sofía Bianchi (Habilidades sociales e introversión)
    {
      uuid: 'session-demo-3a',
      patientUuid: 'patient-demo-3',
      dateTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T15:00:00.000Z',
      status: 'completed',
      priceAtSession: 16000,
      notes: `## EVOLUCIÓN CLÍNICA\n**Fecha:** Sesión Diagnóstica | **Paciente:** Sofía Milagros Bianchi\n\n**Motivo de consulta / Evolución:**\nSofía presenta dificultades de vinculación con pares académicos. Describe inhibición conductual y pensamientos de autocrítica rigurosa ("Voy a quedar en ridículo").\n\n**Estrategia Terapéutica:**\n- Análisis de situaciones temidas y ordenación en una jerarquía de exposición asincrónica.\n- Entrenamiento elemental en asertividad social.`,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },

    // Paciente 4: Lucas Peralta (Trastorno del ánimo moderado)
    {
      uuid: 'session-demo-4a',
      patientUuid: 'patient-demo-4',
      dateTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T10:00:00.000Z',
      status: 'completed',
      priceAtSession: 11000,
      notes: `## EVOLUCIÓN CLÍNICA\n**Fecha:** Sesión de Diagnóstico | **Paciente:** Lucas Emmanuel Peralta\n\n**Motivo de consulta / Evolución:**\nLucas refiere abulia generalizada, cansancio diurno permanente y abandono progresivo de actividades recreativas habituales (ej. fútbol semanal).\n\n**Estrategia Terapéutica:**\n- Activación conductual programando actividades de agrado mínimo.\n- Control de higiene del sueño y derivación optativa a interconsulta clínica.`,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      uuid: 'session-demo-4b',
      patientUuid: 'patient-demo-4',
      dateTime: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T10:00:00.000Z',
      status: 'cancelled', // Excepción cancelada
      priceAtSession: 11000,
      notes: `El paciente avisa con 24 horas de antelación que debe ausentarse por examen universitario. Se reprograma el turno recurrente sin cargo adicional.`,
      createdAt: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      uuid: 'session-demo-4c',
      patientUuid: 'patient-demo-4',
      dateTime: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T10:00:00.000Z',
      status: 'completed',
      priceAtSession: 11000,
      notes: `## EVOLUCIÓN CLÍNICA\n**Fecha:** Sesión de Seguimiento | **Paciente:** Lucas Emmanuel Peralta\n\n**Motivo de consulta / Evolución:**\nEl paciente logró cumplir con el 70% de las metas programadas en el plan de activación conductual. Refiere sentirse con mayor energía y mejor estado de ánimo.\n\n**Estrategia Terapéutica:**\n- Consolidación del programa y aumento gradual de la complejidad de actividades.\n- Prevención preliminar de recaídas.`,
      createdAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ];

  // 3. Escribir masivamente en IndexedDB
  await db.patients.bulkPut(demoPatients);
  await db.sessions.bulkPut(demoSessions);
}
