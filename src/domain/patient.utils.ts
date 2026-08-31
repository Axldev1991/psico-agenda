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

    const headerHtml = `<div id="${anchorId}" contenteditable="false" style="margin-top: 35px; margin-bottom: 12px; font-family: Arial, sans-serif;">
      <table style="width: 100%; border-collapse: collapse; border-bottom: 1px solid #cbd5e1; margin-bottom: 8px;">
        <tr>
          <td style="padding-bottom: 6px; vertical-align: bottom;">
            <span style="font-size: 8.5pt; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Evolución Clínica</span><br/>
            <strong style="font-size: 13pt; color: #1e293b;">Sesión N° ${sessionNumber}</strong>
          </td>
          <td style="padding-bottom: 6px; text-align: right; vertical-align: bottom; font-size: 9.5pt; color: #64748b;">
            ${sessionDate}
          </td>
        </tr>
      </table>
      <div style="font-size: 8.5pt; color: #64748b; margin-bottom: 15px;">
        Estado: <span style="font-weight: bold; color: #475569;">${session.status === "completed" ? "Atendido" : session.status === "cancelled" ? "Cancelado" : "Programado"}</span>
      </div>
    </div>`;

    const contentHtml =
      sessionContents.get(session.uuid) ||
      `<div style="font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #334155; min-height: 20px;">Escribí la evolución clínica aquí...</div><br/>`;

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
