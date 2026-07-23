import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

const ROTAS_PUBLICAS = ["/login"];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const publica = ROTAS_PUBLICAS.some((rota) => pathname.startsWith(rota));

  const sessaoId = request.cookies.get("sessao")?.value;
  const sessao = sessaoId
    ? await prisma.sessao.findUnique({ where: { id: sessaoId } })
    : null;
  const autenticado = !!sessao && sessao.expiraEm > new Date();

  if (!autenticado && !publica) {
    const resposta = NextResponse.redirect(new URL("/login", request.url));
    if (sessaoId) resposta.cookies.delete("sessao");
    return resposta;
  }

  if (autenticado && publica) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|webp|gif|svg|ico)$).*)",
  ],
};
