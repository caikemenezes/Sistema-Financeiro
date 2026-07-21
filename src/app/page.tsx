import Link from "next/link";
import { getDashboardData } from "@/lib/dashboard";
import { formatCurrency, formatDate, parseMesParam, formatMesParam, diasAte } from "@/lib/format";
import { GraficoFluxoCaixa, GraficoGastosPorCategoria } from "@/components/charts";
import {
  IconArrowUpRight,
  IconCheckCircle,
  IconFileText,
  IconClock,
  IconAlertTriangle,
  IconCreditCard,
  IconTarget,
  IconWallet,
  IconTrendingUp,
  IconBell,
  IconPlus,
  IconChevronLeft,
  IconChevronRight,
} from "@/components/icons";

export const dynamic = "force-dynamic";

function StatCard({
  label,
  value,
  subtitle,
  icon,
  iconTone,
  tone,
}: {
  label: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  iconTone: "dourado" | "sucesso" | "alerta" | "perigo" | "info";
  tone?: "positive" | "negative";
}) {
  const toneClasse =
    tone === "positive" ? "stat-positivo" : tone === "negative" ? "stat-negativo" : "";

  return (
    <div className="cartao">
      <span className={`stat-icone stat-icone-${iconTone}`}>{icon}</span>
      <p className="stat-rotulo">{label}</p>
      <p className={`stat-valor ${toneClasse}`}>{value}</p>
      {subtitle && <p className="stat-rodape">{subtitle}</p>}
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const params = await searchParams;
  const mesReferencia = parseMesParam(params.mes);
  const data = await getDashboardData(mesReferencia);

  const mesLabelBruto = mesReferencia.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const mesLabel = mesLabelBruto.charAt(0).toUpperCase() + mesLabelBruto.slice(1);

  const mesAnterior = new Date(
    Date.UTC(mesReferencia.getUTCFullYear(), mesReferencia.getUTCMonth() - 1, 1)
  );
  const mesProximo = new Date(
    Date.UTC(mesReferencia.getUTCFullYear(), mesReferencia.getUTCMonth() + 1, 1)
  );

  const totalAlertas =
    data.contasAtrasadas.length + data.dividasProximasVencimento.length + data.necessidadesDoMes.length;

  const percentualRecebido =
    data.rendaPrevista > 0 ? Math.round((data.rendaRecebida / data.rendaPrevista) * 100) : 0;

  const proximosVencimentos = [...data.contasProximasVencimento]
    .sort((a, b) => a.vencimento.getTime() - b.vencimento.getTime())
    .slice(0, 5);

  return (
    <div className="pilha">
      <div className="cabecalho-dashboard">
        <div>
          <h1 className="pagina-titulo">Olá! 👋</h1>
          <p className="pagina-subtitulo">Aqui está o resumo da sua vida financeira.</p>
        </div>

        <div className="cabecalho-acoes">
          <div className="seletor-periodo">
            <Link href={`/?mes=${formatMesParam(mesAnterior)}`} className="botao-icone">
              <IconChevronLeft size={16} />
            </Link>
            <span>{mesLabel}</span>
            <Link href={`/?mes=${formatMesParam(mesProximo)}`} className="botao-icone">
              <IconChevronRight size={16} />
            </Link>
          </div>

          <a href="#alertas-importantes" className="botao-icone sino-wrap" aria-label="Ver alertas">
            <IconBell size={20} />
            {totalAlertas > 0 && <span className="sino-contador">{totalAlertas}</span>}
          </a>

          <details style={{ position: "relative" }}>
            <summary className="botao-dourado" style={{ listStyle: "none", cursor: "pointer" }}>
              <IconPlus size={16} />
              Nova Transação
            </summary>
            <div
              className="cartao"
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 0.4rem)",
                zIndex: 10,
                minWidth: "180px",
                padding: "0.4rem",
              }}
            >
              <Link href="/receitas" className="nav-link">
                Nova receita
              </Link>
              <Link href="/contas" className="nav-link">
                Nova conta do mês
              </Link>
              <Link href="/cartoes" className="nav-link">
                Nova compra no cartão
              </Link>
              <Link href="/metas" className="nav-link">
                Nova meta
              </Link>
            </div>
          </details>
        </div>
      </div>

      <div className="stats-grade">
        <StatCard
          label="Renda do Mês"
          value={formatCurrency(data.rendaPrevista)}
          subtitle={`Previsto: ${formatCurrency(data.rendaPrevista)}`}
          icon={<IconArrowUpRight size={18} />}
          iconTone="dourado"
        />
        <StatCard
          label="Recebido"
          value={formatCurrency(data.rendaRecebida)}
          subtitle={`${percentualRecebido}% da renda`}
          icon={<IconCheckCircle size={18} />}
          iconTone="sucesso"
          tone="positive"
        />
        <StatCard
          label="Total de Contas"
          value={formatCurrency(data.totalContas)}
          subtitle={`${data.contasPagasCount + data.contasPendentesCount + data.contasAtrasadasCount} contas`}
          icon={<IconFileText size={18} />}
          iconTone="info"
        />
        <StatCard
          label="Contas Pagas"
          value={formatCurrency(data.totalPago)}
          subtitle={`${data.contasPagasCount} contas`}
          icon={<IconCheckCircle size={18} />}
          iconTone="sucesso"
        />
        <StatCard
          label="Contas Pendentes"
          value={formatCurrency(data.totalPendente - data.totalAtrasado)}
          subtitle={`${data.contasPendentesCount} contas`}
          icon={<IconClock size={18} />}
          iconTone="alerta"
        />
        <StatCard
          label="Contas Atrasadas"
          value={formatCurrency(data.totalAtrasado)}
          subtitle={`${data.contasAtrasadasCount} contas`}
          icon={<IconAlertTriangle size={18} />}
          iconTone="perigo"
          tone={data.totalAtrasado > 0 ? "negative" : undefined}
        />
        <StatCard
          label="Cartão de Crédito"
          value={formatCurrency(data.totalCartaoMes)}
          subtitle="Fatura do mês"
          icon={<IconCreditCard size={18} />}
          iconTone="dourado"
        />
        <StatCard
          label="Metas e Prioridades"
          value={formatCurrency(data.totalGuardadoMetas)}
          subtitle="Reservado"
          icon={<IconTarget size={18} />}
          iconTone="dourado"
        />
        <StatCard
          label="Dívidas"
          value={formatCurrency(data.totalDividasRestante)}
          subtitle="Total devido"
          icon={<IconAlertTriangle size={18} />}
          iconTone="perigo"
        />
        <StatCard
          label="Saldo Disponível"
          value={formatCurrency(data.saldoDisponivel)}
          subtitle="Neste momento"
          icon={<IconWallet size={18} />}
          iconTone="dourado"
          tone={data.saldoDisponivel >= 0 ? "positive" : "negative"}
        />
        <StatCard
          label="Previsão de Saldo"
          value={formatCurrency(data.saldoPrevistoFimDoMes)}
          subtitle="Final do mês"
          icon={<IconTrendingUp size={18} />}
          iconTone="dourado"
          tone={data.saldoPrevistoFimDoMes >= 0 ? "positive" : "negative"}
        />
      </div>

      <div className="charts-grade">
        <div className="cartao">
          <div className="grafico-cabecalho">
            <h2 className="grafico-titulo">Fluxo de Caixa do Mês</h2>
            <div className="grafico-legenda">
              <span className="legenda-item">
                <span className="legenda-marcador-linha" style={{ background: "var(--status-bom)" }} />
                Receitas
              </span>
              <span className="legenda-item">
                <span
                  className="legenda-marcador-linha"
                  style={{ background: "var(--status-critico)" }}
                />
                Despesas
              </span>
              <span className="legenda-item">
                <span
                  className="legenda-marcador-linha"
                  style={{ background: "var(--dourado-linha)" }}
                />
                Saldo
              </span>
            </div>
          </div>
          <GraficoFluxoCaixa pontos={data.pontosFluxo} />
        </div>

        <div className="cartao">
          <div className="grafico-cabecalho">
            <h2 className="grafico-titulo">Gastos por Categoria</h2>
          </div>
          <GraficoGastosPorCategoria dados={data.gastosPorCategoria} total={data.totalContas} />
        </div>
      </div>

      <div className="listas-grade">
        <div className="cartao">
          <div className="lista-cabecalho">
            <h2 className="lista-titulo">Próximos Vencimentos</h2>
            <Link href="/contas" className="link-ver-todos">
              Ver todos
            </Link>
          </div>
          {proximosVencimentos.length === 0 && (
            <p className="item-vazio">Nenhuma conta vencendo nos próximos 7 dias.</p>
          )}
          {proximosVencimentos.map((conta) => (
            <div key={conta.id} className="item-lista-rica">
              <span className="item-icone">
                <IconFileText size={18} />
              </span>
              <div className="item-corpo">
                <p className="item-titulo">{conta.nome}</p>
                <p className="item-subtitulo">
                  Vence em {diasAte(conta.vencimento)} dias · {formatDate(conta.vencimento)}
                </p>
              </div>
              <span className="item-valor">{formatCurrency(conta.valor)}</span>
            </div>
          ))}
        </div>

        <div className="cartao" id="alertas-importantes">
          <div className="lista-cabecalho">
            <h2 className="lista-titulo">Alertas Importantes</h2>
          </div>
          {totalAlertas === 0 && <p className="item-vazio">Nenhum alerta no momento.</p>}

          {data.contasAtrasadas.length > 0 && (
            <Link href="/contas" className="alerta-card alerta-card-critico">
              <span className="alerta-card-icone">
                <IconAlertTriangle size={16} />
              </span>
              <div className="alerta-card-corpo">
                <p className="alerta-card-titulo">
                  {data.contasAtrasadas.length}{" "}
                  {data.contasAtrasadas.length === 1 ? "conta atrasada" : "contas atrasadas"}
                </p>
                <p className="alerta-card-subtitulo">
                  Total de {formatCurrency(data.totalAtrasado)} em aberto
                </p>
              </div>
              <IconChevronRight size={16} />
            </Link>
          )}

          {data.dividasProximasVencimento.map((divida) => (
            <Link key={divida.id} href="/dividas" className="alerta-card alerta-card-alerta">
              <span className="alerta-card-icone">
                <IconClock size={16} />
              </span>
              <div className="alerta-card-corpo">
                <p className="alerta-card-titulo">{divida.nome}</p>
                <p className="alerta-card-subtitulo">
                  {divida.vencimento ? `Vence em ${diasAte(divida.vencimento)} dias` : "Sem data"} ·{" "}
                  {formatCurrency(divida.valorAtual)}
                </p>
              </div>
              <IconChevronRight size={16} />
            </Link>
          ))}

          {data.necessidadesDoMes.map((necessidade) => (
            <Link key={necessidade.id} href="/familia" className="alerta-card alerta-card-info">
              <span className="alerta-card-icone">
                <IconTarget size={16} />
              </span>
              <div className="alerta-card-corpo">
                <p className="alerta-card-titulo">{necessidade.item}</p>
                <p className="alerta-card-subtitulo">
                  {necessidade.familiaMembro ? `${necessidade.familiaMembro.nome} · ` : ""}
                  {formatCurrency(necessidade.valorEstimado)}
                </p>
              </div>
              <IconChevronRight size={16} />
            </Link>
          ))}
        </div>

        <div className="cartao">
          <div className="lista-cabecalho">
            <h2 className="lista-titulo">Metas em Andamento</h2>
            <Link href="/metas" className="link-ver-todos">
              Ver todas
            </Link>
          </div>
          {data.metasEmAndamento.length === 0 && (
            <p className="item-vazio">Nenhuma meta cadastrada ainda.</p>
          )}
          {data.metasEmAndamento.map((meta) => {
            const progresso = Math.min(
              100,
              Math.round((meta.valorGuardado / meta.valorEstimado) * 100)
            );
            return (
              <div key={meta.id} className="meta-progresso-item">
                <div className="meta-progresso-cabecalho">
                  <span className="meta-progresso-nome">{meta.nome}</span>
                  <span className="meta-progresso-valores">
                    {formatCurrency(meta.valorGuardado)} / {formatCurrency(meta.valorEstimado)}
                  </span>
                </div>
                <div className="progresso-trilho">
                  <div className="progresso-barra" style={{ width: `${progresso}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
