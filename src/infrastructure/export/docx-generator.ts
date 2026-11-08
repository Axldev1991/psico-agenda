import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  Header,
  Footer,
  PageNumber,
  AlignmentType,
} from "docx";
import { Patient } from "../../domain/patient.types";
import { Session, ClinicalFeaturesSettings } from "../../domain/session.types";
import { filterClinicalSessions, calculateAge } from "../../domain/patient.utils";

export const PRIMARY_COLOR = "2C5F6B";
export const INK_COLOR = "1E2A32";
export const INK_MUTED_COLOR = "566670";
export const BORDER_COLOR = "D0D8DA";
export const BG_LIGHT_COLOR = "F5F7F8";

const DEFAULT_MOVEMENT_LABELS: Record<string, string> = {
  indigo: "Control",
  rose: "Cognitivo",
  emerald: "Fisiológico",
  amber: "Otro",
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Programado",
  completed: "Atendido / Realizado",
  cancelled: "Cancelado",
  rescheduled: "Reagendado",
  missed: "Ausente / No asistió",
};

/**
 * Normalizes any color representation (hex with/without #, rgb, style string)
 * into a valid 6-character uppercase hex string for docx ShadingType.
 */
export function parseColorToHex(color: string): string | undefined {
  if (!color) return undefined;
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10).toString(16).padStart(2, "0");
    const g = parseInt(rgbMatch[2], 10).toString(16).padStart(2, "0");
    const b = parseInt(rgbMatch[3], 10).toString(16).padStart(2, "0");
    return (r + g + b).toUpperCase();
  }
  const hexMatch = color.match(/#?([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/);
  if (hexMatch) {
    let hex = hexMatch[1];
    if (hex.length === 3) {
      hex = hex.split("").map((c) => c + c).join("");
    }
    return hex.toUpperCase();
  }
  return undefined;
}

export function unescapeHtml(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ");
}

/**
 * Tokenizes rich HTML inline formatting into docx TextRun instances,
 * preserving bold, italics, underline, and highlight background shading.
 */
export function parseInlineHtmlToTextRuns(html: string): TextRun[] {
  if (!html) {
    return [new TextRun({ text: "", font: "Calibri", size: 22 })];
  }

  const runs: TextRun[] = [];
  const tagRegex = /<\/?([a-z0-9]+)(?:\s+([^>]*))?>|([^<]+)/gi;
  let bold = false;
  let italics = false;
  let underline = false;
  const shadingStack: string[] = [];

  let match: RegExpExecArray | null;
  while ((match = tagRegex.exec(html)) !== null) {
    const [full, tag, attrs, text] = match;
    if (text) {
      const decoded = unescapeHtml(text);
      if (decoded) {
        const currentShading =
          shadingStack.length > 0
            ? shadingStack[shadingStack.length - 1]
            : undefined;

        runs.push(
          new TextRun({
            text: decoded,
            bold: bold || undefined,
            italics: italics || undefined,
            underline: underline ? {} : undefined,
            shading: currentShading
              ? { type: ShadingType.CLEAR, fill: currentShading }
              : undefined,
            font: "Calibri",
            size: 22, // 11pt
            color: INK_COLOR,
          })
        );
      }
    } else if (tag) {
      const tagName = tag.toLowerCase();
      const isClosing = full.startsWith("</");

      if (tagName === "strong" || tagName === "b") {
        bold = !isClosing;
      } else if (tagName === "em" || tagName === "i") {
        italics = !isClosing;
      } else if (tagName === "u") {
        underline = !isClosing;
      } else if (tagName === "mark" || tagName === "span") {
        if (isClosing) {
          shadingStack.pop();
        } else {
          const colorMatch = (attrs || "").match(
            /(?:data-color=["']([^"']+)["']|background-color:\s*([^;"']+))/i
          );
          const rawColor = colorMatch ? colorMatch[1] || colorMatch[2] : undefined;
          const hex = rawColor ? parseColorToHex(rawColor) : undefined;
          if (hex) {
            shadingStack.push(hex);
          }
        }
      }
    }
  }

  return runs.length > 0
    ? runs
    : [new TextRun({ text: "", font: "Calibri", size: 22 })];
}

/**
 * Splits HTML notes into clean block elements (<p>, <h1-3>, <li>, <br/>)
 * and maps each block into a properly styled docx Paragraph.
 */
export function htmlToDocxParagraphs(html?: string): Paragraph[] {
  if (!html || !html.trim()) {
    return [
      new Paragraph({
        children: [
          new TextRun({
            text: "Sin anotaciones clínicas registradas.",
            italics: true,
            color: INK_MUTED_COLOR,
            font: "Calibri",
            size: 22,
          }),
        ],
        spacing: { after: 120 },
      }),
    ];
  }

  // Pre-limpieza de saltos de línea de markdown si no tiene tags HTML
  let processedHtml = html;
  if (!processedHtml.includes("<") && !processedHtml.includes(">")) {
    processedHtml = processedHtml
      .replace(/\r?\n/g, "<br/>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>");
  }

  // Segmentar por bloques contenedores
  const rawBlocks = processedHtml
    .replace(/<br\s*\/?>/gi, "</p><p>")
    .split(/<\/(?:p|div|h[1-6]|li)>/i)
    .map((b) => b.trim())
    .filter(Boolean);

  const paragraphs: Paragraph[] = [];

  for (const block of rawBlocks) {
    const isHeading1 = /<h1[^>]*>/i.test(block);
    const isHeading2 = /<h2[^>]*>/i.test(block);
    const isHeading3 = /<h3[^>]*>/i.test(block);
    const isListItem = /<li[^>]*>/i.test(block);

    // Remover tags de apertura de bloque para extraer contenido inline
    const cleanInnerHtml = block.replace(/<(?:p|div|h[1-6]|li)[^>]*>/gi, "").trim();
    if (!cleanInnerHtml) continue;

    const runs = parseInlineHtmlToTextRuns(cleanInnerHtml);

    if (isHeading1) {
      paragraphs.push(
        new Paragraph({
          children: runs.map((r) => new TextRun({ ...r, bold: true, size: 28, font: "Georgia", color: PRIMARY_COLOR })),
          spacing: { before: 240, after: 120 },
        })
      );
    } else if (isHeading2) {
      paragraphs.push(
        new Paragraph({
          children: runs.map((r) => new TextRun({ ...r, bold: true, size: 26, font: "Georgia", color: PRIMARY_COLOR })),
          spacing: { before: 200, after: 100 },
        })
      );
    } else if (isHeading3) {
      paragraphs.push(
        new Paragraph({
          children: runs.map((r) => new TextRun({ ...r, bold: true, size: 24, font: "Georgia", color: INK_COLOR })),
          spacing: { before: 160, after: 80 },
        })
      );
    } else if (isListItem) {
      paragraphs.push(
        new Paragraph({
          children: runs,
          bullet: { level: 0 },
          spacing: { after: 80 },
        })
      );
    } else {
      paragraphs.push(
        new Paragraph({
          children: runs,
          spacing: { after: 120, line: 360 }, // 1.5 line spacing (360/240)
        })
      );
    }
  }

  return paragraphs.length > 0
    ? paragraphs
    : [new Paragraph({ children: [new TextRun({ text: "", font: "Calibri", size: 22 })] })];
}

/**
 * Builds a native Office Open XML Document (.docx) for the full clinical history,
 * strictly formatted for A4 print-layout across Microsoft Word and LibreOffice Writer.
 */
export function buildFullHistoryDocx(
  patient: Patient,
  sessions: Session[],
  options: {
    clinicalFeatures?: ClinicalFeaturesSettings;
    extraNotesContent?: string;
    now?: Date;
  } = {}
): Document {
  const { clinicalFeatures, extraNotesContent, now = new Date() } = options;

  const exportableSessions = filterClinicalSessions(sessions).sort(
    (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
  );

  const patientName = patient.fullName;
  const age = patient.birthDate ? calculateAge(patient.birthDate, now) : null;
  const ageText = age !== null ? `${age} años` : "—";
  const birthText = patient.birthDate || "No registrada";
  const coverage = patient.healthInsurance
    ? `${patient.healthInsurance}${patient.affiliateNumber ? ` · N° ${patient.affiliateNumber}` : ""}`
    : "Particular";
  const contact = [patient.phone, patient.email].filter(Boolean).join(" · ") || "—";
  const address = patient.address || "—";

  const children: (Paragraph | Table)[] = [];

  // 1. Título principal del documento
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "HISTORIAL CLÍNICO Y EVOLUCIÓN",
          font: "Georgia",
          size: 32, // 16pt
          bold: true,
          color: PRIMARY_COLOR,
        }),
      ],
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Paciente: ${patientName}`,
          font: "Georgia",
          size: 26, // 13pt
          bold: true,
          color: INK_COLOR,
        }),
      ],
      spacing: { after: 200 },
    })
  );

  // 2. Ficha de Datos Personales
  const metaRows: [string, string][] = [
    ["Fecha de Nacimiento", `${birthText} (${ageText})`],
    ["Cobertura Médica", coverage],
    ["Contacto", contact],
    ["Domicilio", address],
  ];

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.DOTTED, size: 2, color: BORDER_COLOR },
        insideVertical: { style: BorderStyle.NONE },
      },
      rows: metaRows.map(
        ([label, value]) =>
          new TableRow({
            children: [
              new TableCell({
                width: { size: 30, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: label, bold: true, color: INK_MUTED_COLOR, size: 20, font: "Calibri" })],
                    spacing: { before: 40, after: 40 },
                  }),
                ],
              }),
              new TableCell({
                width: { size: 70, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: value, color: INK_COLOR, size: 20, font: "Calibri" })],
                    spacing: { before: 40, after: 40 },
                  }),
                ],
              }),
            ],
          })
      ),
    })
  );

  // 3. Ficha CECI (si tiene datos cargados)
  const ceciItems: [string, string][] = [
    ["Convive con", patient.ceciConviveCon || ""],
    ["Familia", patient.ceciFamilia || ""],
    ["Ocupación", patient.ceciOcupacion || ""],
    ["Estudios", patient.ceciEstudios || ""],
    ["Tratamientos Anteriores", patient.ceciTratamientosAnteriores || ""],
    ["Inicio de Consulta", patient.ceciInicioConsulta || ""],
    ["Día y Horario", patient.ceciDiaHorarioAtencion || ""],
    ["Frecuencia", patient.ceciFrecuenciaTratamiento || ""],
    ["Datos Adicionales", patient.ceciDatosAdicionales || ""],
  ].filter(([_, v]) => v.trim().length > 0) as [string, string][];

  if (ceciItems.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "FICHA CECI",
            font: "Georgia",
            size: 22,
            bold: true,
            color: PRIMARY_COLOR,
          }),
        ],
        spacing: { before: 280, after: 80 },
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
          left: { style: BorderStyle.SINGLE, size: 16, color: PRIMARY_COLOR },
          right: { style: BorderStyle.NONE },
          insideHorizontal: { style: BorderStyle.DOTTED, size: 2, color: BORDER_COLOR },
          insideVertical: { style: BorderStyle.NONE },
        },
        rows: ceciItems.map(
          ([label, value]) =>
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 30, type: WidthType.PERCENTAGE },
                  shading: { type: ShadingType.CLEAR, fill: BG_LIGHT_COLOR },
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: label, bold: true, color: INK_MUTED_COLOR, size: 20, font: "Calibri" })],
                      spacing: { before: 40, after: 40 },
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 70, type: WidthType.PERCENTAGE },
                  shading: { type: ShadingType.CLEAR, fill: BG_LIGHT_COLOR },
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: value, color: INK_COLOR, size: 20, font: "Calibri" })],
                      spacing: { before: 40, after: 40 },
                    }),
                  ],
                }),
              ],
            })
        ),
      })
    );
  }

  // Espaciador antes de las evoluciones clínicas
  children.push(new Paragraph({ spacing: { before: 200 } }));

  // 4. Evoluciones Clínicas (Sesiones)
  if (exportableSessions.length === 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Aún no hay evoluciones clínicas registradas para este paciente.",
            italics: true,
            color: INK_MUTED_COLOR,
            size: 22,
            font: "Calibri",
          }),
        ],
        spacing: { before: 200, after: 200 },
      })
    );
  } else {
    exportableSessions.forEach((session, idx) => {
      const sessionNumber = idx + 1;
      const sessionDate = new Date(session.dateTime);
      let dateFormatted = "";
      try {
        dateFormatted = sessionDate.toLocaleDateString("es-AR", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch {
        dateFormatted = session.dateTime;
      }

      const statusText = STATUS_LABELS[session.status] || session.status;
      let subtitleText = `Evolución clínica · ${dateFormatted} · Estado: ${statusText}`;

      if (clinicalFeatures?.enableMovements !== false && session.colorTag) {
        const movementLabel =
          DEFAULT_MOVEMENT_LABELS[session.colorTag] || session.colorTag;
        subtitleText += ` · Movimiento: ${movementLabel}`;
      }

      // Título de la sesión
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Sesión N° ${sessionNumber}`,
              font: "Georgia",
              size: 26, // 13pt
              bold: true,
              color: INK_COLOR,
            }),
          ],
          spacing: { before: 360, after: 40 },
          keepNext: true,
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: subtitleText,
              font: "Calibri",
              size: 20, // 10pt
              color: INK_MUTED_COLOR,
            }),
          ],
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 8, color: PRIMARY_COLOR },
          },
          spacing: { after: 160 },
          keepNext: true,
        })
      );

      // Párrafos de la evolución
      const noteParagraphs = htmlToDocxParagraphs(session.notes);
      children.push(...noteParagraphs);
    });
  }

  // 5. Anotaciones Clínicas Extras (si se adjuntaron)
  if (extraNotesContent && extraNotesContent.trim()) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Anotaciones Clínicas Extras",
            font: "Georgia",
            size: 28, // 14pt
            bold: true,
            color: PRIMARY_COLOR,
          }),
        ],
        spacing: { before: 440, after: 40 },
        keepNext: true,
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "Hoja de trabajo y notas clínicas del paciente fuera del expediente oficial.",
            font: "Calibri",
            size: 20,
            color: INK_MUTED_COLOR,
            italics: true,
          }),
        ],
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 8, color: PRIMARY_COLOR },
        },
        spacing: { after: 160 },
        keepNext: true,
      }),
      ...htmlToDocxParagraphs(extraNotesContent)
    );
  }

  return new Document({
    styles: {
      default: {
        document: {
          run: {
            font: "Calibri",
            size: 22,
            color: INK_COLOR,
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 2.54 cm
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: "Psico-Agenda · Gestión Clínica",
                    size: 18,
                    color: INK_MUTED_COLOR,
                    italics: true,
                    font: "Calibri",
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                border: {
                  top: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
                },
                children: [
                  new TextRun({
                    text: `Documento clínico confidencial · ${patientName}   |   Página `,
                    size: 18,
                    color: INK_MUTED_COLOR,
                    font: "Calibri",
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 18,
                    color: INK_MUTED_COLOR,
                    font: "Calibri",
                  }),
                  new TextRun({
                    text: " de ",
                    size: 18,
                    color: INK_MUTED_COLOR,
                    font: "Calibri",
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 18,
                    color: INK_MUTED_COLOR,
                    font: "Calibri",
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });
}

/**
 * Builds a native Office Open XML Document (.docx) for a single clinical session.
 */
export function buildSessionDocx(
  patient: Patient,
  session: Session,
  sessionNumber: number | null,
  options: { clinicalFeatures?: ClinicalFeaturesSettings } = {}
): Document {
  const { clinicalFeatures } = options;
  const patientName = patient.fullName;
  const sessionDate = new Date(session.dateTime);
  let dateFormatted = "";
  try {
    dateFormatted = sessionDate.toLocaleDateString("es-AR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    dateFormatted = session.dateTime;
  }

  const statusText = STATUS_LABELS[session.status] || session.status;
  const numText = sessionNumber !== null ? `N° ${sessionNumber}` : "";

  const children: (Paragraph | Table)[] = [
    new Paragraph({
      children: [
        new TextRun({
          text: `Evolución de Sesión ${numText}`,
          font: "Georgia",
          size: 32,
          bold: true,
          color: PRIMARY_COLOR,
        }),
      ],
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Paciente: ${patientName}`,
          font: "Georgia",
          size: 24,
          bold: true,
          color: INK_COLOR,
        }),
      ],
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Fecha: ${dateFormatted}   |   Estado: ${statusText}${session.description ? `   |   Tema: ${session.description}` : ""}`,
          font: "Calibri",
          size: 20,
          color: INK_MUTED_COLOR,
        }),
      ],
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 8, color: PRIMARY_COLOR },
      },
      spacing: { after: 200 },
    }),
    ...htmlToDocxParagraphs(session.notes),
  ];

  return new Document({
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 22, color: INK_COLOR },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children,
      },
    ],
  });
}

/**
 * Triggers a browser download of the full clinical history as a genuine .docx file.
 */
export async function exportFullHistoryToDocx(
  patient: Patient,
  sessions: Session[],
  options: {
    clinicalFeatures?: ClinicalFeaturesSettings;
    extraNotesContent?: string;
  } = {}
): Promise<void> {
  const doc = buildFullHistoryDocx(patient, sessions, options);
  const blob = await Packer.toBlob(doc);

  const safeName = patient.fullName.toLowerCase().replace(/[^a-z0-9]/gi, "_");
  const filename = `${safeName}_historial.docx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Triggers a browser download of an individual session as a genuine .docx file.
 */
export async function exportSessionToDocx(
  patient: Patient,
  session: Session,
  sessionNumber: number | null,
  options: { clinicalFeatures?: ClinicalFeaturesSettings } = {}
): Promise<void> {
  const doc = buildSessionDocx(patient, session, sessionNumber, options);
  const blob = await Packer.toBlob(doc);

  const safeName = patient.fullName.toLowerCase().replace(/[^a-z0-9]/gi, "_");
  const dateStr = session.dateTime.split("T")[0];
  const numStr = sessionNumber !== null ? `sesion_${sessionNumber}` : "sesion";
  const filename = `${numStr}_${safeName}_${dateStr}.docx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
