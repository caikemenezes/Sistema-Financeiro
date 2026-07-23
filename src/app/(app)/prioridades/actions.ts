"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirUsuarioAtual } from "@/lib/auth";
import { parseCurrencyInput, parseDateInput } from "@/lib/format";

export async function criarPrioridade(formData: FormData) {
  const usuario = await exigirUsuarioAtual();

  await prisma.necessidade.create({
    data: {
      familiaId: usuario.familiaId,
      item: String(formData.get("item")),
      pessoaNome: String(formData.get("pessoaNome") || "") || null,
      categoria: String(formData.get("categoria")),
      prioridade:
        (formData.get("prioridade") as "URGENTE" | "ALTA" | "MEDIA" | "BAIXA") ||
        "MEDIA",
      valorEstimado: parseCurrencyInput(formData.get("valorEstimado")),
      mesPlanejado: parseDateInput(formData.get("mesPlanejado")),
    },
  });

  revalidatePath("/prioridades");
  revalidatePath("/familia");
  revalidatePath("/");
}

export async function aportarPrioridade(formData: FormData) {
  const usuario = await exigirUsuarioAtual();
  const id = String(formData.get("id"));
  const valor = parseCurrencyInput(formData.get("valorAporte"));

  const necessidade = await prisma.necessidade.findUniqueOrThrow({
    where: { id, familiaId: usuario.familiaId },
  });
  const novoValorGuardado = necessidade.valorGuardado + valor;

  await prisma.necessidade.update({
    where: { id, familiaId: usuario.familiaId },
    data: {
      valorGuardado: novoValorGuardado,
      status: novoValorGuardado >= necessidade.valorEstimado ? "CONCLUIDA" : "EM_ANDAMENTO",
    },
  });

  revalidatePath("/prioridades");
  revalidatePath("/familia");
  revalidatePath("/");
}

export async function excluirPrioridade(formData: FormData) {
  const usuario = await exigirUsuarioAtual();
  const id = String(formData.get("id"));
  await prisma.necessidade.delete({ where: { id, familiaId: usuario.familiaId } });
  revalidatePath("/prioridades");
  revalidatePath("/familia");
  revalidatePath("/");
}
