import type { Metadata } from "next";
import { obterTema } from "@/lib/tema";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sistema Financeiro Familiar",
  description: "Controle financeiro pessoal e familiar",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const tema = await obterTema();

  return (
    <html lang="pt-BR" data-tema={tema}>
      <body>{children}</body>
    </html>
  );
}
