"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirUsuarioAtual } from "@/lib/auth";
import { parseCurrencyInput, parseDateInput } from "@/lib/format";

export async function criarMembro(formData: FormData) {
  const usuario = await exigirUsuarioAtual();
  const dataNascimento = formData.get("dataNascimento");

  await prisma.familiaMembro.create({
    data: {
      familiaId: usuario.familiaId,
      nome: String(formData.get("nome")),
      parentesco: String(formData.get("parentesco")),
      dataNascimento: dataNascimento ? parseDateInput(dataNascimento) : null,
      observacoes: String(formData.get("observacoes") || "") || null,
    },
  });

  revalidatePath("/familia");
  revalidatePath("/prioridades");
}

export async function excluirMembro(formData: FormData) {
  const usuario = await exigirUsuarioAtual();
  const id = String(formData.get("id"));
  await prisma.familiaMembro.delete({ where: { id, familiaId: usuario.familiaId } });
  revalidatePath("/familia");
  revalidatePath("/prioridades");
}

export async function criarNecessidade(formData: FormData) {
  const usuario = await exigirUsuarioAtual();
  const familiaMembroId = String(formData.get("familiaMembroId") || "") || null;

  if (familiaMembroId) {
    await prisma.familiaMembro.findFirstOrThrow({
      where: { id: familiaMembroId, familiaId: usuario.familiaId },
    });
  }

  await prisma.necessidade.create({
    data: {
      familiaId: usuario.familiaId,
      item: String(formData.get("item")),
      familiaMembroId,
      categoria: String(formData.get("categoria")),
      prioridade:
        (formData.get("prioridade") as "URGENTE" | "ALTA" | "MEDIA" | "BAIXA") ||
        "MEDIA",
      valorEstimado: parseCurrencyInput(formData.get("valorEstimado")),
      mesPlanejado: parseDateInput(formData.get("mesPlanejado")),
    },
  });

  revalidatePath("/familia");
  revalidatePath("/prioridades");
}

export async function concluirNecessidade(formData: FormData) {
  const usuario = await exigirUsuarioAtual();
  const id = String(formData.get("id"));
  await prisma.necessidade.update({
    where: { id, familiaId: usuario.familiaId },
    data: { status: "CONCLUIDA" },
  });
  revalidatePath("/familia");
  revalidatePath("/prioridades");
}

export async function excluirNecessidade(formData: FormData) {
  const usuario = await exigirUsuarioAtual();
  const id = String(formData.get("id"));
  await prisma.necessidade.delete({ where: { id, familiaId: usuario.familiaId } });
  revalidatePath("/familia");
  revalidatePath("/prioridades");
}
