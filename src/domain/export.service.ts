import { Patient } from './patient.types';
import { Session } from './session.types';

const INK = '#1E2A32';       // texto principal
const INK_2 = '#566670';     // texto secundario
const RULE = '#B8C4C8';      // líneas finas de separación
const PRIMARY = '#2C5F6B';   // acento petróleo
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "Calibri, 'Segoe UI', Arial, sans-serif";

function escapeHtml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function parseNotesToHtml(notes?: string): string {
  if (!notes) return `<p style="margin: 0; color: ${INK_2}; font-style: italic;">Sin anotaciones clínicas.</p>`;
  if (notes.trim().startsWith('<') || /<[a-z][\s\S]*>/i.test(notes)) {
    return notes;
  }
  return escapeHtml(notes)
    .replace(/\n/g, '<br/>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/## (.*?)(<br\/>|$)/g, `<h2 style="font-family: ${SERIF}; font-size: 13pt; color: ${PRIMARY}; margin-top: 14pt; margin-bottom: 4pt; border-bottom: 1pt solid ${RULE}; padding-bottom: 2pt;">$1</h2>`)
    .replace(/# (.*?)(<br\/>|$)/g, `<h1 style="font-family: ${SERIF}; font-size: 15pt; color: ${INK}; margin-top: 18pt; margin-bottom: 6pt;">$1</h1>`);
}

function coverageText(healthInsurance?: string, affiliateNumber?: string): string {
  const os = healthInsurance?.trim();
  const num = affiliateNumber?.trim();
  if (os && num) return `${escapeHtml(os)} · N° ${escapeHtml(num)}`;
  if (os) return escapeHtml(os);
  return 'Particular';
}

export function generateClinicalHistoryDocument(patient: Patient, sessions: Session[]): string {
  const sortedSessions = [...sessions].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  const fullName = escapeHtml(patient.fullName);
  const birthDate = escapeHtml(patient.birthDate || 'No registrada');

  const ceciItems = [
    { label: 'Convive con', value: patient.ceciConviveCon },
    { label: 'Familia', value: patient.ceciFamilia },
    { label: 'Ocupación', value: patient.ceciOcupacion },
    { label: 'Estudios', value: patient.ceciEstudios },
    { label: 'Tratamientos Anteriores', value: patient.ceciTratamientosAnteriores },
    { label: 'Inicio de Consulta', value: patient.ceciInicioConsulta },
    { label: 'Día y Horario de Atención', value: patient.ceciDiaHorarioAtencion },
    { label: 'Frecuencia de Tratamiento', value: patient.ceciFrecuenciaTratamiento },
    { label: 'Datos Adicionales', value: patient.ceciDatosAdicionales },
  ].filter(item => item.value);

  const ceciHtml = ceciItems.length > 0 
    ? `
      <div style="margin-top: 20pt; margin-bottom: 22pt; padding: 12pt; background-color: #F4F6F7; border-left: 3pt solid ${PRIMARY};">
        <div style="font-family: ${SERIF}; font-size: 12pt; font-weight: bold; color: ${INK}; margin-bottom: 8pt; border-bottom: 1pt solid ${RULE}; padding-bottom: 4pt;">Ficha CECI</div>
        <table style="width: 100%; border-collapse: collapse; font-family: ${SANS}; font-size: 9.5pt; line-height: 1.45; color: ${INK};">
          ${ceciItems.map(item => `
            <tr>
              <td style="width: 32%; vertical-align: top; padding: 2pt 8pt 2pt 0; font-weight: bold; color: ${INK_2};">${item.label}:</td>
              <td style="vertical-align: top; padding: 2pt 0;">${escapeHtml(item.value!)}</td>
            </tr>
          `).join('')}
        </table>
      </div>
    `
    : '';

  const statusMap: Record<string, string> = {
    'scheduled': 'Programado',
    'completed': 'Atendido / Realizado',
    'cancelled': 'Cancelado',
    'missed': 'Ausente / No asistió'
  };

  const sessionsHtml = sortedSessions.map((session, index) => {
    let dateFormatted = '';
    try {
      dateFormatted = new Date(session.dateTime).toLocaleDateString('es-AR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      dateFormatted = session.dateTime;
    }
    
    const statusText = statusMap[session.status] || session.status;
    const notesHtml = parseNotesToHtml(session.notes);
    const sessionNumber = index + 1;
    
    return `
      <div style="margin-bottom: 22pt; page-break-inside: avoid;">
        <p style="margin-top: 24pt; margin-right: 0; margin-bottom: 0; margin-left: 0; font-family: ${SERIF}; font-size: 13.5pt; font-weight: bold; line-height: 1.25; color: ${INK}; page-break-after: avoid;">Sesión N° ${sessionNumber}</p>
        <p style="margin-top: 2pt; margin-right: 0; margin-bottom: 10pt; margin-left: 0; padding-bottom: 4pt; border-bottom: 1.5pt solid ${PRIMARY}; font-family: ${SANS}; font-size: 9.5pt; color: ${INK_2}; page-break-after: avoid;">Evolución clínica · ${dateFormatted} · <strong style="color: ${INK};">${statusText}</strong></p>
        <div style="font-family: ${SANS}; font-size: 11pt; line-height: 1.55; color: ${INK};">
          ${notesHtml}
        </div>
      </div>
    `;
  }).join('');

  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" 
          xmlns:w="urn:schemas-microsoft-com:office:word" 
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>Historial Clínico - ${fullName}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page {
          size: 21cm 29.7cm;
          margin: 2.2cm 2.3cm 2.4cm 2.3cm;
          mso-header-margin: 1.2cm;
          mso-footer-margin: 1.2cm;
        }
        body {
          font-family: ${SANS};
          font-size: 11pt;
          line-height: 1.5;
          color: ${INK};
          background-color: #ffffff;
        }
        h1, h2, h3 { font-family: ${SERIF}; }
      </style>
    </head>
    <body style="font-family: ${SANS}; font-size: 11pt; line-height: 1.5; color: ${INK};">

      <!-- CABECERA -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 18pt;">
        <tr>
          <td style="vertical-align: bottom; padding: 0 0 6pt 0; border-bottom: 2pt solid ${PRIMARY};">
            <span style="font-family: ${SERIF}; font-size: 16pt; font-weight: bold; color: ${INK}; letter-spacing: 0.2pt;">PSICO-AGENDA</span>
            <span style="font-family: ${SANS}; font-size: 9pt; color: ${INK_2}; margin-left: 8pt; text-transform: uppercase; letter-spacing: 0.8pt;">Historial Clínico Consolidado</span>
          </td>
          <td style="vertical-align: bottom; text-align: right; padding: 0 0 6pt 0; border-bottom: 2pt solid ${PRIMARY}; font-family: ${SANS}; font-size: 9pt; color: ${INK_2};">
            Documento de uso profesional
          </td>
        </tr>
      </table>

      <!-- FICHA DEL PACIENTE -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24pt; font-family: ${SANS}; font-size: 10pt; line-height: 1.45;">
        <tr>
          <td style="width: 54%; vertical-align: top; padding: 0 16pt 0 0;">
            <div style="font-size: 8pt; text-transform: uppercase; letter-spacing: 0.6pt; color: ${INK_2}; font-weight: bold; margin-bottom: 3pt;">Paciente</div>
            <div style="font-family: ${SERIF}; font-size: 15pt; font-weight: bold; color: ${INK}; margin-bottom: 4pt;">${fullName}</div>
            <div style="font-size: 9pt; color: ${INK_2};">ID: <span style="font-family: Consolas, monospace; font-size: 8.5pt;">${escapeHtml(patient.uuid)}</span></div>
          </td>
          <td style="width: 46%; vertical-align: top; padding: 0 0 0 16pt; border-left: 1pt solid ${RULE}; font-size: 9.5pt; color: ${INK};">
            <div style="font-size: 8pt; text-transform: uppercase; letter-spacing: 0.6pt; color: ${INK_2}; font-weight: bold; margin-bottom: 3pt;">Ficha Clínica</div>
            <div style="margin-bottom: 2pt;"><strong>Nacimiento:</strong> ${birthDate}</div>
            <div><strong>Cobertura:</strong> ${coverageText(patient.healthInsurance, patient.affiliateNumber)}</div>
          </td>
        </tr>
      </table>

      ${ceciHtml}

      <!-- EVOLUCIONES CLÍNICAS -->
      <div style="margin-top: 15pt;">
        ${sessionsHtml || `<p style="margin: 0; color: ${INK_2}; font-style: italic;">Sin sesiones registradas.</p>`}
      </div>

      <!-- PIE DE PÁGINA MSO -->
      <table style="width: 100%; border-collapse: collapse; margin-top: 40pt;">
        <tr>
          <td style="border-top: 0.75pt solid ${RULE}; padding-top: 8pt; font-family: ${SANS}; font-size: 8.5pt; color: ${INK_2};">
            PSICO-AGENDA · Documento clínico confidencial · Exportado el ${new Date().toLocaleString('es-AR')}
          </td>
          <td style="border-top: 0.75pt solid ${RULE}; padding-top: 8pt; font-family: ${SANS}; font-size: 8.5pt; color: ${INK_2}; text-align: right;">
            <!--[if supportFields]>Página <span style='mso-element:field-begin'></span> PAGE <span style='mso-element:field-separator'></span>1<span style='mso-element:field-end'></span> de <span style='mso-element:field-begin'></span> NUMPAGES <span style='mso-element:field-separator'></span>1<span style='mso-element:field-end'></span><![endif]-->
          </td>
        </tr>
      </table>

    </body>
    </html>
  `;
}
