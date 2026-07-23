"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { IconWallet, IconChevronsLeft, IconMenu, IconX } from "@/components/icons";
import { SidebarNav } from "@/components/sidebar-nav";
import { PerfilMenu } from "@/components/perfil-menu";

const CHAVE_RECOLHIDA = "sidebar-recolhida";
const CONSULTA_MOBILE = "(max-width: 860px)";

export function SidebarShell({
  usuario,
}: {
  usuario: { nome: string | null; email: string | null } | null;
}) {
  const [recolhido, setRecolhido] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const [ehMobile, setEhMobile] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Sincroniza com a preferência salva no navegador (não há evento pra "assinar" aqui).
    if (localStorage.getItem(CHAVE_RECOLHIDA) === "1") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRecolhido(true);
    }
  }, []);

  useEffect(() => {
    const consulta = window.matchMedia(CONSULTA_MOBILE);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEhMobile(consulta.matches);
    const aoMudar = (evento: MediaQueryListEvent) => setEhMobile(evento.matches);
    consulta.addEventListener("change", aoMudar);
    return () => consulta.removeEventListener("change", aoMudar);
  }, []);

  useEffect(() => {
    // Fecha a gaveta do celular ao navegar pra outra página.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMenuAberto(false);
  }, [pathname]);

  function alternar() {
    setRecolhido((atual) => {
      const proximo = !atual;
      localStorage.setItem(CHAVE_RECOLHIDA, proximo ? "1" : "0");
      return proximo;
    });
  }

  // No celular a gaveta é sempre tudo-ou-nada — ignora a preferência de
  // "recolhido pra só ícones" salva no desktop, senão o menu abriria sem
  // nenhum texto (a renderização condicional some com os rótulos, não é só CSS).
  const recolhidoEfetivo = ehMobile ? false : recolhido;

  return (
    <>
      <header className="topo-mobile">
        <button
          type="button"
          className="botao-icone"
          onClick={() => setMenuAberto(true)}
          aria-label="Abrir menu"
        >
          <IconMenu size={20} />
        </button>
        <span className="topo-mobile-logo">
          <IconWallet size={18} />
          Sistema Financeiro
        </span>
        <div className="topo-mobile-perfil">
          <PerfilMenu usuario={usuario} />
        </div>
      </header>

      {menuAberto && (
        <div
          className="sidebar-fundo-mobile"
          onClick={() => setMenuAberto(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`sidebar${recolhidoEfetivo ? " sidebar-recolhida" : ""}${menuAberto ? " sidebar-aberta-mobile" : ""}`}
      >
        <button
          type="button"
          className="sidebar-toggle"
          onClick={alternar}
          aria-label={recolhidoEfetivo ? "Expandir menu" : "Recolher menu"}
          title={recolhidoEfetivo ? "Expandir menu" : "Recolher menu"}
        >
          <IconChevronsLeft
            size={14}
            className={recolhidoEfetivo ? "sidebar-toggle-icone girado" : "sidebar-toggle-icone"}
          />
        </button>

        <button
          type="button"
          className="sidebar-fechar-mobile"
          onClick={() => setMenuAberto(false)}
          aria-label="Fechar menu"
        >
          <IconX size={18} />
        </button>

        <div className="logo-marca">
          <span className="logo-icone">
            <IconWallet size={20} />
          </span>
          {!recolhidoEfetivo && (
            <div>
              <p className="logo-texto-principal">Sistema Financeiro</p>
              <p className="logo-texto-secundario">Familiar</p>
            </div>
          )}
        </div>

        <SidebarNav recolhido={recolhidoEfetivo} />

        <div className={recolhidoEfetivo ? "sidebar-rodape sidebar-rodape-recolhido" : "sidebar-rodape"}>
          <span className="avatar-generico" title={usuario?.nome ?? "Sua família"}>
            👋
          </span>
          {!recolhidoEfetivo && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="rodape-texto-principal">{usuario?.nome ?? "Sua família"}</p>
              <p className="rodape-texto-secundario">{usuario?.email ?? "Uso local"}</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
