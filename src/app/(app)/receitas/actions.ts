"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirUsuarioAtual } from "@/lib/auth";
import { parseCurrencyInput, parseDateInput } from "@/lib/format";

export async function criarReceita(formData: FormData) {
  const usuario = await exigirUsuarioAtual();

  await prisma.receita.create({
    data: {
      familiaId: usuario.familiaId,
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
  const usuario = await exigirUsuarioAtual();
  const id = String(formData.get("id"));
  const receita = await prisma.receita.findUniqueOrThrow({
    where: { id, familiaId: usuario.familiaId },
  });

  await prisma.receita.update({
    where: { id, familiaId: usuario.familiaId },
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
  const usuario = await exigirUsuarioAtual();
  const id = String(formData.get("id"));
  await prisma.receita.delete({ where: { id, familiaId: usuario.familiaId } });
  revalidatePath("/receitas");
  revalidatePath("/");
}
