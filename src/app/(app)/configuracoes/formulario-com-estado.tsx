"use client";

import { useActionState } from "react";
import type { EstadoFormulario } from "./actions";

type Acao = (estado: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;

export function FormularioComEstado({
  acao,
  children,
  className,
  botaoTexto,
}: {
  acao: Acao;
  children: React.ReactNode;
  className?: string;
  botaoTexto: string;
}) {
  const [estado, formAction, pendente] = useActionState<EstadoFormulario, FormData>(acao, undefined);

  return (
    <form action={formAction} className={className}>
      {children}

      {estado?.erro && (
        <p style={{ color: "var(--cor-perigo-texto)", fontSize: "0.85rem", margin: 0 }}>
          {estado.erro}
        </p>
      )}
      {estado?.sucesso && (
        <p style={{ color: "var(--cor-sucesso-texto)", fontSize: "0.85rem", margin: 0 }}>
          {estado.sucesso}
        </p>
      )}

      <button type="submit" disabled={pendente} className="botao botao-pequeno" style={{ alignSelf: "flex-start" }}>
        {pendente ? "Salvando..." : botaoTexto}
      </button>
    </form>
  );
}
