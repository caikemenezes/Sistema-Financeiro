import "server-only";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const COOKIE_SESSAO = "sessao";
const DURACAO_SESSAO_MS = 30 * 24 * 60 * 60 * 1000;

export function hashSenha(senha: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(senha, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verificarSenha(senha: string, senhaHash: string): boolean {
  const [salt, hash] = senhaHash.split(":");
  if (!salt || !hash) return false;
  const hashArmazenado = Buffer.from(hash, "hex");
  const hashTentativa = scryptSync(senha, salt, hashArmazenado.length);
  return timingSafeEqual(hashTentativa, hashArmazenado);
}

export async function criarSessao(usuarioId: string) {
  const expiraEm = new Date(Date.now() + DURACAO_SESSAO_MS);
  const sessao = await prisma.sessao.create({ data: { usuarioId, expiraEm } });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_SESSAO, sessao.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiraEm,
    path: "/",
  });
}

export async function obterUsuarioAtual() {
  const cookieStore = await cookies();
  const sessaoId = cookieStore.get(COOKIE_SESSAO)?.value;
  if (!sessaoId) return null;

  const sessao = await prisma.sessao.findUnique({
    where: { id: sessaoId },
    include: { usuario: true },
  });

  if (!sessao || sessao.expiraEm < new Date()) return null;
  return sessao.usuario;
}

export async function encerrarSessao() {
  const cookieStore = await cookies();
  const sessaoId = cookieStore.get(COOKIE_SESSAO)?.value;
  if (sessaoId) {
    await prisma.sessao.delete({ where: { id: sessaoId } }).catch(() => {});
  }
  cookieStore.delete(COOKIE_SESSAO);
}
