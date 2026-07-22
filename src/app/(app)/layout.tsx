import { IconWallet } from "@/components/icons";
import { SidebarNav } from "@/components/sidebar-nav";
import { obterUsuarioAtual } from "@/lib/auth";
import { sair } from "@/app/logout-actions";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const usuario = await obterUsuarioAtual();

  return (
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
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="rodape-texto-principal">{usuario?.nome ?? "Sua família"}</p>
            <p className="rodape-texto-secundario">{usuario?.email ?? "Uso local"}</p>
          </div>
          <form action={sair}>
            <button type="submit" className="link-acao link-perigo" style={{ fontSize: "0.75rem" }}>
              Sair
            </button>
          </form>
        </div>
      </aside>
      <main className="conteudo">
        <div className="container">{children}</div>
      </main>
    </div>
  );
}
