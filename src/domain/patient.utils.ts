import { Patient } from "./patient.types";

/**
 * Calculates a patient's age in years based on their YYYY-MM-DD birthdate string.
 */
export function calculateAge(birthDateString: string, todayOverride?: Date): number {
  const birth = new Date(birthDateString);
  const today = todayOverride || new Date();
  
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Sorts patients alphabetically by their full name (A-Z).
 */
export function sortPatientsAlphabetically(patients: Patient[]): Patient[] {
  return [...patients].sort((a, b) => a.fullName.localeCompare(b.fullName));
}

export type PatientTypeFilter = 'all' | 'adult' | 'underage';

export interface PatientFilterParams {
  status?: 'active' | 'inactive' | 'all';
  type?: PatientTypeFilter;
  searchTerm?: string;
}

/**
 * Pure domain function to filter patients by status, population type, and search term,
 * returning the results sorted alphabetically.
 */
export function filterPatients(
  patients: Patient[],
  params: PatientFilterParams = {}
): Patient[] {
  const { status = 'all', type = 'all', searchTerm = '' } = params;

  const normalize = (s: string) =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const term = normalize(searchTerm.trim());

  const filtered = patients.filter((p) => {
    const patientStatus = p.status || 'active';
    const matchesStatus = status === 'all' || patientStatus === status;

    const patientType = p.type || 'adult';
    const matchesType = type === 'all' || patientType === type;

    const matchesSearch = !term || normalize(p.fullName).includes(term);

    return matchesStatus && matchesType && matchesSearch;
  });

  return sortPatientsAlphabetically(filtered);
}

/**
 * Parses unified clinical history HTML and extracts content per session UUID.
 */
export function parseClinicalHistory(html: string): Map<string, string> {
  const sessionContents = new Map<string, string>();
  if (!html) return sessionContents;

  // Match the complete session header up to the closing end-session-anchor marker or closing </div>
  const anchorRegex =
    /<div\s+id="session-anchor-([^"]+)"[\s\S]*?<!--\s*end-session-anchor-\1\s*-->|<div\s+id="session-anchor-([^"]+)"[\s\S]*?Estado:[\s\S]*?<\/div>\s*<\/div>(?:<!--\s*end-session-anchor-[^>]*-->)?|<div\s+id="session-anchor-([^"]+)"[^>]*>([\s\S]*?)<\/div>(?:<!--\s*end-session-anchor-[^>]*-->)?/gi;
  const matches = [...html.matchAll(anchorRegex)];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const uuid = match[1] || match[2] || match[3];
    const startIndex = match.index! + match[0].length;
    const endIndex = i + 1 < matches.length ? matches[i + 1].index! : html.length;
    let contentHtml = html.substring(startIndex, endIndex);

    // Strip any orphan closing </div> tags left from prior regex bugs or malformed HTML
    contentHtml = contentHtml.replace(/^(\s*<\/div>\s*)+/gi, "").trim();
    sessionContents.set(uuid, contentHtml);
  }

  return sessionContents;
}

/**
 * Finds the most relevant session to display initially when opening a patient file:
 * 1. Target session if explicitly provided.
 * 2. Session scheduled or attended TODAY.
 * 3. Most recent session in the past.
 * 4. Closest upcoming session in the future.
 */
export function findInitialSession<T extends { uuid: string; dateTime: string; status: string }>(
  sessions: T[],
  targetSessionUuid?: string | null,
  referenceDate: Date = new Date()
): T | null {
  if (!sessions || sessions.length === 0) return null;

  // 1. Si hay un UUID objetivo explícito y existe en las sesiones
  if (targetSessionUuid) {
    const matched = sessions.find((s) => s.uuid === targetSessionUuid);
    if (matched) return matched;
  }

  const todayStr = referenceDate.toDateString();

  // 2. Sesión agendada o registrada para el día de HOY
  const todaySession = sessions.find(
    (s) => new Date(s.dateTime).toDateString() === todayStr
  );
  if (todaySession) return todaySession;

  const refTime = referenceDate.getTime();

  // 3. Sesión pasada más reciente (que ya haya ocurrido o sea previa a hoy)
  const pastSessions = sessions
    .filter((s) => new Date(s.dateTime).getTime() <= refTime)
    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
  if (pastSessions.length > 0) return pastSessions[0];

  // 4. Si solo hay sesiones futuras, tomar la más próxima a hoy en el tiempo
  const futureSessions = sessions
    .filter((s) => new Date(s.dateTime).getTime() > refTime)
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  if (futureSessions.length > 0) return futureSessions[0];

  return sessions[0];
}

/**
 * Rebuilds unified clinical history HTML inserting standard session headers.
 * Avoids including future scheduled sessions that do not have actual clinical notes.
 */
export function rebuildClinicalHistory(
  sessions: { uuid: string; dateTime: string; status: string }[],
  sessionContents: Map<string, string>,
  referenceDate: Date = new Date()
): string {
  const endOfRefDay = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
    23,
    59,
    59,
    999
  ).getTime();

  // Filtrar para no incorporar turnos futuros 'scheduled' que no tengan notas
  const sessionsToInclude = sessions.filter((s) => {
    if (sessionContents.has(s.uuid)) {
      const content = sessionContents.get(s.uuid) || "";
      const text = content.replace(/<[^>]*>/g, "").trim();
      if (text && text !== "Escribí la evolución clínica aquí...") {
        return true;
      }
    }
    if (s.status !== "scheduled") {
      return true;
    }
    return new Date(s.dateTime).getTime() <= endOfRefDay;
  });

  const oldestFirst = [...sessionsToInclude].sort(
    (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
  );

  let fullHtml = "";

  oldestFirst.forEach((session, index) => {
    const anchorId = `session-anchor-${session.uuid}`;
    const sessionDateObj = new Date(session.dateTime);
    let sessionDate24h = session.dateTime;
    if (!isNaN(sessionDateObj.getTime())) {
      const day = new Intl.DateTimeFormat('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(sessionDateObj).replace(/^([^,]+),/, '$1');
      const time = new Intl.DateTimeFormat('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23'
      }).format(sessionDateObj);
      sessionDate24h = `${day}, ${time}`;
    }

    const sessionNumber = index + 1;
    const statusLabel =
      session.status === "completed"
        ? "Atendida"
        : session.status === "cancelled"
        ? "Cancelada"
        : session.status === "missed"
        ? "Ausente / No asistió"
        : "Programada";

    const headerHtml = `<div id="${anchorId}" contenteditable="false" style="margin-top:0pt; margin-right:0pt; margin-bottom:0pt; margin-left:0pt; padding:0;">
  <p style="margin-top:0pt; margin-right:0pt; margin-bottom:0pt; margin-left:0pt; font-size:1pt; line-height:20pt; mso-line-height-rule:exactly;">&nbsp;</p>
  <table border="0" cellspacing="0" cellpadding="0" width="100%" style="width:100%; border-collapse:collapse; border:none;">
    <tr>
      <td width="100%" style="border:none; border-bottom:solid #2C5F6B 1.5pt; mso-border-bottom-alt:solid #2C5F6B 1.5pt; padding:0pt 0pt 5pt 0pt;">
        <p style="margin-top:0pt; margin-right:0pt; margin-bottom:0pt; margin-left:0pt; font-family:Georgia, 'Times New Roman', serif; font-size:13.5pt; font-weight:bold; line-height:1.25; color:#1E2A32; page-break-after:avoid;">Sesión N° ${sessionNumber}</p>
        <p style="margin-top:2pt; margin-right:0pt; margin-bottom:0pt; margin-left:0pt; font-family:Calibri, 'Segoe UI', Arial, sans-serif; font-size:9.5pt; color:#566670; page-break-after:avoid;">Evolución clínica · ${sessionDate24h} · <strong style="color:#1E2A32;">${statusLabel}</strong></p>
      </td>
    </tr>
  </table>
  <p style="margin-top:0pt; margin-right:0pt; margin-bottom:0pt; margin-left:0pt; font-size:1pt; line-height:8pt; mso-line-height-rule:exactly;">&nbsp;</p>
</div><!-- end-session-anchor-${session.uuid} -->`;

    const contentHtml =
      sessionContents.get(session.uuid) ||
      `<div style="font-family: Calibri, 'Segoe UI', Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #1E2A32; min-height: 20px;">Escribí la evolución clínica aquí...</div><br/>`;

    fullHtml = headerHtml + "\n" + contentHtml + "\n" + fullHtml;
  });

  return fullHtml.trim();
}

export interface HighlightedSnippet {
  sessionUuid: string;
  sessionNumber: number;
  sessionDate: string;
  text: string;
  color: string;
}

/**
 * Extracts highlighted text snippets from a unified clinical history.
 */
export function extractHighlights(
  clinicalHistoryHtml: string,
  sessions: { uuid: string; dateTime: string; status: string }[]
): HighlightedSnippet[] {
  if (!clinicalHistoryHtml) return [];

  const sessionContents = parseClinicalHistory(clinicalHistoryHtml);
  const highlights: HighlightedSnippet[] = [];

  const oldestFirst = [...sessions].sort(
    (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
  );

  const hasDOMParser = typeof DOMParser !== "undefined";

  oldestFirst.forEach((session, index) => {
    const sessionNumber = index + 1;
    const sessionDate = new Date(session.dateTime).toLocaleDateString("es-AR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    const contentHtml = sessionContents.get(session.uuid);
    if (!contentHtml) return;

    if (hasDOMParser) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(`<div>${contentHtml}</div>`, "text/html");
      const container = doc.body.firstChild as Element;
      if (!container) return;

      const elements = container.querySelectorAll("[style*='background-color']");
      elements.forEach(el => {
        const style = el.getAttribute("style") || "";
        const bgMatch = style.match(/background-color:\s*([^;]+)/i);
        if (bgMatch) {
          const color = bgMatch[1].trim();
          const text = el.textContent?.trim();
          if (text) {
            highlights.push({
              sessionUuid: session.uuid,
              sessionNumber,
              sessionDate,
              text,
              color
            });
          }
        }
      });
    } else {
      // Fallback por regex para entornos Node.js (como test runners)
      const regex = /<span[^>]*style="[^"]*background-color:\s*([^;"]+)[^"]*"[^>]*>([\s\S]*?)<\/span>/gi;
      const matches = [...contentHtml.matchAll(regex)];
      matches.forEach(m => {
        const color = m[1].trim();
        const text = m[2].replace(/<[^>]+>/g, "").trim();
        if (text) {
          highlights.push({
            sessionUuid: session.uuid,
            sessionNumber,
            sessionDate,
            text,
            color
          });
        }
      });
    }
  });

  return highlights.reverse();
}
