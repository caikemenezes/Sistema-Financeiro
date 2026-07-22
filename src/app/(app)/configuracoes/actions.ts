"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashSenha, verificarSenha, obterUsuarioAtual } from "@/lib/auth";

export async function definirTema(formData: FormData) {
  const tema = String(formData.get("tema")) === "claro" ? "claro" : "escuro";
  const cookieStore = await cookies();
  cookieStore.set("tema", tema, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/", "layout");
}

export type EstadoFormulario = { erro?: string; sucesso?: string } | undefined;

export async function alterarSenha(
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const usuario = await obterUsuarioAtual();
  if (!usuario) redirect("/login");

  const senhaAtual = String(formData.get("senhaAtual") || "");
  const novaSenha = String(formData.get("novaSenha") || "");

  if (!verificarSenha(senhaAtual, usuario.senhaHash)) {
    return { erro: "Senha atual incorreta." };
  }
  if (novaSenha.length < 6) {
    return { erro: "A nova senha precisa ter pelo menos 6 caracteres." };
  }

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { senhaHash: hashSenha(novaSenha) },
  });

  return { sucesso: "Senha alterada com sucesso." };
}

export async function convidarFamiliar(
  _estado: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const usuario = await obterUsuarioAtual();
  if (!usuario) redirect("/login");

  const nome = String(formData.get("nome") || "").trim();
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const senha = String(formData.get("senha") || "");

  if (!nome || !email || senha.length < 6) {
    return { erro: "Preencha nome, e-mail e uma senha com pelo menos 6 caracteres." };
  }

  const existente = await prisma.usuario.findUnique({ where: { email } });
  if (existente) {
    return { erro: "Já existe uma conta com esse e-mail." };
  }

  await prisma.usuario.create({ data: { nome, email, senhaHash: hashSenha(senha) } });

  revalidatePath("/configuracoes");
  return { sucesso: `Conta criada para ${nome}.` };
}
