"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { parseCurrencyInput } from "@/lib/format";

export async function atualizarObservacoes(formData: FormData) {
  const id = String(formData.get("id"));

  await prisma.meta.update({
    where: { id },
    data: {
      observacoes: String(formData.get("observacoes") || "") || null,
    },
  });

  revalidatePath(`/metas/${id}`);
}

export async function adicionarCotacao(formData: FormData) {
  const metaId = String(formData.get("metaId"));

  await prisma.metaCotacao.create({
    data: {
      metaId,
      item: String(formData.get("item")),
      fornecedor: String(formData.get("fornecedor")),
      valor: parseCurrencyInput(formData.get("valor")),
      link: String(formData.get("link") || "") || null,
    },
  });

  revalidatePath(`/metas/${metaId}`);
}

export async function alternarCotacaoEscolhida(formData: FormData) {
  const id = String(formData.get("id"));
  const metaId = String(formData.get("metaId"));

  const cotacao = await prisma.metaCotacao.findUniqueOrThrow({ where: { id } });
  await prisma.metaCotacao.update({
    where: { id },
    data: { escolhida: !cotacao.escolhida },
  });

  revalidatePath(`/metas/${metaId}`);
}

export async function excluirCotacao(formData: FormData) {
  const id = String(formData.get("id"));
  const metaId = String(formData.get("metaId"));

  await prisma.metaCotacao.delete({ where: { id } });

  revalidatePath(`/metas/${metaId}`);
}

export async function adicionarItemNecessario(formData: FormData) {
  const metaId = String(formData.get("metaId"));

  await prisma.metaItemNecessario.create({
    data: {
      metaId,
      nome: String(formData.get("nome")),
      valorEstimado: parseCurrencyInput(formData.get("valorEstimado")),
    },
  });

  revalidatePath(`/metas/${metaId}`);
}

export async function alternarItemConcluido(formData: FormData) {
  const id = String(formData.get("id"));
  const metaId = String(formData.get("metaId"));

  const item = await prisma.metaItemNecessario.findUniqueOrThrow({ where: { id } });
  await prisma.metaItemNecessario.update({
    where: { id },
    data: { concluido: !item.concluido },
  });

  revalidatePath(`/metas/${metaId}`);
}

export async function excluirItemNecessario(formData: FormData) {
  const id = String(formData.get("id"));
  const metaId = String(formData.get("metaId"));

  await prisma.metaItemNecessario.delete({ where: { id } });

  revalidatePath(`/metas/${metaId}`);
}
