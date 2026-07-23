import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirUsuarioAtual } from "@/lib/auth";
import { formatCurrency } from "@/lib/format";
import { GraficoEvolucaoMensal, GraficoGastosPorCategoria } from "@/components/charts";
import { IconChevronLeft, IconChevronRight } from "@/components/icons";
import { InfoIcone } from "@/components/info-icone";

export const dynamic = "force-dynamic";

/* Rampa dourada ordinal — maior gasto recebe o tom mais forte, decrescendo
   por posição no ranking (não por identidade da categoria). Ver skill dataviz. */
const RAMPA_DOURADA = [
  "var(--grafico-dourado-1)",
  "var(--grafico-dourado-2)",
  "var(--grafico-dourado-3)",
  "var(--grafico-dourado-4)",
  "var(--grafico-dourado-5)",
  "var(--grafico-dourado-6)",
];

const MESES_LABEL = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string }>;
}) {
  const usuario = await exigirUsuarioAtual();
  const params = await searchParams;
  const anoAtual = new Date().getUTCFullYear();
  const ano = params.ano && /^\d{4}$/.test(params.ano) ? Number(params.ano) : anoAtual;

  const inicioAno = new Date(Date.UTC(ano, 0, 1));
  const fimAno = new Date(Date.UTC(ano + 1, 0, 1));

  const [receitasRecebidas, contasPagas, contasDoAno] = await Promise.all([
    prisma.receita.findMany({
      where: {
        familiaId: usuario.familiaId,
        status: "RECEBIDO",
        dataRecebimento: { gte: inicioAno, lt: fimAno },
      },
    }),
    prisma.contaMes.findMany({
      where: {
        familiaId: usuario.familiaId,
        status: "PAGA",
        dataPagamento: { gte: inicioAno, lt: fimAno },
      },
    }),
    prisma.contaMes.findMany({
      where: { familiaId: usuario.familiaId, vencimento: { gte: inicioAno, lt: fimAno } },
    }),
  ]);

  const pontosMensais = Array.from({ length: 12 }, (_, mes) => {
    const receitas = receitasRecebidas
      .filter((r) => r.dataRecebimento!.getUTCMonth() === mes)
      .reduce((soma, r) => soma + (r.valorRecebido ?? 0), 0);
    const despesas = contasPagas
      .filter((c) => c.dataPagamento!.getUTCMonth() === mes)
      .reduce((soma, c) => soma + c.valor, 0);
    return { mes, label: MESES_LABEL[mes], receitas, despesas };
  });

  const totalReceitasAno = pontosMensais.reduce((soma, p) => soma + p.receitas, 0);
  const totalDespesasAno = pontosMensais.reduce((soma, p) => soma + p.despesas, 0);
  const saldoAno = totalReceitasAno - totalDespesasAno;

  const somaPorCategoria = new Map<string, number>();
  for (const conta of contasDoAno) {
    somaPorCategoria.set(conta.categoria, (somaPorCategoria.get(conta.categoria) ?? 0) + conta.valor);
  }
  const totalContasAno = contasDoAno.reduce((soma, c) => soma + c.valor, 0);
  const gastosPorCategoria = Array.from(somaPorCategoria.entries())
    .map(([categoria, valor]) => ({
      categoria,
      valor,
      percentual: totalContasAno > 0 ? (valor / totalContasAno) * 100 : 0,
    }))
    .sort((a, b) => b.valor - a.valor)
    .map((item, indice) => ({
      ...item,
      cor: RAMPA_DOURADA[indice] ?? RAMPA_DOURADA[RAMPA_DOURADA.length - 1],
    }));

  return (
    <div className="pilha">
      <div className="linha-flex">
        <div>
          <h1 className="pagina-titulo">Relatórios</h1>
          <p className="pagina-subtitulo">Resumo do ano — receitas, despesas e categorias.</p>
        </div>
        <div className="seletor-periodo">
          <Link href={`/relatorios?ano=${ano - 1}`} className="botao-icone">
            <IconChevronLeft size={16} />
          </Link>
          <span>{ano}</span>
          <Link href={`/relatorios?ano=${ano + 1}`} className="botao-icone">
            <IconChevronRight size={16} />
          </Link>
        </div>
      </div>

      <div className="stats-grade">
        <div className="cartao">
          <p className="stat-rotulo">Receitas recebidas no ano</p>
          <p className="stat-valor stat-positivo">{formatCurrency(totalReceitasAno)}</p>
        </div>
        <div className="cartao">
          <p className="stat-rotulo">Contas pagas no ano</p>
          <p className="stat-valor stat-negativo">{formatCurrency(totalDespesasAno)}</p>
        </div>
        <div className="cartao">
          <p className="stat-rotulo">Saldo do ano</p>
          <p className={`stat-valor ${saldoAno >= 0 ? "stat-positivo" : "stat-negativo"}`}>
            {formatCurrency(saldoAno)}
          </p>
        </div>
      </div>

      <div className="cartao">
        <InfoIcone texto="Compara, mês a mês, quanto entrou (receitas recebidas) e quanto saiu (contas pagas) no ano selecionado." />
        <div className="grafico-cabecalho">
          <h2 className="grafico-titulo">Receitas x Despesas por mês</h2>
          <div className="grafico-legenda">
            <span className="legenda-item">
              <span className="legenda-marcador-linha" style={{ background: "var(--cor-sucesso-texto)" }} />
              Receitas
            </span>
            <span className="legenda-item">
              <span className="legenda-marcador-linha" style={{ background: "var(--cor-perigo-texto)" }} />
              Despesas
            </span>
          </div>
        </div>
        <GraficoEvolucaoMensal pontos={pontosMensais} />
      </div>

      <div className="cartao">
        <InfoIcone texto="Soma de todas as contas do ano, agrupadas por categoria (Moradia, Alimentação, etc.), pra ver onde o dinheiro mais foi." />
        <div className="grafico-cabecalho">
          <h2 className="grafico-titulo">Gastos por categoria no ano</h2>
        </div>
        <GraficoGastosPorCategoria dados={gastosPorCategoria} total={totalContasAno} />
      </div>
    </div>
  );
}
