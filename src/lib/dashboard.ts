import { prisma } from "@/lib/prisma";

function mesAtualUTC(referencia: Date) {
  const inicio = new Date(Date.UTC(referencia.getUTCFullYear(), referencia.getUTCMonth(), 1));
  const fim = new Date(Date.UTC(referencia.getUTCFullYear(), referencia.getUTCMonth() + 1, 1));
  return { inicio, fim };
}

const CATEGORIA_COR: Record<string, string> = {
  Moradia: "var(--grafico-1)",
  Alimentação: "var(--grafico-2)",
  Transporte: "var(--grafico-3)",
  Saúde: "var(--grafico-4)",
  Assinaturas: "var(--grafico-5)",
  "Trabalho e estudos": "var(--grafico-6)",
};

export async function getDashboardData(mesReferencia: Date = new Date()) {
  const { inicio, fim } = mesAtualUTC(mesReferencia);
  const hoje = new Date();
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
    prisma.receita.findMany({ where: { dataPrevista: { gte: inicio, lt: fim } } }),
    prisma.contaMes.findMany({ where: { vencimento: { gte: inicio, lt: fim } } }),
    prisma.meta.findMany({
      where: { status: { notIn: ["CONCLUIDA", "CANCELADA"] } },
      orderBy: [{ prioridade: "asc" }, { createdAt: "desc" }],
      include: { familiaMembro: true },
    }),
    prisma.necessidade.findMany({
      where: { status: { notIn: ["CONCLUIDA", "CANCELADA"] } },
    }),
    prisma.divida.findMany({ where: { status: { not: "QUITADA" } } }),
    prisma.investimento.findMany(),
    prisma.receita.findMany({
      where: { status: "RECEBIDO", dataRecebimento: { gte: inicio, lt: fim } },
    }),
    prisma.contaMes.findMany({
      where: { status: "PAGA", dataPagamento: { gte: inicio, lt: fim } },
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
    where: { mesPlanejado: { gte: inicio, lt: fim }, status: { not: "CONCLUIDA" } },
    include: { familiaMembro: true },
  });

  // Lembretes de vencimento (independem do mês sendo visualizado no dashboard)
  const inicioHojeUTC = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate()));
  const em3DiasUTC = new Date(inicioHojeUTC.getTime() + 3 * 24 * 60 * 60 * 1000);
  const fimJanelaLembretes = new Date(inicioHojeUTC.getTime() + 4 * 24 * 60 * 60 * 1000);
  const contasParaLembrete = await prisma.contaMes.findMany({
    where: {
      status: "PENDENTE",
      vencimento: { gte: inicioHojeUTC, lt: fimJanelaLembretes },
    },
  });
  const contasVencendoHoje = contasParaLembrete.filter(
    (c) => c.vencimento.getTime() === inicioHojeUTC.getTime()
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
      cor: CATEGORIA_COR[categoria] ?? "var(--cor-texto-suave)",
    }))
    .sort((a, b) => b.valor - a.valor);

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
