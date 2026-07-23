"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { IconEngrenagem, IconLogOut } from "@/components/icons";
import { sair } from "@/app/logout-actions";

export function PerfilMenu({
  usuario,
}: {
  usuario: { nome: string | null; email: string | null } | null;
}) {
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
    <div className="perfil-menu" ref={containerRef}>
      <button
        type="button"
        className="perfil-chip perfil-chip-botao"
        onClick={() => setAberto((v) => !v)}
        aria-haspopup="true"
        aria-expanded={aberto}
      >
        <span className="perfil-chip-avatar">👋</span>
        <div>
          <p className="perfil-chip-nome">{usuario?.nome ?? "Sua família"}</p>
          <p className="perfil-chip-sub">{usuario?.email ?? "Uso local"}</p>
        </div>
      </button>

      {aberto && (
        <div className="perfil-menu-dropdown" role="menu">
          <Link href="/configuracoes" className="nav-link" role="menuitem" onClick={() => setAberto(false)}>
            <IconEngrenagem size={16} />
            Configurações
          </Link>
          <form action={sair}>
            <button type="submit" className="nav-link perfil-menu-sair" role="menuitem">
              <IconLogOut size={16} />
              Sair
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
