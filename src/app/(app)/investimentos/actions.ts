"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirUsuarioAtual } from "@/lib/auth";
import { parseCurrencyInput, parseDateInput } from "@/lib/format";

export async function criarInvestimento(formData: FormData) {
  const usuario = await exigirUsuarioAtual();
  const valorAplicado = parseCurrencyInput(formData.get("valorAplicado"));
  const prazo = formData.get("prazo");

  await prisma.investimento.create({
    data: {
      familiaId: usuario.familiaId,
      nome: String(formData.get("nome")),
      objetivo: String(formData.get("objetivo")),
      instituicao: String(formData.get("instituicao") || "") || null,
      tipo: String(formData.get("tipo") || "") || null,
      valorAplicado,
      valorAtual: valorAplicado,
      aporteMensal: formData.get("aporteMensal")
        ? parseCurrencyInput(formData.get("aporteMensal"))
        : null,
      prazo: prazo ? parseDateInput(prazo) : null,
      liquidez: String(formData.get("liquidez") || "") || null,
      rentabilidadeInformada: String(formData.get("rentabilidadeInformada") || "") || null,
    },
  });

  revalidatePath("/investimentos");
  revalidatePath("/");
}

export async function registrarAporte(formData: FormData) {
  const usuario = await exigirUsuarioAtual();
  const id = String(formData.get("id"));
  const valorAporte = parseCurrencyInput(formData.get("valorAporte"));

  const investimento = await prisma.investimento.findUniqueOrThrow({
    where: { id, familiaId: usuario.familiaId },
  });

  await prisma.investimento.update({
    where: { id, familiaId: usuario.familiaId },
    data: {
      valorAtual: investimento.valorAtual + valorAporte,
      dataUltimoAporte: new Date(),
    },
  });

  revalidatePath("/investimentos");
  revalidatePath("/");
}

export async function excluirInvestimento(formData: FormData) {
  const usuario = await exigirUsuarioAtual();
  const id = String(formData.get("id"));
  await prisma.investimento.delete({ where: { id, familiaId: usuario.familiaId } });
  revalidatePath("/investimentos");
  revalidatePath("/");
}
