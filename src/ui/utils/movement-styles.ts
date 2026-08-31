import { CSSProperties } from "react";

export function resolveMovementStyles(hexColor: string) {
  // Asegurarse de que el color empiece con '#' y sea válido.
  const cleanHex = hexColor.startsWith("#") ? hexColor : `#${hexColor}`;

  // bgCol: 10% de opacidad -> hexColor + "1a"
  // borderCol: 25% de opacidad -> hexColor + "40"
  const bgCol = `${cleanHex}1a`;
  const borderCol = `${cleanHex}40`;

  return {
    baseStyle: {
      color: cleanHex,
      backgroundColor: bgCol,
      borderColor: borderCol,
      transition: "all 0.2s ease",
    } as CSSProperties,
    activeStyle: {
      color: "#ffffff",
      backgroundColor: cleanHex,
      borderColor: cleanHex,
      boxShadow: `0 0 0 2px ${cleanHex}40`,
      fontWeight: "bold",
      transition: "all 0.2s ease",
    } as CSSProperties,
    labelStyle: {
      color: cleanHex,
      backgroundColor: bgCol,
      borderColor: borderCol,
      fontWeight: "bold",
    } as CSSProperties,
  };
}
