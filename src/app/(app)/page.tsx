import Link from "next/link";
import { getDashboardData } from "@/lib/dashboard";
import { formatCurrency, formatDate, parseMesParam, formatMesParam, diasAte } from "@/lib/format";
import {
  GraficoFluxoCaixa,
  GraficoGastosPorCategoria,
  BarraHorizontal,
  AnelProgresso,
} from "@/components/charts";
import { NotificacoesVencimento } from "@/components/notificacoes";
import { obterUsuarioAtual } from "@/lib/auth";
import {
  IconArrowUpRight,
  IconCheckCircle,
  IconFileText,
  IconClock,
  IconAlertTriangle,
  IconTarget,
  IconTrendingUp,
  IconBell,
  IconPlus,
  IconChevronLeft,
  IconChevronRight,
  IconEngrenagem,
  IconWallet,
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

function MiniTile({
  label,
  value,
  icon,
  iconTone,
  delta,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconTone: "dourado" | "sucesso" | "alerta" | "perigo" | "info";
  delta?: string;
}) {
  return (
    <div className="mini-tile">
      <span className={`mini-tile-icone stat-icone-${iconTone}`}>{icon}</span>
      <p className="mini-tile-valor">{value}</p>
      <div className="mini-tile-rodape">
        <p className="mini-tile-rotulo">{label}</p>
        {delta && <span className="selo-delta selo-delta-positivo">{delta}</span>}
      </div>
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
  const [data, usuario] = await Promise.all([getDashboardData(mesReferencia), obterUsuarioAtual()]);

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
    data.contasAtrasadas.length +
    data.contasVencendoHoje.length +
    data.contasVencendoEm3Dias.length +
    data.dividasProximasVencimento.length +
    data.necessidadesDoMes.length;

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

          <Link href="/configuracoes" className="botao-icone" title="Configurações" aria-label="Configurações">
            <IconEngrenagem size={18} />
          </Link>

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
              <Link href="/metas" className="nav-link">
                Nova meta
              </Link>
              <Link href="/prioridades" className="nav-link">
                Nova prioridade
              </Link>
              <Link href="/investimentos" className="nav-link">
                Novo investimento
              </Link>
            </div>
          </details>

          <div className="perfil-chip">
            <span className="perfil-chip-avatar">👋</span>
            <div>
              <p className="perfil-chip-nome">{usuario?.nome ?? "Sua família"}</p>
              <p className="perfil-chip-sub">{usuario?.email ?? "Uso local"}</p>
            </div>
          </div>
        </div>
      </div>

      <NotificacoesVencimento
        contasHoje={data.contasVencendoHoje.map((c) => ({ id: c.id, nome: c.nome, valor: c.valor }))}
        contasEm3Dias={data.contasVencendoEm3Dias.map((c) => ({
          id: c.id,
          nome: c.nome,
          valor: c.valor,
        }))}
      />

      <div className="hero-grade">
        <div className="hero-coluna">
          <div className="cartao cartao-hero">
            <div className="cartao-hero-topo">
              <div>
                <p className="cartao-hero-rotulo">Saldo Disponível</p>
                <p className="cartao-hero-valor">{formatCurrency(data.saldoDisponivel)}</p>
              </div>
              <span className="cartao-hero-selo">{mesLabel}</span>
            </div>
            <p className="cartao-hero-sub">
              Previsão para o fim do mês: <strong>{formatCurrency(data.saldoPrevistoFimDoMes)}</strong>
            </p>
          </div>

          <div className="cartao cartao-cta">
            <p className="cartao-cta-titulo">Planejamento do mês</p>
            <p className="cartao-cta-texto">
              Acompanhe contas, cartão e metas para saber exatamente quanto ainda pode gastar.
            </p>
            <Link href="/contas" className="botao-dourado" style={{ alignSelf: "flex-start" }}>
              Ver contas do mês
              <IconArrowUpRight size={14} />
            </Link>
          </div>
        </div>

        <div className="cartao" id="alertas-importantes">
          <div className="lista-cabecalho">
            <h2 className="lista-titulo">Alertas Importantes</h2>
            {totalAlertas > 0 && <span className="selo selo-perigo">{totalAlertas}</span>}
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
                <p className="alerta-card-subtitulo">Em aberto</p>
              </div>
              <span className="alerta-card-valor" style={{ color: "var(--cor-perigo-texto)" }}>
                {formatCurrency(data.totalAtrasado)}
              </span>
            </Link>
          )}

          {data.contasVencendoHoje.map((conta) => (
            <Link key={conta.id} href="/contas" className="alerta-card alerta-card-critico">
              <span className="alerta-card-icone">
                <IconAlertTriangle size={16} />
              </span>
              <div className="alerta-card-corpo">
                <p className="alerta-card-titulo">{conta.nome}</p>
                <p className="alerta-card-subtitulo">Vence hoje</p>
              </div>
              <span className="alerta-card-valor" style={{ color: "var(--cor-perigo-texto)" }}>
                {formatCurrency(conta.valor)}
              </span>
            </Link>
          ))}

          {data.contasVencendoEm3Dias.map((conta) => (
            <Link key={conta.id} href="/contas" className="alerta-card alerta-card-alerta">
              <span className="alerta-card-icone">
                <IconClock size={16} />
              </span>
              <div className="alerta-card-corpo">
                <p className="alerta-card-titulo">{conta.nome}</p>
                <p className="alerta-card-subtitulo">Vence em 3 dias</p>
              </div>
              <span className="alerta-card-valor" style={{ color: "var(--cor-alerta-texto)" }}>
                {formatCurrency(conta.valor)}
              </span>
            </Link>
          ))}

          {data.dividasProximasVencimento.map((divida) => (
            <Link key={divida.id} href="/dividas" className="alerta-card alerta-card-alerta">
              <span className="alerta-card-icone">
                <IconClock size={16} />
              </span>
              <div className="alerta-card-corpo">
                <p className="alerta-card-titulo">{divida.nome}</p>
                <p className="alerta-card-subtitulo">
                  {divida.vencimento ? `Vence em ${diasAte(divida.vencimento)} dias` : "Sem data"}
                </p>
              </div>
              <span className="alerta-card-valor" style={{ color: "var(--cor-alerta-texto)" }}>
                {formatCurrency(divida.valorAtual)}
              </span>
            </Link>
          ))}

          {data.necessidadesDoMes.map((necessidade) => (
            <Link key={necessidade.id} href="/prioridades" className="alerta-card alerta-card-info">
              <span className="alerta-card-icone">
                <IconTarget size={16} />
              </span>
              <div className="alerta-card-corpo">
                <p className="alerta-card-titulo">{necessidade.item}</p>
                <p className="alerta-card-subtitulo">
                  {necessidade.familiaMembro?.nome ?? necessidade.pessoaNome ?? "Família"}
                </p>
              </div>
              <span className="alerta-card-valor" style={{ color: "var(--cor-info-texto)" }}>
                {formatCurrency(necessidade.valorEstimado)}
              </span>
            </Link>
          ))}
        </div>

        <div className="cartao" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <h2 className="lista-titulo">Resumo Rápido</h2>
          <div className="mini-grade">
            <MiniTile
              label="Renda do Mês"
              value={formatCurrency(data.rendaPrevista)}
              icon={<IconArrowUpRight size={16} />}
              iconTone="dourado"
            />
            <MiniTile
              label="Recebido"
              value={formatCurrency(data.rendaRecebida)}
              icon={<IconCheckCircle size={16} />}
              iconTone="sucesso"
              delta={`${percentualRecebido}%`}
            />
            <MiniTile
              label="Contas Pagas"
              value={formatCurrency(data.totalPago)}
              icon={<IconCheckCircle size={16} />}
              iconTone="sucesso"
            />
          </div>
        </div>
      </div>

      <div className="stats-grade">
        <StatCard
          label="Total de Contas"
          value={formatCurrency(data.totalContas)}
          subtitle={`${data.contasPagasCount + data.contasPendentesCount + data.contasAtrasadasCount} contas`}
          icon={<IconFileText size={18} />}
          iconTone="info"
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
          label="Metas"
          value={formatCurrency(data.totalGuardadoMetas)}
          subtitle="Reservado"
          icon={<IconTarget size={18} />}
          iconTone="dourado"
        />
        <StatCard
          label="Prioridades"
          value={formatCurrency(data.totalGuardadoPrioridades)}
          subtitle="Reservado"
          icon={<IconClock size={18} />}
          iconTone="alerta"
        />
        <StatCard
          label="Dívidas"
          value={formatCurrency(data.totalDividasRestante)}
          subtitle="Total devido"
          icon={<IconAlertTriangle size={18} />}
          iconTone="perigo"
        />
        <StatCard
          label="Investimentos"
          value={formatCurrency(data.totalInvestimentos)}
          subtitle="Total investido"
          icon={<IconWallet size={18} />}
          iconTone="info"
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

      <div className="cartao">
        <div className="grafico-cabecalho">
          <h2 className="grafico-titulo">Fluxo de Caixa do Mês</h2>
          <div className="grafico-legenda">
            <span className="legenda-item">
              <span className="legenda-marcador-linha" style={{ background: "#b6b5bf" }} />
              Receitas
            </span>
            <span className="legenda-item">
              <span
                className="legenda-marcador-linha"
                style={{ background: "#726f7d" }}
              />
              Despesas
            </span>
            <span className="legenda-item">
              <span
                className="legenda-marcador-linha"
                style={{ background: "#f5f5f6" }}
              />
              Saldo
            </span>
          </div>
        </div>
        <GraficoFluxoCaixa pontos={data.pontosFluxo} />
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
            <div key={conta.id} className="item-lista-rica item-lista-rica-com-barra">
              <div className="item-lista-rica-linha">
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
              <BarraHorizontal
                valor={conta.valor}
                max={Math.max(...proximosVencimentos.map((c) => c.valor))}
              />
            </div>
          ))}
        </div>

        <div className="cartao">
          <div className="grafico-cabecalho">
            <h2 className="grafico-titulo">Gastos por Categoria</h2>
          </div>
          <GraficoGastosPorCategoria dados={data.gastosPorCategoria} total={data.totalContas} />
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
            const progresso = (meta.valorGuardado / meta.valorEstimado) * 100;
            return (
              <div key={meta.id} className="meta-progresso-item meta-progresso-item-anel">
                <AnelProgresso percentual={progresso} />
                <div className="meta-progresso-corpo">
                  <span className="meta-progresso-nome">{meta.nome}</span>
                  <span className="meta-progresso-valores">
                    {formatCurrency(meta.valorGuardado)} / {formatCurrency(meta.valorEstimado)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
