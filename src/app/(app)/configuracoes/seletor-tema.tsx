"use client";

import { useTransition } from "react";
import { definirTema } from "./actions";
import type { Tema } from "@/lib/tema";

export function SeletorTema({ temaAtual }: { temaAtual: Tema }) {
  const [pendente, startTransition] = useTransition();

  function escolher(tema: Tema) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("tema", tema);
      await definirTema(formData);
      window.location.reload();
    });
  }

  return (
    <div className="linha-flex" style={{ justifyContent: "flex-start", gap: "0.75rem" }}>
      <button
        type="button"
        disabled={pendente}
        onClick={() => escolher("escuro")}
        className={temaAtual === "escuro" ? "botao botao-pequeno" : "botao botao-pequeno botao-secundario"}
      >
        Escuro
      </button>
      <button
        type="button"
        disabled={pendente}
        onClick={() => escolher("claro")}
        className={temaAtual === "claro" ? "botao botao-pequeno" : "botao botao-pequeno botao-secundario"}
      >
        Claro
      </button>
    </div>
  );
}
