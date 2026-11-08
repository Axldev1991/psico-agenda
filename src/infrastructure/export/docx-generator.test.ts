import { describe, it, expect } from "vitest";
import { Packer } from "docx";
import {
  parseColorToHex,
  unescapeHtml,
  parseInlineHtmlToTextRuns,
  htmlToDocxParagraphs,
  buildFullHistoryDocx,
  buildSessionDocx,
} from "./docx-generator";
import { Patient } from "../../domain/patient.types";
import { Session } from "../../domain/session.types";

describe("docx-generator", () => {
  describe("parseColorToHex", () => {
    it("normalizes hex colors with hash", () => {
      expect(parseColorToHex("#FFF275")).toBe("FFF275");
      expect(parseColorToHex("#b3e5be")).toBe("B3E5BE");
    });

    it("normalizes 3-digit hex colors", () => {
      expect(parseColorToHex("#f0a")).toBe("FF00AA");
    });

    it("normalizes rgb colors", () => {
      expect(parseColorToHex("rgb(255, 242, 117)")).toBe("FFF275");
      expect(parseColorToHex("rgba(44, 95, 107, 1)")).toBe("2C5F6B");
    });

    it("extracts hex from css style declarations", () => {
      expect(parseColorToHex("background-color: #B3E5BE;")).toBe("B3E5BE");
    });

    it("returns undefined for empty or invalid strings", () => {
      expect(parseColorToHex("")).toBeUndefined();
      expect(parseColorToHex("transparent")).toBeUndefined();
    });
  });

  describe("unescapeHtml", () => {
    it("unescapes standard html entities", () => {
      expect(unescapeHtml("Juan &amp; Pedro &lt;3")).toBe("Juan & Pedro <3");
      expect(unescapeHtml("&quot;Hola&quot; &#039;Mundo&#039;&nbsp;!")).toBe('"Hola" \'Mundo\' !');
    });
  });

  describe("parseInlineHtmlToTextRuns", () => {
    function extractTextRunContent(run: any): string | undefined {
      const tNode = run.root?.find((item: any) => item.rootKey === "w:t");
      return tNode ? tNode.root?.[1] : undefined;
    }

    function hasShadingFill(run: any, hexColor: string): boolean {
      const rPr = run.root?.find((item: any) => item.rootKey === "w:rPr");
      if (!rPr) return false;
      const shd = rPr.root?.find((item: any) => item.rootKey === "w:shd");
      if (!shd) return false;
      const attr = shd.root?.[0];
      return JSON.stringify(attr).includes(hexColor);
    }

    it("handles plain text", () => {
      const runs = parseInlineHtmlToTextRuns("Texto plano sin formato");
      expect(runs).toHaveLength(1);
      expect(extractTextRunContent(runs[0])).toBe("Texto plano sin formato");
    });

    it("applies bold, italics, and underline", () => {
      const html = "Inicio <strong>negrita</strong> <em>cursiva</em> <u>subrayado</u> fin";
      const runs = parseInlineHtmlToTextRuns(html);
      expect(runs.length).toBeGreaterThanOrEqual(4);

      const texts = runs.map(extractTextRunContent);
      expect(texts).toContain("negrita");
      expect(texts).toContain("cursiva");
      expect(texts).toContain("subrayado");
    });

    it("applies highlight shading with exact hex colors from mark tags", () => {
      const html = 'Texto con <mark data-color="#FFF275">resaltado amarillo</mark> y normal';
      const runs = parseInlineHtmlToTextRuns(html);
      const highlighted = runs.find((r: any) => extractTextRunContent(r) === "resaltado amarillo");
      expect(highlighted).toBeDefined();
      expect(hasShadingFill(highlighted, "FFF275")).toBe(true);
    });

    it("applies highlight shading from span style background-color", () => {
      const html = 'Texto con <span style="background-color: #B3E5BE;">resaltado verde</span>';
      const runs = parseInlineHtmlToTextRuns(html);
      const highlighted = runs.find((r: any) => extractTextRunContent(r) === "resaltado verde");
      expect(highlighted).toBeDefined();
      expect(hasShadingFill(highlighted, "B3E5BE")).toBe(true);
    });
  });

  describe("htmlToDocxParagraphs", () => {
    it("handles empty or missing content", () => {
      const paragraphs = htmlToDocxParagraphs("");
      expect(paragraphs).toHaveLength(1);
    });

    it("splits paragraphs by p and br tags", () => {
      const html = "<p>Párrafo 1</p><p>Párrafo 2 con <strong>fuerza</strong></p>";
      const paragraphs = htmlToDocxParagraphs(html);
      expect(paragraphs.length).toBe(2);
    });

    it("recognizes headings and lists", () => {
      const html = "<h1>Título Principal</h1><p>Párrafo</p><li>Elemento de lista</li>";
      const paragraphs = htmlToDocxParagraphs(html);
      expect(paragraphs.length).toBe(3);
    });
  });

  describe("buildFullHistoryDocx & buildSessionDocx", () => {
    const dummyPatient: Patient = {
      uuid: "p-100",
      fullName: "Dra. Cecilia Terapeuta",
      birthDate: "1985-04-12",
      healthInsurance: "OSDE 310",
      affiliateNumber: "998877",
      phone: "11-4455-6677",
      email: "cecilia@consultorio.com",
      address: "Av. Santa Fe 1234, CABA",
      ceciConviveCon: "Pareja e hijos",
      ceciOcupacion: "Docente universitaria",
      sessionPrice: 25000,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    const dummySessions: Session[] = [
      {
        uuid: "s-1",
        patientUuid: "p-100",
        dateTime: "2026-05-10T16:00:00.000Z",
        status: "completed",
        priceAtSession: 25000,
        notes: "<p>Primera sesión de encuadre. <mark data-color=\"#FFF275\">Adherencia excelente.</mark></p>",
        colorTag: "indigo",
        createdAt: "2026-05-10T00:00:00.000Z",
        updatedAt: "2026-05-10T00:00:00.000Z",
      },
      {
        uuid: "s-rescheduled-empty",
        patientUuid: "p-100",
        dateTime: "2026-05-17T16:00:00.000Z",
        status: "rescheduled",
        priceAtSession: 25000,
        notes: "[REAGENDADO] Turno reprogramado para el 19/05",
        createdAt: "2026-05-17T00:00:00.000Z",
        updatedAt: "2026-05-17T00:00:00.000Z",
      },
      {
        uuid: "s-2",
        patientUuid: "p-100",
        dateTime: "2026-05-19T16:00:00.000Z",
        status: "completed",
        priceAtSession: 25000,
        notes: "<p>Sesión reprogramada cumplida. Buena respuesta al tratamiento.</p>",
        createdAt: "2026-05-19T00:00:00.000Z",
        updatedAt: "2026-05-19T00:00:00.000Z",
      },
    ];

    it("generates a valid Office Open XML full history document packing into buffer", async () => {
      const doc = buildFullHistoryDocx(dummyPatient, dummySessions, {
        extraNotesContent: "<p>Anotación confidencial de supervisión clínica.</p>",
      });

      const buffer = await Packer.toBuffer(doc);
      expect(buffer).toBeDefined();
      expect(buffer.length).toBeGreaterThan(1000);
      // Valid ZIP magic bytes (PK\x03\x04)
      expect(buffer[0]).toBe(0x50);
      expect(buffer[1]).toBe(0x4b);
      expect(buffer[2]).toBe(0x03);
      expect(buffer[3]).toBe(0x04);
    });

    it("generates a valid single session document packing into buffer", async () => {
      const doc = buildSessionDocx(dummyPatient, dummySessions[0], 1);
      const buffer = await Packer.toBuffer(doc);
      expect(buffer).toBeDefined();
      expect(buffer.length).toBeGreaterThan(1000);
      expect(buffer[0]).toBe(0x50);
      expect(buffer[1]).toBe(0x4b);
    });
  });
});
