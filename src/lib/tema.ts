import "server-only";
import { cookies } from "next/headers";

export type Tema = "claro" | "escuro";

export async function obterTema(): Promise<Tema> {
  const cookieStore = await cookies();
  return cookieStore.get("tema")?.value === "claro" ? "claro" : "escuro";
}
