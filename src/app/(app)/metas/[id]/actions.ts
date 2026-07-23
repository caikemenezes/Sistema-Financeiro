"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirUsuarioAtual } from "@/lib/auth";
import { parseCurrencyInput } from "@/lib/format";

export async function atualizarObservacoes(formData: FormData) {
  const usuario = await exigirUsuarioAtual();
  const id = String(formData.get("id"));

  await prisma.meta.update({
    where: { id, familiaId: usuario.familiaId },
    data: {
      observacoes: String(formData.get("observacoes") || "") || null,
    },
  });

  revalidatePath(`/metas/${id}`);
}

export async function adicionarCotacao(formData: FormData) {
  const usuario = await exigirUsuarioAtual();
  const metaId = String(formData.get("metaId"));

  await prisma.meta.findUniqueOrThrow({
    where: { id: metaId, familiaId: usuario.familiaId },
  });

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
  const usuario = await exigirUsuarioAtual();
  const id = String(formData.get("id"));
  const metaId = String(formData.get("metaId"));

  const cotacao = await prisma.metaCotacao.findFirstOrThrow({
    where: { id, meta: { familiaId: usuario.familiaId } },
  });
  await prisma.metaCotacao.update({
    where: { id },
    data: { escolhida: !cotacao.escolhida },
  });

  revalidatePath(`/metas/${metaId}`);
}

export async function excluirCotacao(formData: FormData) {
  const usuario = await exigirUsuarioAtual();
  const id = String(formData.get("id"));
  const metaId = String(formData.get("metaId"));

  await prisma.metaCotacao.delete({
    where: { id, meta: { familiaId: usuario.familiaId } },
  });

  revalidatePath(`/metas/${metaId}`);
}

export async function adicionarItemNecessario(formData: FormData) {
  const usuario = await exigirUsuarioAtual();
  const metaId = String(formData.get("metaId"));

  await prisma.meta.findUniqueOrThrow({
    where: { id: metaId, familiaId: usuario.familiaId },
  });

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
  const usuario = await exigirUsuarioAtual();
  const id = String(formData.get("id"));
  const metaId = String(formData.get("metaId"));

  const item = await prisma.metaItemNecessario.findFirstOrThrow({
    where: { id, meta: { familiaId: usuario.familiaId } },
  });
  await prisma.metaItemNecessario.update({
    where: { id },
    data: { concluido: !item.concluido },
  });

  revalidatePath(`/metas/${metaId}`);
}

export async function excluirItemNecessario(formData: FormData) {
  const usuario = await exigirUsuarioAtual();
  const id = String(formData.get("id"));
  const metaId = String(formData.get("metaId"));

  await prisma.metaItemNecessario.delete({
    where: { id, meta: { familiaId: usuario.familiaId } },
  });

  revalidatePath(`/metas/${metaId}`);
}
