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

/**
 * Parses unified clinical history HTML and extracts content per session UUID.
 */
export function parseClinicalHistory(html: string): Map<string, string> {
  const sessionContents = new Map<string, string>();
  if (!html) return sessionContents;

  const anchorRegex = /<div\s+id="session-anchor-([^"]+)"[^>]*>([\s\S]*?)<\/div>/gi;
  const matches = [...html.matchAll(anchorRegex)];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const uuid = match[1];
    const startIndex = match.index! + match[0].length;
    const endIndex = i + 1 < matches.length ? matches[i + 1].index! : html.length;
    let contentHtml = html.substring(startIndex, endIndex);

    // Clean up surrounding whitespace/newlines
    contentHtml = contentHtml.trim();
    sessionContents.set(uuid, contentHtml);
  }

  return sessionContents;
}

/**
 * Rebuilds unified clinical history HTML inserting standard session headers.
 */
export function rebuildClinicalHistory(
  sessions: { uuid: string; dateTime: string; status: string }[],
  sessionContents: Map<string, string>
): string {
  const oldestFirst = [...sessions].sort(
    (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
  );

  let fullHtml = "";

  oldestFirst.forEach((session, index) => {
    const anchorId = `session-anchor-${session.uuid}`;
    const sessionDate = new Date(session.dateTime).toLocaleDateString("es-AR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const sessionNumber = index + 1;

    const headerHtml = `<div id="${anchorId}" contenteditable="false" style="margin-top: 24px; margin-bottom: 8px; border-bottom: 2px solid #4f46e5; padding-bottom: 4px; font-family: Arial, sans-serif;"><h3 style="color: #4f46e5; font-size: 14pt; margin: 0;">📅 Sesión N° ${sessionNumber} — ${sessionDate}</h3><p style="margin: 2px 0 0 0; color: #64748b; font-size: 10px;">Estado: ${
      session.status === "completed"
        ? "Atendido"
        : session.status === "cancelled"
        ? "Cancelado"
        : "Programado"
    }</p></div>`;

    const contentHtml =
      sessionContents.get(session.uuid) ||
      `<div style="font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #334155; min-height: 20px;">Escribí la evolución clínica aquí...</div><br/>`;

    fullHtml = headerHtml + "\n" + contentHtml + "\n" + fullHtml;
  });

  return fullHtml.trim();
}
