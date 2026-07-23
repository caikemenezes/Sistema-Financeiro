import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirUsuarioAtual } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/format";
import { criarMeta, aportarMeta, excluirMeta } from "./actions";
import { InfoIcone } from "@/components/info-icone";

export const dynamic = "force-dynamic";

const TIPOS = [
  "Necessidade",
  "Desejo",
  "Saúde",
  "Educação",
  "Família",
  "Trabalho",
  "Casa",
  "Investimento",
  "Emergência",
];

function mesesRestantes(dataDesejada: Date | null): number | null {
  if (!dataDesejada) return null;
  const hoje = new Date();
  const meses =
    (dataDesejada.getUTCFullYear() - hoje.getUTCFullYear()) * 12 +
    (dataDesejada.getUTCMonth() - hoje.getUTCMonth());
  return Math.max(1, meses);
}

const STATUS_LABEL: Record<string, string> = {
  PLANEJADA: "Planejada",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};

export default async function MetasPage() {
  const usuario = await exigirUsuarioAtual();
  const [metas, membros] = await Promise.all([
    prisma.meta.findMany({
      where: { familiaId: usuario.familiaId, status: { not: "CANCELADA" } },
      orderBy: [{ prioridade: "asc" }, { dataDesejada: "asc" }],
      include: { familiaMembro: true },
    }),
    prisma.familiaMembro.findMany({
      where: { familiaId: usuario.familiaId },
      orderBy: { nome: "asc" },
    }),
  ]);

  return (
    <div className="pilha">
      <div>
        <h1 className="pagina-titulo">Metas e prioridades</h1>
        <p className="pagina-subtitulo">
          Objetivos e necessidades futuras, com quanto falta guardar por mês.
        </p>
      </div>

      <form action={criarMeta} className="cartao form-grade">
        <InfoIcone texto="Cadastre aqui um objetivo maior — viagem, carro, um convênio médico. Depois clique em 'Ver detalhes' pra comparar cotações e listar os itens que a meta vai precisar." />
        <input name="nome" placeholder="Nome da meta" required className="campo" />
        <select name="tipo" required defaultValue="" className="campo">
          <option value="" disabled>
            Tipo
          </option>
          {TIPOS.map((tipo) => (
            <option key={tipo} value={tipo}>
              {tipo}
            </option>
          ))}
        </select>
        <input
          name="valorEstimado"
          placeholder="Valor estimado"
          type="number"
          step="0.01"
          required
          className="campo"
        />
        <input name="dataDesejada" type="date" className="campo" />
        <select name="prioridade" defaultValue="MEDIA" className="campo">
          <option value="URGENTE">Urgente</option>
          <option value="ALTA">Alta</option>
          <option value="MEDIA">Média</option>
          <option value="BAIXA">Baixa</option>
        </select>
        <select name="familiaMembroId" defaultValue="" className="campo">
          <option value="">Família (geral)</option>
          {membros.map((membro) => (
            <option key={membro.id} value={membro.id}>
              {membro.nome}
            </option>
          ))}
        </select>
        <input name="categoria" placeholder="Categoria (opcional)" className="campo" />
        <input
          name="linksPesquisados"
          placeholder="Links/orçamentos pesquisados (opcional)"
          className="campo"
        />
        <button type="submit" className="botao">
          Adicionar meta
        </button>
      </form>

      <div className="pilha-pequena">
        {metas.map((meta) => {
          const valorRestante = Math.max(0, meta.valorEstimado - meta.valorGuardado);
          const meses = mesesRestantes(meta.dataDesejada);
          const valorMensal = meses ? valorRestante / meses : null;
          const progresso = Math.min(
            100,
            Math.round((meta.valorGuardado / meta.valorEstimado) * 100)
          );

          return (
            <div key={meta.id} className="cartao pilha-pequena">
              <div className="linha-flex">
                <div>
                  <Link href={`/metas/${meta.id}`} style={{ textDecoration: "none" }}>
                    <h3 style={{ margin: 0 }}>{meta.nome}</h3>
                  </Link>
                  <p className="texto-suave" style={{ fontSize: "0.8rem", margin: "0.2rem 0 0 0" }}>
                    {meta.tipo}
                    {meta.familiaMembro ? ` · ${meta.familiaMembro.nome}` : ""}
                    {meta.dataDesejada ? ` · até ${formatDate(meta.dataDesejada)}` : ""} ·{" "}
                    {STATUS_LABEL[meta.status]}
                  </p>
                </div>
                <div className="acoes">
                  <Link href={`/metas/${meta.id}`} className="link-acao">
                    Ver detalhes
                  </Link>
                  <form action={excluirMeta}>
                    <input type="hidden" name="id" value={meta.id} />
                    <button className="link-acao link-perigo">Excluir</button>
                  </form>
                </div>
              </div>

              <div className="progresso-trilho">
                <div className="progresso-barra" style={{ width: `${progresso}%` }} />
              </div>

              <div className="grupo-valores">
                <div>
                  <p className="stat-rotulo">Estimado</p>
                  <p className="stat-valor" style={{ fontSize: "1rem" }}>
                    {formatCurrency(meta.valorEstimado)}
                  </p>
                </div>
                <div>
                  <p className="stat-rotulo">Guardado</p>
                  <p className="stat-valor" style={{ fontSize: "1rem" }}>
                    {formatCurrency(meta.valorGuardado)}
                  </p>
                </div>
                <div>
                  <p className="stat-rotulo">Falta</p>
                  <p className="stat-valor" style={{ fontSize: "1rem" }}>
                    {formatCurrency(valorRestante)}
                  </p>
                </div>
                {valorMensal !== null && valorRestante > 0 && (
                  <div>
                    <p className="stat-rotulo">Guardar por mês</p>
                    <p className="stat-valor" style={{ fontSize: "1rem" }}>
                      {formatCurrency(valorMensal)}
                    </p>
                  </div>
                )}
              </div>

              {valorRestante > 0 && (
                <form action={aportarMeta} className="linha-flex" style={{ justifyContent: "flex-start" }}>
                  <input type="hidden" name="id" value={meta.id} />
                  <input
                    name="valorAporte"
                    type="number"
                    step="0.01"
                    placeholder="Valor a guardar agora"
                    required
                    className="campo"
                    style={{ width: "12rem" }}
                  />
                  <button className="botao botao-pequeno">Reservar valor</button>
                </form>
              )}
            </div>
          );
        })}
        {metas.length === 0 && <p className="texto-suave">Nenhuma meta cadastrada ainda.</p>}
      </div>
    </div>
  );
}
