import { Patient } from '../../domain/patient.types';
import { Session } from '../../domain/session.types';

function parseNotesToHtml(notes?: string): string {
  if (!notes) return 'Sin anotaciones clínicas.';
  // Si ya es HTML enriquecido, lo dejamos pasar tal cual
  if (notes.trim().startsWith('<') || /<[a-z][\s\S]*>/i.test(notes)) {
    return notes;
  }
  // Fallback para texto plano y Markdown
  return notes
    .replace(/\n/g, '<br/>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/## (.*?)(<br\/>|$)/g, '<h2 style="color: #4f46e5; font-family: Arial, sans-serif; font-size: 14pt; margin-top: 14pt; margin-bottom: 4pt; border-bottom: 1px solid #e2e8f0; padding-bottom: 2pt;">$1</h2>')
    .replace(/# (.*?)(<br\/>|$)/g, '<h1 style="color: #1e1b4b; font-family: Arial, sans-serif; font-size: 16pt; margin-top: 18pt; margin-bottom: 8pt;">$1</h1>');
}

export function generateSessionWordHtml(patient: Patient, session: Session): string {
  const dateFormatted = new Date(session.dateTime).toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const notesHtml = parseNotesToHtml(session.notes);

  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" 
          xmlns:w="urn:schemas-microsoft-com:office:word" 
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>Evolución Clínica - ${patient.fullName}</title>
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
          mso-paper-source: 0;
        }
        body {
          font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
          font-size: 11pt;
          line-height: 1.6;
          color: #334155;
          background-color: #ffffff;
        }
        .header-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24pt;
          border-bottom: 2px solid #4f46e5;
        }
        .header-title {
          font-family: 'Outfit', Arial, sans-serif;
          font-size: 18pt;
          font-weight: bold;
          color: #1e1b4b;
          padding-bottom: 6pt;
        }
        .header-subtitle {
          font-size: 9pt;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .meta-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20pt;
          background-color: #f8fafc;
        }
        .meta-table td {
          padding: 8pt 10pt;
          border: 1px solid #e2e8f0;
          font-size: 10pt;
        }
        .meta-label {
          font-weight: bold;
          color: #475569;
          width: 25%;
          background-color: #f1f5f9;
        }
        .meta-value {
          color: #0f172a;
        }
        .notes-container {
          margin-top: 12pt;
          padding: 12pt;
          border-left: 3px solid #cbd5e1;
          background-color: #fafafa;
        }
        .footer-note {
          margin-top: 40pt;
          border-top: 1px solid #e2e8f0;
          padding-top: 10pt;
          font-size: 8.5pt;
          color: #94a3b8;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <!-- Cabecera Profesional -->
      <table className="header-table" style="width: 100%; border-bottom: 2px solid #4f46e5; margin-bottom: 20px;">
        <tr>
          <td style="padding-bottom: 10px;">
            <div style="font-size: 18pt; font-weight: bold; color: #1e1b4b; font-family: Arial, sans-serif;">PSICO-AGENDA</div>
            <div style="font-size: 9pt; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Registro Profesional de Evolución Clínica</div>
          </td>
        </tr>
      </table>

      <!-- Datos del Paciente y la Sesión -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-family: Arial, sans-serif; font-size: 10pt;">
        <tr>
          <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; background-color: #f1f5f9; width: 25%;">Paciente</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0; color: #0f172a;">${patient.fullName}</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; background-color: #f1f5f9; width: 25%;">ID Paciente</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0; color: #0f172a; font-family: monospace;">${patient.uuid}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; background-color: #f1f5f9;">Fecha y Hora</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0; color: #0f172a;">${dateFormatted}</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; background-color: #f1f5f9;">Costo Pactado</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0; color: #0f172a;">$${session.priceAtSession.toLocaleString('es-AR')} ARS</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; background-color: #f1f5f9;">Estado Sesión</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0; color: #0f172a;" colspan="3">
            ${session.status === 'completed' ? 'Atendido / Realizado' : session.status === 'cancelled' ? 'Cancelado' : session.status === 'missed' ? 'Ausente / No asistió' : 'Programado'}
          </td>
        </tr>
      </table>

      <!-- Contenido Clínico de la Nota -->
      <div style="margin-top: 30px; font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #334155;">
        ${notesHtml}
      </div>

      <!-- Pie de Página -->
      <div style="margin-top: 60px; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 8.5pt; color: #94a3b8; text-align: center; font-family: Arial, sans-serif;">
        Documento generado bajo los estándares de soberanía de datos del proyecto PSICO-AGENDA.<br/>
        Fecha de exportación: ${new Date().toLocaleString('es-AR')}
      </div>
    </body>
    </html>
  `;
}

export function exportSessionToWord(patient: Patient, session: Session) {
  const htmlContent = generateSessionWordHtml(patient, session);

  // Crear y disparar la descarga en el cliente
  const blob = new Blob(['\ufeff' + htmlContent], {
    type: 'application/msword;charset=utf-8',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  
  // Limpiar el nombre del paciente para el archivo
  const safeName = patient.fullName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const sessionDateStr = session.dateTime.split('T')[0];
  
  a.href = url;
  a.download = `evolucion_${safeName}_${sessionDateStr}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function generateFullHistoryWordHtml(patient: Patient): string {
  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" 
          xmlns:w="urn:schemas-microsoft-com:office:word" 
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>Historial Clínico Completo - ${patient.fullName}</title>
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
      <table style="width: 100%; border-bottom: 3px double #4f46e5; margin-bottom: 30px; font-family: Arial, sans-serif;">
        <tr>
          <td style="padding-bottom: 15px;">
            <div style="font-size: 22pt; font-weight: bold; color: #1e1b4b; letter-spacing: 0.5px;">PSICO-AGENDA</div>
            <div style="font-size: 10pt; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; font-weight: bold; margin-top: 2px;">HISTORIAL CLÍNICO CONSOLIDADO</div>
          </td>
        </tr>
      </table>

      <!-- Datos de Ficha del Paciente -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 35px; font-family: Arial, sans-serif; font-size: 10pt;">
        <tr style="background-color: #f1f5f9;">
          <td colspan="4" style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold; color: #1e1b4b; font-size: 11pt; text-transform: uppercase;">Datos Generales del Paciente</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; background-color: #f8fafc; width: 25%;">Nombre Completo</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; color: #0f172a; width: 25%; font-weight: bold;">${patient.fullName}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; background-color: #f8fafc; width: 25%;">ID Único (UUID)</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; color: #64748b; font-family: monospace; font-size: 9pt;">${patient.uuid}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; background-color: #f8fafc;">Cobertura Médica</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; color: #0f172a;">${patient.healthInsurance ? `${patient.healthInsurance} (N° ${patient.affiliateNumber || "Particular"})` : "Particular"}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; background-color: #f8fafc;">Teléfono / Email</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; color: #0f172a;">${patient.phone || "—"} / ${patient.email || "—"}</td>
        </tr>
      </table>

      <!-- Contenido Clínico del Historial -->
      <div style="margin-top: 10px;">
        ${patient.clinicalHistory || '<span style="color: #94a3b8; font-style: italic;">Sin anotaciones registradas aún.</span>'}
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

export function exportFullHistoryToWord(patient: Patient) {
  const htmlContent = generateFullHistoryWordHtml(patient);

  const blob = new Blob(['\ufeff' + htmlContent], {
    type: 'application/msword;charset=utf-8',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  
  const safeName = patient.fullName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  
  a.href = url;
  a.download = `historial_completo_${safeName}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
