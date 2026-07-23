import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Andora Essence | Perfumes, chocolates e presentes",
  description: "Perfumes, chocolates, cosméticos e presentes especiais em Pedro do Rosário. Atendimento personalizado pelo WhatsApp.",
  keywords: ["perfumaria", "Pedro do Rosário", "perfumes", "chocolates", "presentes", "Andora Essence"],
  other: { "codex-preview": "development" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
