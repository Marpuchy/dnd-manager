import type { Metadata } from "next";
import { Noto_Sans, Noto_Sans_Mono, Noto_Serif } from "next/font/google";
import "./globals.css";
import { SettingsProvider } from "./components/SettingsProvider";

const bodyFont = Noto_Sans({
  variable: "--font-body",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

const displayFont = Noto_Serif({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700", "800"],
});

const monoFont = Noto_Sans_Mono({
  variable: "--font-mono",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
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
        className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable} antialiased`}
      >
        <SettingsProvider>{children}</SettingsProvider>
      </body>
    </html>
  );
}

