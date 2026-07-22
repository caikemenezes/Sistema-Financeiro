import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obterUsuarioAtual } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const usuarioAtual = await obterUsuarioAtual();
  if (usuarioAtual) redirect("/");

  const totalUsuarios = await prisma.usuario.count();
  const primeiroAcesso = totalUsuarios === 0;

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.5rem",
        padding: "1.5rem",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1 className="pagina-titulo">Sistema Financeiro Familiar</h1>
        <p className="pagina-subtitulo">
          {primeiroAcesso
            ? "Primeiro acesso — crie a conta da família para começar."
            : "Entre com sua conta para continuar."}
        </p>
      </div>

      <LoginForm primeiroAcesso={primeiroAcesso} />
    </div>
  );
}
