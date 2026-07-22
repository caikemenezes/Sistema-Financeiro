"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/format";

type ContaResumo = { id: string; nome: string; valor: number };

function chaveDoDia(prefixo: string): string {
  const hoje = new Date().toISOString().slice(0, 10);
  return `notif_${prefixo}_${hoje}`;
}

function notificarUmaVez(chave: string, titulo: string, corpo: string) {
  if (localStorage.getItem(chave)) return;
  new Notification(titulo, { body: corpo });
  localStorage.setItem(chave, "1");
}

export function NotificacoesVencimento({
  contasHoje,
  contasEm3Dias,
}: {
  contasHoje: ContaResumo[];
  contasEm3Dias: ContaResumo[];
}) {
  const [permissao, setPermissao] = useState<NotificationPermission | "indisponivel">(
    "indisponivel"
  );

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    // Sincroniza com o estado atual da permissão do navegador (não há evento pra "assinar" aqui).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPermissao(Notification.permission);
  }, []);

  useEffect(() => {
    if (permissao !== "granted") return;

    if (contasHoje.length > 0) {
      const nomes = contasHoje.map((c) => `${c.nome} (${formatCurrency(c.valor)})`).join(", ");
      notificarUmaVez(
        chaveDoDia("hoje"),
        "Conta vencendo hoje",
        contasHoje.length === 1 ? nomes : `${contasHoje.length} contas vencem hoje: ${nomes}`
      );
    }

    if (contasEm3Dias.length > 0) {
      const nomes = contasEm3Dias.map((c) => `${c.nome} (${formatCurrency(c.valor)})`).join(", ");
      notificarUmaVez(
        chaveDoDia("em3dias"),
        "Conta vencendo em 3 dias",
        contasEm3Dias.length === 1 ? nomes : `${contasEm3Dias.length} contas vencem em 3 dias: ${nomes}`
      );
    }
  }, [permissao, contasHoje, contasEm3Dias]);

  async function ativarNotificacoes() {
    if (!("Notification" in window)) return;
    const resultado = await Notification.requestPermission();
    setPermissao(resultado);
  }

  if (permissao !== "default") return null;

  return (
    <div className="banner-notificacoes">
      <span>
        Ativar notificações do navegador para avisos de vencimento (3 dias antes e no dia)?
      </span>
      <button onClick={ativarNotificacoes} className="botao botao-pequeno">
        Ativar notificações
      </button>
    </div>
  );
}
