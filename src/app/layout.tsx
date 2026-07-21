import type { Metadata } from "next";
import { IconWallet } from "@/components/icons";
import { SidebarNav } from "@/components/sidebar-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sistema Financeiro Familiar",
  description: "Controle financeiro pessoal e familiar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="app-shell">
          <aside className="sidebar">
            <div className="logo-marca">
              <span className="logo-icone">
                <IconWallet size={20} />
              </span>
              <div>
                <p className="logo-texto-principal">Sistema Financeiro</p>
                <p className="logo-texto-secundario">Familiar</p>
              </div>
            </div>

            <SidebarNav />

            <div className="sidebar-rodape">
              <span className="avatar-generico">👋</span>
              <div>
                <p className="rodape-texto-principal">Sua família</p>
                <p className="rodape-texto-secundario">Uso local · sem login ainda</p>
              </div>
            </div>
          </aside>
          <main className="conteudo">
            <div className="container">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
