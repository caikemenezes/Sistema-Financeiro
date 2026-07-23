import { prisma } from "@/lib/prisma";
import { exigirUsuarioAtual } from "@/lib/auth";
import { SimuladorClient, type ItemSimulacao } from "./simulador-client";

export const dynamic = "force-dynamic";

function mesesRestantes(data: Date | null): number | null {
  if (!data) return null;
  const hoje = new Date();
  const meses =
    (data.getUTCFullYear() - hoje.getUTCFullYear()) * 12 + (data.getUTCMonth() - hoje.getUTCMonth());
  return Math.max(1, meses);
}

export default async function SimuladorPage() {
  const usuario = await exigirUsuarioAtual();
  const hoje = new Date();
  const inicioMes = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), 1));
  const fimMes = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() + 1, 1));

  const [receitasDoMes, contasPendentes, dividasAtivas, metasAtivas, prioridadesAtivas, investimentos] =
    await Promise.all([
      prisma.receita.findMany({
        where: { familiaId: usuario.familiaId, dataPrevista: { gte: inicioMes, lt: fimMes } },
      }),
      prisma.contaMes.findMany({
        where: {
          familiaId: usuario.familiaId,
          status: { not: "PAGA" },
          vencimento: { gte: inicioMes, lt: fimMes },
        },
      }),
      prisma.divida.findMany({
        where: { familiaId: usuario.familiaId, status: { not: "QUITADA" } },
      }),
      prisma.meta.findMany({
        where: { familiaId: usuario.familiaId, status: { notIn: ["CONCLUIDA", "CANCELADA"] } },
      }),
      prisma.necessidade.findMany({
        where: { familiaId: usuario.familiaId, status: { notIn: ["CONCLUIDA", "CANCELADA"] } },
      }),
      prisma.investimento.findMany({ where: { familiaId: usuario.familiaId } }),
    ]);

  const rendaInicial = receitasDoMes.reduce((soma, receita) => soma + receita.valorPrevisto, 0);

  const itens: ItemSimulacao[] = [
    ...contasPendentes.map((conta) => ({
      id: `conta-${conta.id}`,
      nome: conta.nome,
      categoria: "Contas do Mês" as const,
      valorSugerido: conta.valor,
    })),
    ...dividasAtivas.map((divida) => ({
      id: `divida-${divida.id}`,
      nome: divida.nome,
      categoria: "Dívidas" as const,
      valorSugerido: divida.valorParcela ?? 0,
      valorParcela: divida.valorParcela ?? undefined,
      parcelasRestantes: divida.numeroParcelas
        ? Math.max(1, divida.numeroParcelas - divida.parcelasPagas)
        : undefined,
    })),
    ...metasAtivas.map((meta) => {
      const valorRestante = Math.max(0, meta.valorEstimado - meta.valorGuardado);
      const meses = mesesRestantes(meta.dataDesejada);
      return {
        id: `meta-${meta.id}`,
        nome: meta.nome,
        categoria: "Metas" as const,
        valorSugerido: meses ? valorRestante / meses : 0,
      };
    }),
    ...prioridadesAtivas.map((item) => {
      const valorRestante = Math.max(0, item.valorEstimado - item.valorGuardado);
      const meses = mesesRestantes(item.mesPlanejado) ?? 1;
      return {
        id: `prioridade-${item.id}`,
        nome: item.item,
        categoria: "Prioridades" as const,
        valorSugerido: valorRestante / meses,
      };
    }),
    ...investimentos.map((investimento) => ({
      id: `investimento-${investimento.id}`,
      nome: investimento.nome,
      categoria: "Investimentos" as const,
      valorSugerido: investimento.aporteMensal ?? 0,
    })),
  ];

  return (
    <div className="pilha">
      <div>
        <h1 className="pagina-titulo">Simulador</h1>
        <p className="pagina-subtitulo">
          Estime uma renda e veja o que consegue fazer com ela — ajuste os valores abaixo para
          testar cenários.
        </p>
      </div>

      <SimuladorClient rendaInicial={rendaInicial} itensIniciais={itens} />
    </div>
  );
}
