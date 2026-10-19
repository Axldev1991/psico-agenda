import { Patient } from './patient.types';
import { Session } from './session.types';

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
  if (!notes) return '<span style="color: #94a3b8; font-style: italic;">Sin anotaciones clínicas.</span>';
  if (notes.trim().startsWith('<') || /<[a-z][\s\S]*>/i.test(notes)) {
    return notes;
  }
  return escapeHtml(notes)
    .replace(/\n/g, '<br/>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
}

export function generateClinicalHistoryDocument(patient: Patient, sessions: Session[]): string {
  const sortedSessions = [...sessions].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  const fullName = escapeHtml(patient.fullName);
  const healthInsurance = escapeHtml(patient.healthInsurance || 'Particular');
  const affiliateNumber = escapeHtml(patient.affiliateNumber || '');
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
      <div style="margin-top: 25px; margin-bottom: 25px; border: 1px solid #cbd5e1; padding: 15px; background-color: #f8fafc; border-radius: 4px;">
        <h2 style="font-family: Arial, sans-serif; font-size: 12pt; color: #1e293b; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; margin-top: 0;">Ficha CECI</h2>
        <ul style="font-family: Arial, sans-serif; font-size: 10pt; color: #475569; padding-left: 20px;">
          ${ceciItems.map(item => `<li style="margin-bottom: 4px;"><strong>${item.label}:</strong> ${escapeHtml(item.value!)}</li>`).join('')}
        </ul>
      </div>
    `
    : '';

  const statusMap: Record<string, string> = {
    'scheduled': 'Programado',
    'completed': 'Atendido / Realizado',
    'cancelled': 'Cancelado',
    'missed': 'Ausente / No asistió'
  };

  const sessionsHtml = sortedSessions.map(session => {
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
    
    return `
      <div style="margin-bottom: 20px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 15px; page-break-inside: avoid;">
        <h3 style="font-family: Arial, sans-serif; font-size: 12pt; color: #334155; margin-bottom: 4px; margin-top: 0;">Sesión - ${dateFormatted}</h3>
        <p style="font-family: Arial, sans-serif; font-size: 9pt; color: #64748b; margin-top: 0; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Estado: ${statusText}</p>
        <div style="font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #1e293b;">
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
          size: 8.5in 11in;
          margin: 1.0in 1.0in 1.0in 1.0in;
          mso-header-margin: .5in;
          mso-footer-margin: .5in;
        }
        body {
          font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
          font-size: 11pt;
          line-height: 1.6;
          color: #334155;
        }
      </style>
    </head>
    <body>
      <!-- Cabecera Profesional -->
      <div style="font-family: Arial, sans-serif; margin-bottom: 25px; border-bottom: 1px solid #cbd5e1; padding-bottom: 15px;">
        <h1 style="font-size: 20pt; font-weight: bold; color: #1e293b; margin: 0; letter-spacing: -0.5px;">PSICO-AGENDA</h1>
        <p style="font-size: 10pt; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin: 4px 0 0 0;">Historial Clínico Consolidado</p>
      </div>

      <!-- Datos de Ficha del Paciente -->
      <div style="font-family: Arial, sans-serif; font-size: 10pt; color: #475569; margin-bottom: 25px; border-bottom: 1px solid #cbd5e1; padding-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 20px;">
              <span style="font-size: 8pt; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; font-weight: bold;">Paciente</span><br/>
              <strong style="font-size: 14pt; color: #1e293b;">${fullName}</strong><br/>
              <span style="font-size: 8.5pt; color: #64748b;">ID: ${patient.uuid}</span>
            </td>
            <td style="width: 50%; vertical-align: top; border-left: 1px solid #cbd5e1; padding-left: 20px; font-size: 9.5pt; line-height: 1.5; color: #334155;">
              <span style="font-size: 8pt; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; font-weight: bold;">Ficha Clínica</span><br/>
              <strong>Nacimiento:</strong> ${birthDate}<br/>
              <strong>Cobertura:</strong> ${healthInsurance} ${affiliateNumber ? `(N° ${affiliateNumber})` : ""}<br/>
            </td>
          </tr>
        </table>
      </div>

      ${ceciHtml}

      <!-- Contenido Clínico del Historial -->
      <div style="margin-top: 30px;">
        <h2 style="font-family: Arial, sans-serif; font-size: 14pt; color: #1e293b; border-bottom: 2px solid #1e293b; padding-bottom: 5px; margin-bottom: 20px;">Evoluciones Clínicas</h2>
        ${sessionsHtml || '<p style="color: #94a3b8; font-style: italic;">Sin sesiones registradas.</p>'}
      </div>

      <!-- Pie de Página -->
      <div style="margin-top: 50px; border-top: 1px solid #cbd5e1; padding-top: 12px; font-size: 8.5pt; color: #94a3b8; text-align: center; font-family: Arial, sans-serif;">
        Documento clínico oficial exportado bajo estándares de soberanía y privacidad de PSICO-AGENDA.<br/>
        Fecha del reporte: ${new Date().toLocaleString('es-AR')}
      </div>
    </body>
    </html>
  `;
}
