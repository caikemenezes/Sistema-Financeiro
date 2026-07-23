"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashSenha, verificarSenha, criarSessao } from "@/lib/auth";

export type EstadoLogin = { erro?: string } | undefined;

// Hash "fantasma" — sem usuário nenhum atrás. Serve só pra forçar o mesmo
// custo de scrypt no caminho de "e-mail não existe" que no de "senha errada",
// senão dá pra descobrir por tempo de resposta quais e-mails têm conta.
const HASH_FANTASMA = hashSenha(randomBytes(24).toString("hex"));

export async function criarConta(_estado: EstadoLogin, formData: FormData): Promise<EstadoLogin> {
  // Cada cadastro cria uma família nova, isolada — não é um bootstrap único.
  // Pessoas sem nenhuma relação entre si (ex: usuários diferentes da mesma
  // hospedagem) podem se cadastrar livremente: cada uma começa com um espaço
  // vazio, sem acesso a dados de ninguém. Convidar alguém pra DENTRO da sua
  // própria família (compartilhando os mesmos dados) é feito por
  // convidarFamiliar (autenticado, em Configurações) — cadastro aqui é
  // sempre um espaço novo.
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

  const usuario = await prisma.$transaction(async (tx) => {
    const familia = await tx.familia.create({ data: { nome: `Família de ${nome}` } });
    return tx.usuario.create({
      data: { nome, email, senhaHash: hashSenha(senha), familiaId: familia.id },
    });
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
  // Sempre roda verificarSenha, mesmo sem usuário — contra o hash fantasma
  // se precisar — pra não revelar por tempo de resposta se o e-mail existe.
  const senhaConfere = verificarSenha(senha, usuario?.senhaHash ?? HASH_FANTASMA);

  if (!usuario || !senhaConfere) {
    // Atraso pequeno em toda tentativa falha — não impede um ataque
    // distribuído sério, mas encarece tentar senha por senha na unha.
    await new Promise((resolve) => setTimeout(resolve, 400));
    return { erro: "E-mail ou senha incorretos." };
  }

  await criarSessao(usuario.id);
  redirect("/");
}
