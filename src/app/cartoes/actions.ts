"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { parseCurrencyInput, parseDateInput } from "@/lib/format";

export async function criarCartao(formData: FormData) {
  await prisma.cartao.create({
    data: {
      nome: String(formData.get("nome")),
      banco: String(formData.get("banco") || "") || null,
      limiteTotal: parseCurrencyInput(formData.get("limiteTotal")),
      diaFechamento: Number(formData.get("diaFechamento")),
      diaVencimento: Number(formData.get("diaVencimento")),
    },
  });

  revalidatePath("/cartoes");
  revalidatePath("/");
}

export async function criarCompra(formData: FormData) {
  const cartaoId = String(formData.get("cartaoId"));
  const valorTotal = parseCurrencyInput(formData.get("valorTotal"));
  const numeroParcelas = Math.max(1, Number(formData.get("numeroParcelas")) || 1);
  const dataCompra = parseDateInput(formData.get("dataCompra"));
  const familiaMembroId = String(formData.get("familiaMembroId") || "") || null;

  const valorParcela = Math.round((valorTotal / numeroParcelas) * 100) / 100;

  await prisma.compraCartao.create({
    data: {
      cartaoId,
      descricao: String(formData.get("descricao")),
      categoria: String(formData.get("categoria") || "") || "Outros",
      valorTotal,
      numeroParcelas,
      dataCompra,
      familiaMembroId,
      classificacao:
        (formData.get("classificacao") as "ESSENCIAL" | "IMPORTANTE" | "SUPERFLUA") ||
        "IMPORTANTE",
      parcelas: {
        create: Array.from({ length: numeroParcelas }, (_, index) => {
          const mesReferencia = new Date(
            Date.UTC(dataCompra.getUTCFullYear(), dataCompra.getUTCMonth() + index, 1)
          );
          return {
            numero: index + 1,
            valor: valorParcela,
            mesReferencia,
          };
        }),
      },
    },
  });

  revalidatePath("/cartoes");
  revalidatePath("/");
}

export async function marcarProximaParcelaPaga(formData: FormData) {
  const compraId = String(formData.get("compraId"));

  const proximaParcela = await prisma.parcela.findFirst({
    where: { compraId, paga: false },
    orderBy: { numero: "asc" },
  });

  if (proximaParcela) {
    await prisma.parcela.update({
      where: { id: proximaParcela.id },
      data: { paga: true, pagaEm: new Date() },
    });
  }

  revalidatePath("/cartoes");
  revalidatePath("/");
}

export async function excluirCompra(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.parcela.deleteMany({ where: { compraId: id } });
  await prisma.compraCartao.delete({ where: { id } });
  revalidatePath("/cartoes");
  revalidatePath("/");
}
