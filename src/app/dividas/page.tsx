import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";
import { criarDivida, pagarParcelaDivida, excluirDivida } from "./actions";

export const dynamic = "force-dynamic";

const TIPOS = [
  "Cartão de crédito",
  "Empréstimo",
  "Financiamento",
  "Conta atrasada",
  "Dívida com pessoa",
  "Parcelamento",
  "Imposto",
  "Outros",
];

const STATUS_SELO: Record<string, string> = {
  EM_DIA: "selo-info",
  ATRASADA: "selo-perigo",
  QUITADA: "selo-sucesso",
};

const STATUS_LABEL: Record<string, string> = {
  EM_DIA: "Em dia",
  ATRASADA: "Atrasada",
  QUITADA: "Quitada",
};

export default async function DividasPage() {
  const dividas = await prisma.divida.findMany({
    where: { status: { not: "QUITADA" } },
    orderBy: [{ prioridade: "asc" }, { vencimento: "asc" }],
  });

  const totalRestante = dividas.reduce((soma, divida) => soma + divida.valorAtual, 0);

  return (
    <div className="pilha">
      <div>
        <h1 className="pagina-titulo">Dívidas</h1>
        <p className="pagina-subtitulo">
          Total ainda restante: <strong>{formatCurrency(totalRestante)}</strong>
        </p>
      </div>

      <form action={criarDivida} className="cartao form-grade">
        <input name="nome" placeholder="Nome da dívida" required className="campo" />
        <input name="credor" placeholder="Credor" required className="campo" />
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
          name="valorOriginal"
          placeholder="Valor original"
          type="number"
          step="0.01"
          required
          className="campo"
        />
        <input
          name="numeroParcelas"
          placeholder="Nº de parcelas (opcional)"
          type="number"
          min="1"
          className="campo"
        />
        <input
          name="valorParcela"
          placeholder="Valor da parcela (opcional)"
          type="number"
          step="0.01"
          className="campo"
        />
        <input name="vencimento" type="date" className="campo" />
        <select name="prioridade" defaultValue="MEDIA" className="campo">
          <option value="URGENTE">Urgente</option>
          <option value="ALTA">Alta</option>
          <option value="MEDIA">Média</option>
          <option value="BAIXA">Baixa</option>
        </select>
        <label className="campo-checkbox">
          <input type="checkbox" name="possibilidadeNegociacao" />
          Possibilidade de negociação
        </label>
        <button type="submit" className="botao">
          Adicionar dívida
        </button>
      </form>

      <div className="tabela-wrap">
        <table className="tabela">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Credor</th>
              <th>Valor atual</th>
              <th>Vencimento</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {dividas.map((divida) => (
              <tr key={divida.id}>
                <td>
                  <strong>{divida.nome}</strong>
                </td>
                <td className="texto-suave">{divida.credor}</td>
                <td>{formatCurrency(divida.valorAtual)}</td>
                <td>{divida.vencimento ? formatDate(divida.vencimento) : "—"}</td>
                <td>
                  <span className={`selo ${STATUS_SELO[divida.status]}`}>
                    {STATUS_LABEL[divida.status]}
                  </span>
                </td>
                <td>
                  <div className="acoes">
                    <form action={pagarParcelaDivida}>
                      <input type="hidden" name="id" value={divida.id} />
                      <button className="link-acao link-sucesso">Pagar parcela</button>
                    </form>
                    <form action={excluirDivida}>
                      <input type="hidden" name="id" value={divida.id} />
                      <button className="link-acao link-perigo">Excluir</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {dividas.length === 0 && (
              <tr>
                <td colSpan={6} className="tabela-vazia">
                  Nenhuma dívida cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
