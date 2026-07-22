"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashSenha, verificarSenha, criarSessao } from "@/lib/auth";

export type EstadoLogin = { erro?: string } | undefined;

export async function criarConta(_estado: EstadoLogin, formData: FormData): Promise<EstadoLogin> {
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

  const usuario = await prisma.usuario.create({
    data: { nome, email, senhaHash: hashSenha(senha) },
  });

  await criarSessao(usuario.id);
  redirect("/");
}

export async function entrar(_estado: EstadoLogin, formData: FormData): Promise<EstadoLogin> {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const senha = String(formData.get("senha") || "");

  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario || !verificarSenha(senha, usuario.senhaHash)) {
    return { erro: "E-mail ou senha incorretos." };
  }

  await criarSessao(usuario.id);
  redirect("/");
}
