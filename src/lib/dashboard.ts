import { prisma } from "@/lib/prisma";
import { inicioDoDiaUTC } from "@/lib/format";

function mesAtualUTC(referencia: Date) {
  const inicio = new Date(Date.UTC(referencia.getUTCFullYear(), referencia.getUTCMonth(), 1));
  const fim = new Date(Date.UTC(referencia.getUTCFullYear(), referencia.getUTCMonth() + 1, 1));
  return { inicio, fim };
}

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

export async function getDashboardData(familiaId: string, mesReferencia: Date = new Date()) {
  const { inicio, fim } = mesAtualUTC(mesReferencia);
  const hoje = inicioDoDiaUTC();
  const em7dias = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    receitasDoMes,
    contasDoMes,
    metasAtivas,
    prioridadesAtivas,
    dividasAtivas,
    investimentos,
    receitasRecebidasNoMes,
    contasPagasNoMes,
  ] = await Promise.all([
    prisma.receita.findMany({ where: { familiaId, dataPrevista: { gte: inicio, lt: fim } } }),
    prisma.contaMes.findMany({ where: { familiaId, vencimento: { gte: inicio, lt: fim } } }),
    prisma.meta.findMany({
      where: { familiaId, status: { notIn: ["CONCLUIDA", "CANCELADA"] } },
      orderBy: [{ prioridade: "asc" }, { createdAt: "desc" }],
      include: { familiaMembro: true },
    }),
    prisma.necessidade.findMany({
      where: { familiaId, status: { notIn: ["CONCLUIDA", "CANCELADA"] } },
    }),
    prisma.divida.findMany({ where: { familiaId, status: { not: "QUITADA" } } }),
    prisma.investimento.findMany({ where: { familiaId } }),
    prisma.receita.findMany({
      where: { familiaId, status: "RECEBIDO", dataRecebimento: { gte: inicio, lt: fim } },
    }),
    prisma.contaMes.findMany({
      where: { familiaId, status: "PAGA", dataPagamento: { gte: inicio, lt: fim } },
    }),
  ]);

  const rendaPrevista = receitasDoMes.reduce((s, r) => s + r.valorPrevisto, 0);
  const rendaRecebida = receitasDoMes
    .filter((r) => r.status === "RECEBIDO")
    .reduce((s, r) => s + (r.valorRecebido ?? 0), 0);

  const totalContas = contasDoMes.reduce((s, c) => s + c.valor, 0);
  const contasPagas = contasDoMes.filter((c) => c.status === "PAGA");
  const contasPendentes = contasDoMes.filter(
    (c) => c.status === "PENDENTE" && c.vencimento >= hoje
  );
  const contasAtrasadas = contasDoMes.filter(
    (c) => c.status === "PENDENTE" && c.vencimento < hoje
  );
  const totalPago = contasPagas.reduce((s, c) => s + c.valor, 0);
  const totalPendente = totalContas - totalPago;
  const totalAtrasado = contasAtrasadas.reduce((s, c) => s + c.valor, 0);

  const totalGuardadoMetas = metasAtivas.reduce((s, m) => s + m.valorGuardado, 0);
  const totalGuardadoPrioridades = prioridadesAtivas.reduce((s, p) => s + p.valorGuardado, 0);
  const totalDividasRestante = dividasAtivas.reduce((s, d) => s + d.valorAtual, 0);
  const totalInvestimentos = investimentos.reduce((s, i) => s + i.valorAtual, 0);

  const saldoDisponivel = rendaRecebida - totalPago;
  const saldoPrevistoFimDoMes = rendaPrevista - totalContas;

  const contasProximasVencimento = contasDoMes.filter(
    (c) => c.status === "PENDENTE" && c.vencimento >= hoje && c.vencimento <= em7dias
  );
  const dividasProximasVencimento = dividasAtivas.filter(
    (d) => d.vencimento && d.vencimento >= hoje && d.vencimento <= em7dias
  );
  const necessidadesDoMes = await prisma.necessidade.findMany({
    where: { familiaId, mesPlanejado: { gte: inicio, lt: fim }, status: { not: "CONCLUIDA" } },
    include: { familiaMembro: true },
  });

  // Lembretes de vencimento (independem do mês sendo visualizado no dashboard)
  // "hoje" já está normalizado pra meia-noite UTC lá em cima.
  const em3DiasUTC = new Date(hoje.getTime() + 3 * 24 * 60 * 60 * 1000);
  const fimJanelaLembretes = new Date(hoje.getTime() + 4 * 24 * 60 * 60 * 1000);
  const contasParaLembrete = await prisma.contaMes.findMany({
    where: {
      familiaId,
      status: "PENDENTE",
      vencimento: { gte: hoje, lt: fimJanelaLembretes },
    },
  });
  const contasVencendoHoje = contasParaLembrete.filter(
    (c) => c.vencimento.getTime() === hoje.getTime()
  );
  const contasVencendoEm3Dias = contasParaLembrete.filter(
    (c) => c.vencimento.getTime() === em3DiasUTC.getTime()
  );

  // Fluxo de caixa acumulado do mês, dia a dia, até hoje (ou até o fim, se for mês passado)
  const ultimoDiaDoMes = new Date(
    Date.UTC(inicio.getUTCFullYear(), inicio.getUTCMonth() + 1, 0)
  ).getUTCDate();
  const diaHoje = fim <= hoje ? ultimoDiaDoMes : inicio > hoje ? 0 : hoje.getUTCDate();

  const pontosFluxo: { dia: number; receitas: number; despesas: number; saldo: number }[] = [
    { dia: 0, receitas: 0, despesas: 0, saldo: 0 },
  ];
  let acumReceitas = 0;
  let acumDespesas = 0;
  for (let dia = 1; dia <= diaHoje; dia++) {
    acumReceitas += receitasRecebidasNoMes
      .filter((r) => r.dataRecebimento!.getUTCDate() === dia)
      .reduce((s, r) => s + (r.valorRecebido ?? 0), 0);
    acumDespesas += contasPagasNoMes
      .filter((c) => c.dataPagamento!.getUTCDate() === dia)
      .reduce((s, c) => s + c.valor, 0);
    pontosFluxo.push({
      dia,
      receitas: acumReceitas,
      despesas: acumDespesas,
      saldo: acumReceitas - acumDespesas,
    });
  }

  // Gastos por categoria (contas do mês, planejadas)
  const somaPorCategoria = new Map<string, number>();
  for (const conta of contasDoMes) {
    somaPorCategoria.set(conta.categoria, (somaPorCategoria.get(conta.categoria) ?? 0) + conta.valor);
  }
  const gastosPorCategoria = Array.from(somaPorCategoria.entries())
    .map(([categoria, valor]) => ({
      categoria,
      valor,
      percentual: totalContas > 0 ? (valor / totalContas) * 100 : 0,
    }))
    .sort((a, b) => b.valor - a.valor)
    .map((item, indice) => ({
      ...item,
      cor: RAMPA_DOURADA[indice] ?? RAMPA_DOURADA[RAMPA_DOURADA.length - 1],
    }));

  const metasEmAndamento = metasAtivas.slice(0, 3);

  return {
    rendaPrevista,
    rendaRecebida,
    totalContas,
    totalPago,
    totalPendente,
    totalAtrasado,
    contasPagasCount: contasPagas.length,
    contasPendentesCount: contasPendentes.length,
    contasAtrasadasCount: contasAtrasadas.length,
    totalGuardadoMetas,
    totalGuardadoPrioridades,
    totalDividasRestante,
    totalInvestimentos,
    saldoDisponivel,
    saldoPrevistoFimDoMes,
    contasAtrasadas,
    contasProximasVencimento,
    contasVencendoHoje,
    contasVencendoEm3Dias,
    dividasProximasVencimento,
    necessidadesDoMes,
    metasEmAndamento,
    pontosFluxo,
    gastosPorCategoria,
  };
}
