"use client";

import { useEffect, useRef, useState } from "react";
import { IconInfo } from "@/components/icons";

/** Ícone de informação no canto de um cartão, explicando o que aquela seção faz. */
export function InfoIcone({ texto }: { texto: string }) {
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;

    function aoClicarFora(evento: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(evento.target as Node)) {
        setAberto(false);
      }
    }

    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, [aberto]);

  return (
    <div
      ref={containerRef}
      className="info-icone-wrapper"
      onMouseEnter={() => setAberto(true)}
      onMouseLeave={() => setAberto(false)}
    >
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-label="Sobre esta seção"
        aria-expanded={aberto}
        className="botao-icone-info"
      >
        <IconInfo size={15} />
      </button>
      {aberto && (
        <div className="info-balao" role="tooltip">
          {texto}
        </div>
      )}
    </div>
  );
}
