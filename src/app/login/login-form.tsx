"use client";

import { useActionState } from "react";
import { criarConta, entrar, type EstadoLogin } from "./actions";

export function LoginForm({ primeiroAcesso }: { primeiroAcesso: boolean }) {
  const acao = primeiroAcesso ? criarConta : entrar;
  const [estado, formAction, pendente] = useActionState<EstadoLogin, FormData>(acao, undefined);

  return (
    <form action={formAction} className="cartao pilha-pequena" style={{ maxWidth: "24rem", width: "100%" }}>
      {primeiroAcesso && (
        <input name="nome" placeholder="Seu nome" required className="campo" />
      )}
      <input name="email" type="email" placeholder="E-mail" required className="campo" />
      <input
        name="senha"
        type="password"
        placeholder={primeiroAcesso ? "Crie uma senha (mín. 6 caracteres)" : "Senha"}
        required
        minLength={primeiroAcesso ? 6 : undefined}
        className="campo"
      />

      {estado?.erro && (
        <p style={{ color: "var(--cor-perigo-texto)", fontSize: "0.85rem", margin: 0 }}>
          {estado.erro}
        </p>
      )}

      <button type="submit" disabled={pendente} className="botao">
        {pendente ? "Aguarde..." : primeiroAcesso ? "Criar conta" : "Entrar"}
      </button>
    </form>
  );
}
