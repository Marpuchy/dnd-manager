import type { Metadata } from "next";
import { Alegreya, Cinzel } from "next/font/google";
import "./globals.css";
import { SettingsProvider } from "./components/SettingsProvider";

const bodyFont = Alegreya({
  variable: "--font-body",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

const displayFont = Cinzel({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "DND Manager",
  description:
    "Gestor profesional para campañas, personajes y compendio de D&D 5e.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${bodyFont.variable} ${displayFont.variable} antialiased`}
      >
        <SettingsProvider>{children}</SettingsProvider>
      </body>
    </html>
  );
}
