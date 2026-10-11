/**
 * Paleta cerrada de 8 colores clínicos con contraste verificado (> 4.5:1)
 * especificada en docs/psico-agenda-guia-de-diseno-02.html
 */

export interface ClinicalTagColor {
  key: string;
  name: string;
  text: string;
  bg: string;
  contrast: string;
  label: string;
}

export const CLINICAL_TAG_PALETTE: readonly ClinicalTagColor[] = [
  { key: "pizarra", name: "Pizarra", text: "#3D4C56", bg: "#E6EBED", contrast: "7.4:1", label: "Otro" },
  { key: "salvia", name: "Salvia", text: "#2F6B4A", bg: "#E3F1E8", contrast: "5.4:1", label: "Fisiológico" },
  { key: "azul", name: "Azul", text: "#2D4C85", bg: "#E2E9F5", contrast: "6.9:1", label: "Control" },
  { key: "violeta", name: "Violeta", text: "#5A3E86", bg: "#ECE7F4", contrast: "7.0:1", label: "Movimiento cubano" },
  { key: "ciruela", name: "Ciruela", text: "#86315F", bg: "#F4E5EE", contrast: "6.6:1", label: "Cognitivo" },
  { key: "petroleo", name: "Petróleo", text: "#2C5F6B", bg: "#E4EFF1", contrast: "6.1:1", label: "Evaluación" },
  { key: "ambar", name: "Ámbar", text: "#8A5A12", bg: "#FBF1DC", contrast: "5.3:1", label: "Seguimiento" },
  { key: "rojo", name: "Rojo", text: "#9C3A3A", bg: "#F7E4E4", contrast: "5.6:1", label: "Urgente" },
] as const;

export function resolveClinicalTag(keyOrColor?: string): ClinicalTagColor {
  if (!keyOrColor) return CLINICAL_TAG_PALETTE[0];
  const normalized = keyOrColor.toLowerCase().replace("#", "");
  const found = CLINICAL_TAG_PALETTE.find(
    (tag) => tag.key === normalized || tag.text.toLowerCase().replace("#", "") === normalized
  );
  return found || CLINICAL_TAG_PALETTE[0];
}
