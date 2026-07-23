import { redirect } from "next/navigation";
import { obterUsuarioAtual } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const usuarioAtual = await obterUsuarioAtual();
  if (usuarioAtual) redirect("/");

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
        <p className="pagina-subtitulo">Entre com sua conta ou crie a sua para começar.</p>
      </div>

      <LoginForm />
    </div>
  );
}
