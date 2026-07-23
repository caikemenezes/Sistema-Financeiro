import { prisma } from "@/lib/prisma";
import { exigirUsuarioAtual } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  criarMembro,
  excluirMembro,
  criarNecessidade,
  concluirNecessidade,
  excluirNecessidade,
} from "./actions";
import { InfoIcone } from "@/components/info-icone";

export const dynamic = "force-dynamic";

const CATEGORIAS_NECESSIDADE = [
  "Alimentação",
  "Fraldas",
  "Higiene",
  "Roupas",
  "Calçados",
  "Saúde",
  "Medicamentos",
  "Brinquedos",
  "Passeios",
  "Educação",
  "Escola",
  "Material escolar",
  "Transporte",
  "Atividades",
  "Festas e aniversários",
];

const PRIORIDADE_SELO: Record<string, string> = {
  URGENTE: "selo-perigo",
  ALTA: "selo-alerta",
  MEDIA: "selo-info",
  BAIXA: "selo-neutro",
};

const PRIORIDADE_LABEL: Record<string, string> = {
  URGENTE: "Urgente",
  ALTA: "Alta",
  MEDIA: "Média",
  BAIXA: "Baixa",
};

export default async function FamiliaPage() {
  const usuario = await exigirUsuarioAtual();
  const [membros, necessidades] = await Promise.all([
    prisma.familiaMembro.findMany({
      where: { familiaId: usuario.familiaId },
      orderBy: { nome: "asc" },
    }),
    prisma.necessidade.findMany({
      where: { familiaId: usuario.familiaId, status: { not: "CONCLUIDA" } },
      orderBy: { mesPlanejado: "asc" },
      include: { familiaMembro: true },
    }),
  ]);

  return (
    <div className="pilha">
      <div>
        <h1 className="pagina-titulo">Família e filhos</h1>
        <p className="pagina-subtitulo">
          Integrantes da família e as necessidades planejadas.
        </p>
      </div>

      <section className="cartao pilha-pequena">
        <InfoIcone texto="Cadastre aqui quem faz parte da família — nome, parentesco e data de nascimento. Esses integrantes aparecem como opção em Metas e nas necessidades abaixo." />
        <h2 className="cartao-titulo">Integrantes</h2>
        <form action={criarMembro} className="form-grade">
          <input name="nome" placeholder="Nome" required className="campo" />
          <input
            name="parentesco"
            placeholder="Parentesco (ex: Filha)"
            required
            className="campo"
          />
          <input name="dataNascimento" type="date" className="campo" />
          <input name="observacoes" placeholder="Observações (opcional)" className="campo" />
          <button type="submit" className="botao botao-abrange-linha">
            Adicionar integrante
          </button>
        </form>

        <ul className="lista-simples">
          {membros.map((membro) => (
            <li key={membro.id}>
              <div>
                <strong>{membro.nome}</strong>{" "}
                <span className="texto-suave">
                  · {membro.parentesco}
                  {membro.dataNascimento
                    ? ` · nasc. ${formatDate(membro.dataNascimento)}`
                    : ""}
                </span>
              </div>
              <form action={excluirMembro}>
                <input type="hidden" name="id" value={membro.id} />
                <button className="link-acao link-perigo">Excluir</button>
              </form>
            </li>
          ))}
          {membros.length === 0 && (
            <li style={{ justifyContent: "center" }} className="texto-suave">
              Nenhum integrante cadastrado ainda.
            </li>
          )}
        </ul>
      </section>

      <section className="cartao pilha-pequena">
        <InfoIcone texto="Necessidades planejadas por integrante da família (ou geral). Essa mesma lista, com progresso de quanto já foi guardado, também aparece na página Prioridades." />
        <h2 className="cartao-titulo">Lista de necessidades</h2>
        <form action={criarNecessidade} className="form-grade">
          <input name="item" placeholder="Item (ex: Tênis)" required className="campo" />
          <select name="familiaMembroId" defaultValue="" className="campo">
            <option value="">Família (geral)</option>
            {membros.map((membro) => (
              <option key={membro.id} value={membro.id}>
                {membro.nome}
              </option>
            ))}
          </select>
          <select name="categoria" required defaultValue="" className="campo">
            <option value="" disabled>
              Categoria
            </option>
            {CATEGORIAS_NECESSIDADE.map((categoria) => (
              <option key={categoria} value={categoria}>
                {categoria}
              </option>
            ))}
          </select>
          <select name="prioridade" defaultValue="MEDIA" className="campo">
            <option value="URGENTE">Urgente</option>
            <option value="ALTA">Alta</option>
            <option value="MEDIA">Média</option>
            <option value="BAIXA">Baixa</option>
          </select>
          <input
            name="valorEstimado"
            placeholder="Valor estimado"
            type="number"
            step="0.01"
            required
            className="campo"
          />
          <input name="mesPlanejado" type="date" required className="campo" />
          <button type="submit" className="botao botao-abrange-linha">
            Adicionar necessidade
          </button>
        </form>

        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr>
                <th>Item</th>
                <th>Filho</th>
                <th>Prioridade</th>
                <th>Valor estimado</th>
                <th>Guardado</th>
                <th>Mês planejado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {necessidades.map((necessidade) => (
                <tr key={necessidade.id}>
                  <td>
                    <strong>{necessidade.item}</strong>
                  </td>
                  <td className="texto-suave">
                    {necessidade.familiaMembro?.nome ?? necessidade.pessoaNome ?? "Família"}
                  </td>
                  <td>
                    <span className={`selo ${PRIORIDADE_SELO[necessidade.prioridade]}`}>
                      {PRIORIDADE_LABEL[necessidade.prioridade]}
                    </span>
                  </td>
                  <td>{formatCurrency(necessidade.valorEstimado)}</td>
                  <td className="texto-suave">{formatCurrency(necessidade.valorGuardado)}</td>
                  <td>
                    {necessidade.mesPlanejado.toLocaleDateString("pt-BR", {
                      month: "long",
                      year: "numeric",
                      timeZone: "UTC",
                    })}
                  </td>
                  <td>
                    <div className="acoes">
                      <form action={concluirNecessidade}>
                        <input type="hidden" name="id" value={necessidade.id} />
                        <button className="link-acao link-sucesso">Concluída</button>
                      </form>
                      <form action={excluirNecessidade}>
                        <input type="hidden" name="id" value={necessidade.id} />
                        <button className="link-acao link-perigo">Excluir</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {necessidades.length === 0 && (
                <tr>
                  <td colSpan={7} className="tabela-vazia">
                    Nenhuma necessidade planejada ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
