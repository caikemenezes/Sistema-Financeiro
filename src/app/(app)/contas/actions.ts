"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { parseCurrencyInput, parseDateInput } from "@/lib/format";

export async function criarConta(formData: FormData) {
  await prisma.contaMes.create({
    data: {
      nome: String(formData.get("nome")),
      categoria: String(formData.get("categoria")),
      subcategoria: String(formData.get("subcategoria") || "") || null,
      valor: parseCurrencyInput(formData.get("valor")),
      vencimento: parseDateInput(formData.get("vencimento")),
      formaPagamento: String(formData.get("formaPagamento") || "") || null,
      contaBancaria: String(formData.get("contaBancaria") || "") || null,
      tipo: formData.get("tipo") === "VARIAVEL" ? "VARIAVEL" : "FIXA",
      recorrenteMensal: formData.get("recorrenteMensal") === "on",
      observacoes: String(formData.get("observacoes") || "") || null,
    },
  });

  revalidatePath("/contas");
  revalidatePath("/");
}

export async function editarConta(formData: FormData) {
  const id = String(formData.get("id"));

  await prisma.contaMes.update({
    where: { id },
    data: {
      nome: String(formData.get("nome")),
      categoria: String(formData.get("categoria")),
      valor: parseCurrencyInput(formData.get("valor")),
      vencimento: parseDateInput(formData.get("vencimento")),
    },
  });

  revalidatePath("/contas");
  revalidatePath("/");
}

export async function marcarComoPaga(formData: FormData) {
  const id = String(formData.get("id"));

  await prisma.contaMes.update({
    where: { id },
    data: {
      status: "PAGA",
      dataPagamento: new Date(),
    },
  });

  revalidatePath("/contas");
  revalidatePath("/");
}

export async function excluirConta(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.contaMes.delete({ where: { id } });
  revalidatePath("/contas");
  revalidatePath("/");
}
