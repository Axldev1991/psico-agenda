import { Patient } from '../../domain/patient.types';
import { Session } from '../../domain/session.types';

const INK = '#1E2A32';
const INK_2 = '#566670';
const RULE = '#B8C4C8';
const PRIMARY = '#2C5F6B';
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "Calibri, 'Segoe UI', Arial, sans-serif";
const MONO = "Consolas, 'Courier New', monospace";

export const esc = (s: unknown): string =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

/* Márgenes en formato largo para compatibilidad con Word */
const m = (t = 0, r = 0, b = 0, l = 0) =>
  `margin-top:${t}pt; margin-right:${r}pt; margin-bottom:${b}pt; margin-left:${l}pt;`;

/* Borde de un solo lado, con el patrón que usa Word al guardar HTML */
const sideBorder = (side: 'top' | 'bottom' | 'left' | 'right', pt: number, color: string) =>
  `border:none; border-${side}:solid ${color} ${pt}pt; mso-border-${side}-alt:solid ${color} ${pt}pt;`;
const NO_BORDER = 'border:none;';

const TABLE_ATTRS = 'border="0" cellspacing="0" cellpadding="0" width="100%"';
const TABLE_STYLE = 'width:100%; border-collapse:collapse; border:none;';

/* Separador vertical de altura exacta */
const gap = (pt: number) =>
  `<p style="${m()} font-size:1pt; line-height:${pt}pt; mso-line-height-rule:exactly;">&nbsp;</p>`;

export function coverageText(patient: Patient): string {
  if (!patient.healthInsurance) return 'Particular';
  return patient.affiliateNumber
    ? `${patient.healthInsurance} · N° ${patient.affiliateNumber}`
    : patient.healthInsurance;
}

export function contactLines(patient: Patient): string[] {
  const parts = [patient.phone, patient.email].filter(Boolean) as string[];
  if (parts.length === 0) return ['—'];
  return [parts.join(' · ')];
}

/* "jueves 31 de diciembre de 2026, 13:00" */
export function formatSessionDate(d: Date): string {
  const day = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(d).replace(/^([^,]+),/, '$1');
  const time = new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).format(d);
  return `${day}, ${time}`;
}

/* "28 de octubre de 2026, 14:05" */
export function formatExportDate(d: Date): string {
  const day = new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(d);
  const time = new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).format(d);
  return `${day}, ${time}`;
}

const SESSION_STATUS: Record<string, string> = {
  completed: 'Atendido / Realizado',
  cancelled: 'Cancelado',
  missed: 'Ausente / No asistió',
  scheduled: 'Programado'
};

export const sessionStatusLabel = (status: string): string =>
  SESSION_STATUS[status] || 'Programado';

function parseNotesToHtml(notes?: string): string {
  if (!notes) return `<p style="${m()} color:${INK_2}; font-style:italic;">Sin anotaciones clínicas.</p>`;
  if (notes.trim().startsWith('<') || /<[a-z][\s\S]*>/i.test(notes)) {
    return notes;
  }
  let html = notes
    .replace(/\n/g, '<br/>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');

  html = html.replace(/## (.*?)(<br\/>|$)/g, `<h2 style="${m(14, 0, 4, 0)} font-family: ${SERIF}; font-size:13pt; color:${PRIMARY}; ${sideBorder('bottom', 1, RULE)} padding-bottom:2pt;">$1</h2>`);
  html = html.replace(/# (.*?)(<br\/>|$)/g, `<h1 style="${m(18, 0, 6, 0)} font-family: ${SERIF}; font-size:15pt; color:${INK};">$1</h1>`);

  return html;
}

export function generateSessionWordHtml(patient: Patient, session: Session, { now = new Date() }: { now?: Date } = {}): string {
  const sessionDateObj = new Date(session.dateTime);
  const dateFormatted = isNaN(sessionDateObj.getTime())
    ? session.dateTime
    : formatSessionDate(sessionDateObj);

  const notesHtml = parseNotesToHtml(session.notes);
  const statusStr = sessionStatusLabel(session.status);
  const priceStr = `$${(session.priceAtSession ?? 0).toLocaleString('es-AR')} ARS`;
  const name = esc(patient.fullName);
  const exportedAt = esc(formatExportDate(now));

  return `<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>Evolución clínica - ${name}</title>
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
    @page Section1 {
      size: 21cm 29.7cm;
      margin: 2.2cm 2.3cm 2.4cm 2.3cm;
      mso-header-margin: 1.2cm;
      mso-footer-margin: 1.2cm;
      mso-footer: f1;
    }
    div.Section1 { page: Section1; }
    body { font-family: ${SANS}; font-size: 11pt; line-height: 1.5; color: ${INK}; background-color: #ffffff; }
    p { margin-top: 0; margin-right: 0; margin-bottom: 6pt; margin-left: 0; }
    p.MsoFooter { margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0; }
  </style>
</head>
<body style="font-family:${SANS}; font-size:11pt; line-height:1.5; color:${INK};">
<div class="Section1">

  <!-- CABECERA -->
  <table ${TABLE_ATTRS} style="${TABLE_STYLE}">
    <tr>
      <td width="62%" valign="bottom" style="${sideBorder('bottom', 2, PRIMARY)} padding:0pt 0pt 6pt 0pt;">
        <p style="${m()} font-family:${SERIF}; font-size:18pt; font-weight:bold; line-height:1.1; color:${INK};">Psico-Agenda</p>
        <p style="${m(2)} font-family:${SANS}; font-size:10pt; color:${INK_2};">Registro de evolución clínica</p>
      </td>
      <td width="38%" valign="bottom" align="right" style="${sideBorder('bottom', 2, PRIMARY)} padding:0pt 0pt 6pt 12pt; font-family:${SANS}; font-size:9.5pt; line-height:1.4; color:${INK_2};">
        Documento de uso profesional<br/>Exportado el ${exportedAt}
      </td>
    </tr>
  </table>

  ${gap(16)}

  <!-- FICHA DEL PACIENTE Y SESIÓN -->
  <table ${TABLE_ATTRS} style="${TABLE_STYLE} font-family:${SANS}; font-size:10pt;">
    <tr>
      <td width="54%" valign="top" style="${NO_BORDER} padding:0pt 16pt 12pt 0pt;">
        <p style="${m(0, 0, 3)} font-size:9pt; font-weight:bold; color:${INK_2};">Paciente</p>
        <p style="${m(0, 0, 4)} font-family:${SERIF}; font-size:15pt; font-weight:bold; line-height:1.25; color:${INK};">${name}</p>
        <p style="${m()} font-size:9pt; color:${INK_2};">ID: <span style="font-family:${MONO}; font-size:8.5pt;">${esc(patient.uuid)}</span></p>
      </td>
      <td width="46%" valign="top" style="${sideBorder('left', 0.75, RULE)} padding:0pt 0pt 12pt 16pt; font-size:10pt; color:${INK};">
        <p style="${m(0, 0, 3)} font-size:9pt; font-weight:bold; color:${INK_2};">Detalle de la sesión</p>
        <p style="${m(0, 0, 3)}"><strong>Fecha:</strong> ${esc(dateFormatted)}</p>
        <p style="${m(0, 0, 3)}"><strong>Honorarios:</strong> ${priceStr}</p>
        <p style="${m()}"><strong>Estado:</strong> ${esc(statusStr)}</p>
      </td>
    </tr>
    <tr>
      <td colspan="2" style="${sideBorder('top', 0.75, RULE)} padding:0pt; font-size:1pt; line-height:1pt; mso-line-height-rule:exactly;">&nbsp;</td>
    </tr>
  </table>

  <!-- TÍTULO DE EVOLUCIÓN -->
  <table ${TABLE_ATTRS} style="${TABLE_STYLE}">
    <tr>
      <td width="100%" style="${sideBorder('bottom', 1.5, PRIMARY)} padding:0pt 0pt 5pt 0pt;">
        <p style="${m(12, 0, 0, 0)} font-family:${SERIF}; font-size:13.5pt; font-weight:bold; line-height:1.25; color:${INK};">Evolución clínica</p>
      </td>
    </tr>
  </table>

  ${gap(10)}

  <!-- CUERPO DE LA NOTA -->
  <div style="${m()} font-family:${SANS}; font-size:11pt; line-height:1.55; color:${INK};">
    ${notesHtml}
  </div>

</div>

<!-- PIE DE PÁGINA MSO -->
<div style="mso-element:footer" id="f1">
  <table ${TABLE_ATTRS} style="${TABLE_STYLE}">
    <tr>
      <td valign="top" style="${sideBorder('top', 0.75, RULE)} padding:5pt 0pt 0pt 0pt; font-family:${SANS}; font-size:9pt; color:${INK_2};">
        Documento clínico confidencial · ${name}
      </td>
      <td valign="top" align="right" style="${sideBorder('top', 0.75, RULE)} padding:5pt 0pt 0pt 0pt; font-family:${SANS}; font-size:9pt; color:${INK_2};">
        <!--[if supportFields]>Página <span style='mso-element:field-begin'></span><span style='mso-spacerun:yes'> </span>PAGE <span style='mso-element:field-separator'></span><span style='mso-no-proof:yes'>1</span><span style='mso-element:field-end'></span> de <span style='mso-element:field-begin'></span><span style='mso-spacerun:yes'> </span>NUMPAGES <span style='mso-element:field-separator'></span><span style='mso-no-proof:yes'>1</span><span style='mso-element:field-end'></span><![endif]-->
      </td>
    </tr>
  </table>
</div>

</body>
</html>`;
}

export function exportSessionToWord(patient: Patient, session: Session) {
  const htmlContent = generateSessionWordHtml(patient, session);

  const blob = new Blob(['\ufeff' + htmlContent], {
    type: 'application/msword;charset=utf-8',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  
  const safeName = patient.fullName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const sessionDateStr = session.dateTime.split('T')[0];
  
  a.href = url;
  a.download = `evolucion_${safeName}_${sessionDateStr}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function generateFullHistoryWordHtml(patient: Patient, { now = new Date() }: { now?: Date } = {}): string {
  const name = esc(patient.fullName);
  const exportedAt = esc(formatExportDate(now));

  return `<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>Historial clínico - ${name}</title>
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
    @page Section1 {
      size: 21cm 29.7cm;
      margin: 2.2cm 2.3cm 2.4cm 2.3cm;
      mso-header-margin: 1.2cm;
      mso-footer-margin: 1.2cm;
      mso-footer: f1;
    }
    div.Section1 { page: Section1; }
    body { font-family: ${SANS}; font-size: 11pt; line-height: 1.5; color: ${INK}; background-color: #ffffff; }
    p { margin-top: 0; margin-right: 0; margin-bottom: 6pt; margin-left: 0; }
    p.MsoFooter { margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0; }
  </style>
</head>
<body style="font-family:${SANS}; font-size:11pt; line-height:1.5; color:${INK};">
<div class="Section1">

  <!-- CABECERA -->
  <table ${TABLE_ATTRS} style="${TABLE_STYLE}">
    <tr>
      <td width="62%" valign="bottom" style="${sideBorder('bottom', 2, PRIMARY)} padding:0pt 0pt 6pt 0pt;">
        <p style="${m()} font-family:${SERIF}; font-size:18pt; font-weight:bold; line-height:1.1; color:${INK};">Psico-Agenda</p>
        <p style="${m(2)} font-family:${SANS}; font-size:10pt; color:${INK_2};">Historial clínico consolidado</p>
      </td>
      <td width="38%" valign="bottom" align="right" style="${sideBorder('bottom', 2, PRIMARY)} padding:0pt 0pt 6pt 12pt; font-family:${SANS}; font-size:9.5pt; line-height:1.4; color:${INK_2};">
        Documento de uso profesional<br/>Exportado el ${exportedAt}
      </td>
    </tr>
  </table>

  ${gap(16)}

  <!-- FICHA DEL PACIENTE -->
  <table ${TABLE_ATTRS} style="${TABLE_STYLE} font-family:${SANS}; font-size:10pt;">
    <tr>
      <td width="54%" valign="top" style="${NO_BORDER} padding:0pt 16pt 12pt 0pt;">
        <p style="${m(0, 0, 3)} font-size:9pt; font-weight:bold; color:${INK_2};">Paciente</p>
        <p style="${m(0, 0, 4)} font-family:${SERIF}; font-size:15pt; font-weight:bold; line-height:1.25; color:${INK};">${name}</p>
        <p style="${m()} font-size:9pt; color:${INK_2};">ID: <span style="font-family:${MONO}; font-size:8.5pt;">${esc(patient.uuid)}</span></p>
      </td>
      <td width="46%" valign="top" style="${sideBorder('left', 0.75, RULE)} padding:0pt 0pt 12pt 16pt; font-size:10pt; color:${INK};">
        <p style="${m(0, 0, 3)} font-size:9pt; font-weight:bold; color:${INK_2};">Ficha clínica</p>
        <p style="${m(0, 0, 3)}"><strong>Cobertura:</strong> ${esc(coverageText(patient))}</p>
        <p style="${m()}"><strong>Contacto:</strong><br/>${contactLines(patient).map(esc).join('<br/>')}</p>
      </td>
    </tr>
    <tr>
      <td colspan="2" style="${sideBorder('top', 0.75, RULE)} padding:0pt; font-size:1pt; line-height:1pt; mso-line-height-rule:exactly;">&nbsp;</td>
    </tr>
  </table>

  <!-- HISTORIAL CLÍNICO: sesiones con su encabezado y sus notas -->
  <div style="${m()} font-family:${SANS}; font-size:11pt; line-height:1.55; color:${INK};">
    ${patient.clinicalHistory || `<p style="color:${INK_2}; font-style:italic;">Sin anotaciones registradas aún.</p>`}
  </div>

</div>

<!-- PIE DE PÁGINA MSO -->
<div style="mso-element:footer" id="f1">
  <table ${TABLE_ATTRS} style="${TABLE_STYLE}">
    <tr>
      <td valign="top" style="${sideBorder('top', 0.75, RULE)} padding:5pt 0pt 0pt 0pt; font-family:${SANS}; font-size:9pt; color:${INK_2};">
        Documento clínico confidencial · ${name}
      </td>
      <td valign="top" align="right" style="${sideBorder('top', 0.75, RULE)} padding:5pt 0pt 0pt 0pt; font-family:${SANS}; font-size:9pt; color:${INK_2};">
        <!--[if supportFields]>Página <span style='mso-element:field-begin'></span><span style='mso-spacerun:yes'> </span>PAGE <span style='mso-element:field-separator'></span><span style='mso-no-proof:yes'>1</span><span style='mso-element:field-end'></span> de <span style='mso-element:field-begin'></span><span style='mso-spacerun:yes'> </span>NUMPAGES <span style='mso-element:field-separator'></span><span style='mso-no-proof:yes'>1</span><span style='mso-element:field-end'></span><![endif]-->
      </td>
    </tr>
  </table>
</div>

</body>
</html>`;
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
