import type { Metadata, Viewport } from "next";
import { Newsreader, Public_Sans } from "next/font/google";
import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  weight: ["500", "600"],
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "PSICO-AGENDA | Sistema de Gestión Clínica",
  description:
    "Gestión integral de pacientes, turnos recurrentes e historias clínicas con soberanía absoluta de datos sobre Google Drive.",
  manifest: "/manifest.json",
  appleWebApp: {
    statusBarStyle: "default",
    title: "PSICO-AGENDA",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-AR"
      className={`h-full antialiased font-sans ${newsreader.variable} ${publicSans.variable}`}
    >
      <body className="min-h-full flex flex-col bg-bg-base">{children}</body>
    </html>
  );
}
