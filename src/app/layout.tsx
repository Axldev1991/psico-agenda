import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PSICO-AGENDA | Sistema de Gestión Clínica",
  description: "Gestión integral de pacientes, turnos recurrentes e historias clínicas con soberanía absoluta de datos sobre Google Drive.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className="h-full antialiased font-sans"
    >
      <body className="min-h-full flex flex-col bg-[#F5F3F0]">{children}</body>
    </html>
  );
}
