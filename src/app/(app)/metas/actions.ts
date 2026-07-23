"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirUsuarioAtual } from "@/lib/auth";
import { parseCurrencyInput, parseDateInput } from "@/lib/format";

export async function criarMeta(formData: FormData) {
  const usuario = await exigirUsuarioAtual();
  const dataDesejada = formData.get("dataDesejada");
  const familiaMembroId = String(formData.get("familiaMembroId") || "") || null;

  if (familiaMembroId) {
    await prisma.familiaMembro.findFirstOrThrow({
      where: { id: familiaMembroId, familiaId: usuario.familiaId },
    });
  }

  await prisma.meta.create({
    data: {
      familiaId: usuario.familiaId,
      nome: String(formData.get("nome")),
      tipo: String(formData.get("tipo")),
      categoria: String(formData.get("categoria") || "") || null,
      valorEstimado: parseCurrencyInput(formData.get("valorEstimado")),
      dataDesejada: dataDesejada ? parseDateInput(dataDesejada) : null,
      prioridade:
        (formData.get("prioridade") as "URGENTE" | "ALTA" | "MEDIA" | "BAIXA") ||
        "MEDIA",
      familiaMembroId,
      observacoes: String(formData.get("observacoes") || "") || null,
      linksPesquisados: String(formData.get("linksPesquisados") || "") || null,
    },
  });

  revalidatePath("/metas");
}

export async function aportarMeta(formData: FormData) {
  const usuario = await exigirUsuarioAtual();
  const id = String(formData.get("id"));
  const valor = parseCurrencyInput(formData.get("valorAporte"));

  const meta = await prisma.meta.findUniqueOrThrow({
    where: { id, familiaId: usuario.familiaId },
  });
  const novoValorGuardado = meta.valorGuardado + valor;

  await prisma.meta.update({
    where: { id, familiaId: usuario.familiaId },
    data: {
      valorGuardado: novoValorGuardado,
      status: novoValorGuardado >= meta.valorEstimado ? "CONCLUIDA" : "EM_ANDAMENTO",
    },
  });

  revalidatePath("/metas");
  revalidatePath("/");
}

export async function excluirMeta(formData: FormData) {
  const usuario = await exigirUsuarioAtual();
  const id = String(formData.get("id"));
  await prisma.meta.delete({ where: { id, familiaId: usuario.familiaId } });
  revalidatePath("/metas");
  revalidatePath("/");
}
