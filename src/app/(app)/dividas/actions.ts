"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { parseCurrencyInput, parseDateInput } from "@/lib/format";

export async function criarDivida(formData: FormData) {
  const vencimento = formData.get("vencimento");
  const valorOriginal = parseCurrencyInput(formData.get("valorOriginal"));

  await prisma.divida.create({
    data: {
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

export async function pagarParcelaDivida(formData: FormData) {
  const id = String(formData.get("id"));
  const divida = await prisma.divida.findUniqueOrThrow({ where: { id } });

  const valorPago = divida.valorParcela ?? divida.valorAtual;
  const novoValorAtual = Math.max(0, divida.valorAtual - valorPago);

  await prisma.divida.update({
    where: { id },
    data: {
      valorAtual: novoValorAtual,
      parcelasPagas: divida.parcelasPagas + 1,
      status: novoValorAtual === 0 ? "QUITADA" : "EM_DIA",
    },
  });

  revalidatePath("/dividas");
  revalidatePath("/");
}

export async function excluirDivida(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.divida.delete({ where: { id } });
  revalidatePath("/dividas");
  revalidatePath("/");
}
