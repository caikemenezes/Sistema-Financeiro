import { SidebarShell } from "@/components/sidebar-shell";
import { PerfilMenu } from "@/components/perfil-menu";
import { obterUsuarioAtual } from "@/lib/auth";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const usuario = await obterUsuarioAtual();
  const usuarioResumo = usuario ? { nome: usuario.nome, email: usuario.email } : null;

  return (
    <div className="app-shell">
      <SidebarShell usuario={usuarioResumo} />
      <div className="topo-perfil-flutuante">
        <PerfilMenu usuario={usuarioResumo} />
      </div>
      <main className="conteudo">
        <div className="container">{children}</div>
      </main>
    </div>
  );
}
