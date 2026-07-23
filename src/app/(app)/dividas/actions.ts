"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirUsuarioAtual } from "@/lib/auth";
import { parseCurrencyInput, parseDateInput } from "@/lib/format";

export async function criarDivida(formData: FormData) {
  const usuario = await exigirUsuarioAtual();
  const vencimento = formData.get("vencimento");
  const valorOriginal = parseCurrencyInput(formData.get("valorOriginal"));

  await prisma.divida.create({
    data: {
      familiaId: usuario.familiaId,
      nome: String(formData.get("nome")),
      credor: String(formData.get("credor")),
      tipo: String(formData.get("tipo")),
      valorOriginal,
      valorAtual: valorOriginal,
      juros: formData.get("juros") ? parseCurrencyInput(formData.get("juros")) : null,
      numeroParcelas: formData.get("numeroParcelas")
        ? Number(formData.get("numeroParcelas"))
        : null,
      valorParcela: formData.get("valorParcela")
        ? parseCurrencyInput(formData.get("valorParcela"))
        : null,
      vencimento: vencimento ? parseDateInput(vencimento) : null,
      prioridade:
        (formData.get("prioridade") as "URGENTE" | "ALTA" | "MEDIA" | "BAIXA") ||
        "MEDIA",
      possibilidadeNegociacao: formData.get("possibilidadeNegociacao") === "on",
      observacoes: String(formData.get("observacoes") || "") || null,
    },
  });

  revalidatePath("/dividas");
  revalidatePath("/");
}

export async function editarDivida(formData: FormData) {
  const usuario = await exigirUsuarioAtual();
  const id = String(formData.get("id"));
  const vencimento = formData.get("vencimento");
  const valorParcela = formData.get("valorParcela");
  const parcelasPagas = Number(formData.get("parcelasPagas") ?? 0);

  const divida = await prisma.divida.findUniqueOrThrow({
    where: { id, familiaId: usuario.familiaId },
  });
  const quitada =
    valorParcela === null || valorParcela === ""
      ? false
      : divida.numeroParcelas !== null && parcelasPagas >= divida.numeroParcelas;

  await prisma.divida.update({
    where: { id, familiaId: usuario.familiaId },
    data: {
      nome: String(formData.get("nome")),
      credor: String(formData.get("credor")),
      parcelasPagas,
      valorAtual: parseCurrencyInput(formData.get("valorAtual")),
      valorParcela: valorParcela ? parseCurrencyInput(valorParcela) : null,
      vencimento: vencimento ? parseDateInput(vencimento) : null,
      status: quitada ? "QUITADA" : divida.status === "QUITADA" ? "EM_DIA" : divida.status,
    },
  });

  revalidatePath("/dividas");
  revalidatePath("/");
}

export async function pagarParcelaDivida(formData: FormData) {
  const usuario = await exigirUsuarioAtual();
  const id = String(formData.get("id"));
  const divida = await prisma.divida.findUniqueOrThrow({
    where: { id, familiaId: usuario.familiaId },
  });

  const valorPago = divida.valorParcela ?? divida.valorAtual;
  const novoValorAtual = Math.max(0, divida.valorAtual - valorPago);
  const novasParcelasPagas = divida.parcelasPagas + 1;
  const quitada =
    novoValorAtual === 0 || (divida.numeroParcelas !== null && novasParcelasPagas >= divida.numeroParcelas);

  // A cada parcela paga, o vencimento avança um mês — passa a representar
  // a data da PRÓXIMA parcela em aberto, em vez de ficar parado na data
  // original e parecer atrasado pra sempre.
  const proximoVencimento =
    divida.vencimento && !quitada
      ? new Date(
          Date.UTC(
            divida.vencimento.getUTCFullYear(),
            divida.vencimento.getUTCMonth() + 1,
            divida.vencimento.getUTCDate()
          )
        )
      : divida.vencimento;

  await prisma.divida.update({
    where: { id, familiaId: usuario.familiaId },
    data: {
      valorAtual: novoValorAtual,
      parcelasPagas: novasParcelasPagas,
      vencimento: proximoVencimento,
      status: quitada ? "QUITADA" : "EM_DIA",
    },
  });

  revalidatePath("/dividas");
  revalidatePath("/");
}

export async function excluirDivida(formData: FormData) {
  const usuario = await exigirUsuarioAtual();
  const id = String(formData.get("id"));
  await prisma.divida.delete({ where: { id, familiaId: usuario.familiaId } });
  revalidatePath("/dividas");
  revalidatePath("/");
}
