"use client";

import { useState, useActionState } from "react";
import { criarConta, entrar, type EstadoLogin } from "./actions";

export function LoginForm() {
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const criarConta_ = modo === "criar";
  const acao = criarConta_ ? criarConta : entrar;
  const [estado, formAction, pendente] = useActionState<EstadoLogin, FormData>(acao, undefined);

  return (
    <form
      key={modo}
      action={formAction}
      className="cartao pilha-pequena"
      style={{ maxWidth: "24rem", width: "100%" }}
    >
      {criarConta_ && <input name="nome" placeholder="Seu nome" required className="campo" />}
      <input name="email" type="email" placeholder="E-mail" required className="campo" />
      <input
        name="senha"
        type="password"
        placeholder={criarConta_ ? "Crie uma senha (mín. 6 caracteres)" : "Senha"}
        required
        minLength={criarConta_ ? 6 : undefined}
        className="campo"
      />

      {criarConta_ && (
        <p className="texto-suave" style={{ fontSize: "0.75rem", margin: 0 }}>
          Isso cria um espaço novo e separado, só seu — não entra em nenhuma família existente.
          Pra se juntar à família de alguém, peça um convite em Configurações pra essa pessoa.
        </p>
      )}

      {estado?.erro && (
        <p style={{ color: "var(--cor-perigo-texto)", fontSize: "0.85rem", margin: 0 }}>
          {estado.erro}
        </p>
      )}

      <button
        type="submit"
        disabled={pendente}
        className={`botao ${criarConta_ ? "botao-claro" : ""}`}
      >
        {pendente ? "Aguarde..." : criarConta_ ? "Criar conta" : "Entrar"}
      </button>

      <button
        type="button"
        onClick={() => setModo(criarConta_ ? "entrar" : "criar")}
        className="link-acao"
        style={{ alignSelf: "center", background: "none", border: "none", color: "var(--cor-texto)" }}
      >
        {criarConta_ ? "Já tem conta? Entrar" : "Não tem conta? Criar conta"}
      </button>
    </form>
  );
}
