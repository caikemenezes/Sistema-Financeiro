"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { parseCurrencyInput, parseDateInput } from "@/lib/format";

export async function criarMembro(formData: FormData) {
  const dataNascimento = formData.get("dataNascimento");

  await prisma.familiaMembro.create({
    data: {
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
  const id = String(formData.get("id"));
  await prisma.familiaMembro.delete({ where: { id } });
  revalidatePath("/familia");
  revalidatePath("/prioridades");
}

export async function criarNecessidade(formData: FormData) {
  await prisma.necessidade.create({
    data: {
      item: String(formData.get("item")),
      familiaMembroId: String(formData.get("familiaMembroId") || "") || null,
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
  const id = String(formData.get("id"));
  await prisma.necessidade.update({
    where: { id },
    data: { status: "CONCLUIDA" },
  });
  revalidatePath("/familia");
  revalidatePath("/prioridades");
}

export async function excluirNecessidade(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.necessidade.delete({ where: { id } });
  revalidatePath("/familia");
  revalidatePath("/prioridades");
}
