import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";
import { AnelProgresso } from "@/components/charts";
import { IconChevronLeft } from "@/components/icons";
import {
  atualizarObservacoes,
  adicionarCotacao,
  alternarCotacaoEscolhida,
  excluirCotacao,
  adicionarItemNecessario,
  alternarItemConcluido,
  excluirItemNecessario,
} from "./actions";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  PLANEJADA: "Planejada",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};

const PRIORIDADE_LABEL: Record<string, string> = {
  URGENTE: "Urgente",
  ALTA: "Alta",
  MEDIA: "Média",
  BAIXA: "Baixa",
};

const PRIORIDADE_SELO: Record<string, string> = {
  URGENTE: "selo-perigo",
  ALTA: "selo-alerta",
  MEDIA: "selo-info",
  BAIXA: "selo-neutro",
};

function mesesRestantes(dataDesejada: Date | null): number | null {
  if (!dataDesejada) return null;
  const hoje = new Date();
  const meses =
    (dataDesejada.getUTCFullYear() - hoje.getUTCFullYear()) * 12 +
    (dataDesejada.getUTCMonth() - hoje.getUTCMonth());
  return Math.max(1, meses);
}

export default async function MetaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const meta = await prisma.meta.findUnique({
    where: { id },
    include: {
      familiaMembro: true,
      cotacoes: { orderBy: { createdAt: "asc" } },
      itensNecessarios: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!meta) notFound();

  const valorRestante = Math.max(0, meta.valorEstimado - meta.valorGuardado);
  const meses = mesesRestantes(meta.dataDesejada);
  const valorMensal = meses ? valorRestante / meses : null;
  const progresso = (meta.valorGuardado / meta.valorEstimado) * 100;

  const totalCotacoesEscolhidas = meta.cotacoes
    .filter((c) => c.escolhida)
    .reduce((soma, c) => soma + c.valor, 0);
  const totalItensNecessarios = meta.itensNecessarios.reduce(
    (soma, i) => soma + i.valorEstimado,
    0
  );
  const totalItensConcluidos = meta.itensNecessarios
    .filter((i) => i.concluido)
    .reduce((soma, i) => soma + i.valorEstimado, 0);
  const totalCalculado = totalCotacoesEscolhidas + totalItensNecessarios;

  const cotacoesPorItem = new Map<string, typeof meta.cotacoes>();
  for (const c of meta.cotacoes) {
    const lista = cotacoesPorItem.get(c.item) ?? [];
    lista.push(c);
    cotacoesPorItem.set(c.item, lista);
  }

  return (
    <div className="pilha">
      <div>
        <Link href="/metas" className="link-ver-todos" style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem" }}>
          <IconChevronLeft size={14} />
          Voltar para Metas
        </Link>
      </div>

      <div className="cartao">
        <div className="linha-flex">
          <div>
            <h1 className="pagina-titulo">{meta.nome}</h1>
            <p className="pagina-subtitulo">
              {meta.tipo}
              {meta.categoria ? ` · ${meta.categoria}` : ""}
              {meta.familiaMembro ? ` · ${meta.familiaMembro.nome}` : ""}
              {meta.dataDesejada ? ` · até ${formatDate(meta.dataDesejada)}` : ""}
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            <span className={`selo ${PRIORIDADE_SELO[meta.prioridade]}`}>
              {PRIORIDADE_LABEL[meta.prioridade]}
            </span>
            <span className="selo selo-neutro">{STATUS_LABEL[meta.status]}</span>
          </div>
        </div>

        <div className="linha-flex" style={{ marginTop: "1rem", alignItems: "center", gap: "1.5rem" }}>
          <AnelProgresso percentual={progresso} tamanho={64} />
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
        </div>
      </div>

      <div className="cartao pilha-pequena">
        <h2 className="cartao-titulo">Observações</h2>
        <form action={atualizarObservacoes} className="pilha-pequena">
          <input type="hidden" name="id" value={meta.id} />
          <textarea
            name="observacoes"
            placeholder="Onde vamos ficar, o que precisa ser resolvido antes, detalhes gerais..."
            defaultValue={meta.observacoes ?? ""}
            className="campo"
            rows={3}
            style={{ resize: "vertical", fontFamily: "inherit" }}
          />
          <button type="submit" className="botao botao-pequeno" style={{ alignSelf: "flex-start" }}>
            Salvar observações
          </button>
        </form>
      </div>

      <div className="cartao pilha-pequena">
        <div className="linha-flex">
          <h2 className="cartao-titulo">Cotações</h2>
          <p className="texto-suave" style={{ fontSize: "0.85rem" }}>
            Escolhidas: <strong>{formatCurrency(totalCotacoesEscolhidas)}</strong>
          </p>
        </div>
        <p className="texto-suave" style={{ fontSize: "0.8rem", margin: 0 }}>
          Compare as opções pesquisadas (hospedagem, passagem, etc.) e marque a escolhida.
        </p>

        <form action={adicionarCotacao} className="form-grade">
          <input type="hidden" name="metaId" value={meta.id} />
          <input name="item" placeholder="Item (ex: Hospedagem)" required className="campo" />
          <input name="fornecedor" placeholder="Fornecedor/opção (ex: Hotel X)" required className="campo" />
          <input name="valor" placeholder="Valor" type="number" step="0.01" required className="campo" />
          <input name="link" placeholder="Link (opcional)" className="campo" />
          <button type="submit" className="botao botao-abrange-linha">
            Adicionar cotação
          </button>
        </form>

        {meta.cotacoes.length === 0 && (
          <p className="item-vazio">Nenhuma cotação cadastrada ainda.</p>
        )}

        {[...cotacoesPorItem.entries()].map(([item, cotacoesDoItem]) => (
          <div key={item} className="pilha-pequena">
            <p style={{ margin: "0.5rem 0 0 0", fontWeight: 600, fontSize: "0.85rem" }}>{item}</p>
            <div className="tabela-wrap">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Fornecedor/opção</th>
                    <th>Valor</th>
                    <th>Link</th>
                    <th />
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {cotacoesDoItem.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <strong>{c.fornecedor}</strong>
                      </td>
                      <td>{formatCurrency(c.valor)}</td>
                      <td>
                        {c.link ? (
                          <a href={c.link} target="_blank" rel="noreferrer" className="link-acao">
                            Ver link
                          </a>
                        ) : (
                          <span className="texto-suave">—</span>
                        )}
                      </td>
                      <td>
                        {c.escolhida ? (
                          <span className="selo selo-sucesso">Escolhida</span>
                        ) : (
                          <span className="texto-suave" style={{ fontSize: "0.8rem" }}>
                            —
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="acoes">
                          <form action={alternarCotacaoEscolhida}>
                            <input type="hidden" name="id" value={c.id} />
                            <input type="hidden" name="metaId" value={meta.id} />
                            <button className="link-acao link-sucesso">
                              {c.escolhida ? "Desmarcar" : "Escolher"}
                            </button>
                          </form>
                          <form action={excluirCotacao}>
                            <input type="hidden" name="id" value={c.id} />
                            <input type="hidden" name="metaId" value={meta.id} />
                            <button className="link-acao link-perigo">Excluir</button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      <div className="cartao pilha-pequena">
        <div className="linha-flex">
          <h2 className="cartao-titulo">O que vai precisar</h2>
          <p className="texto-suave" style={{ fontSize: "0.85rem" }}>
            Total: <strong>{formatCurrency(totalItensNecessarios)}</strong>
            {" · "}Resolvido: <strong>{formatCurrency(totalItensConcluidos)}</strong>
          </p>
        </div>
        <p className="texto-suave" style={{ fontSize: "0.8rem", margin: 0 }}>
          Lista do que precisa ser comprado, reservado ou resolvido para essa meta acontecer.
        </p>

        <form action={adicionarItemNecessario} className="form-grade">
          <input type="hidden" name="metaId" value={meta.id} />
          <input name="nome" placeholder="Item (ex: Passagem aérea)" required className="campo" />
          <input
            name="valorEstimado"
            placeholder="Valor estimado"
            type="number"
            step="0.01"
            required
            className="campo"
          />
          <button type="submit" className="botao botao-abrange-linha">
            Adicionar item
          </button>
        </form>

        {meta.itensNecessarios.length === 0 && (
          <p className="item-vazio">Nenhum item cadastrado ainda.</p>
        )}

        {meta.itensNecessarios.length > 0 && (
          <div className="tabela-wrap">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Valor estimado</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {meta.itensNecessarios.map((i) => (
                  <tr key={i.id}>
                    <td style={i.concluido ? { textDecoration: "line-through", opacity: 0.6 } : undefined}>
                      {i.nome}
                    </td>
                    <td>{formatCurrency(i.valorEstimado)}</td>
                    <td>
                      <span className={`selo ${i.concluido ? "selo-sucesso" : "selo-alerta"}`}>
                        {i.concluido ? "Resolvido" : "Pendente"}
                      </span>
                    </td>
                    <td>
                      <div className="acoes">
                        <form action={alternarItemConcluido}>
                          <input type="hidden" name="id" value={i.id} />
                          <input type="hidden" name="metaId" value={meta.id} />
                          <button className="link-acao link-sucesso">
                            {i.concluido ? "Reabrir" : "Marcar resolvido"}
                          </button>
                        </form>
                        <form action={excluirItemNecessario}>
                          <input type="hidden" name="id" value={i.id} />
                          <input type="hidden" name="metaId" value={meta.id} />
                          <button className="link-acao link-perigo">Excluir</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="cartao">
        <div className="linha-flex">
          <div>
            <p className="stat-rotulo">Valor estimado (manual)</p>
            <p className="stat-valor">{formatCurrency(meta.valorEstimado)}</p>
          </div>
          <div>
            <p className="stat-rotulo">Total calculado (cotações escolhidas + itens)</p>
            <p
              className="stat-valor"
              style={{
                color:
                  totalCalculado > meta.valorEstimado
                    ? "var(--cor-perigo-texto)"
                    : "var(--cor-sucesso-texto)",
              }}
            >
              {formatCurrency(totalCalculado)}
            </p>
          </div>
        </div>
        {totalCalculado > meta.valorEstimado && (
          <p className="texto-suave" style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>
            O que já foi cotado e listado passa o valor estimado em{" "}
            {formatCurrency(totalCalculado - meta.valorEstimado)}. Pode valer a pena revisar o
            valor estimado da meta.
          </p>
        )}
      </div>
    </div>
  );
}
