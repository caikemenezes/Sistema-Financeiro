"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { parseCurrencyInput, parseDateInput } from "@/lib/format";

export async function criarReceita(formData: FormData) {
  await prisma.receita.create({
    data: {
      nome: String(formData.get("nome")),
      tipo: String(formData.get("tipo")),
      valorPrevisto: parseCurrencyInput(formData.get("valorPrevisto")),
      dataPrevista: parseDateInput(formData.get("dataPrevista")),
      categoria: String(formData.get("categoria") || "") || null,
      recorrente: formData.get("recorrente") === "on",
      contaBancaria: String(formData.get("contaBancaria") || "") || null,
      observacao: String(formData.get("observacao") || "") || null,
    },
  });

  revalidatePath("/receitas");
  revalidatePath("/");
}

export async function marcarComoRecebida(formData: FormData) {
  const id = String(formData.get("id"));
  const receita = await prisma.receita.findUniqueOrThrow({ where: { id } });

  await prisma.receita.update({
    where: { id },
    data: {
      status: "RECEBIDO",
      dataRecebimento: new Date(),
      valorRecebido: receita.valorPrevisto,
    },
  });

  revalidatePath("/receitas");
  revalidatePath("/");
}

export async function excluirReceita(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.receita.delete({ where: { id } });
  revalidatePath("/receitas");
  revalidatePath("/");
}
