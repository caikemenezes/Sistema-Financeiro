import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";
import { criarInvestimento, registrarAporte, excluirInvestimento } from "./actions";

export const dynamic = "force-dynamic";

const OBJETIVOS = [
  "Reserva de emergência",
  "Objetivo específico",
  "Aposentadoria",
  "Curto prazo",
  "Longo prazo",
];

export default async function InvestimentosPage() {
  const investimentos = await prisma.investimento.findMany({
    orderBy: { createdAt: "desc" },
  });

  const totalAplicado = investimentos.reduce((soma, i) => soma + i.valorAplicado, 0);
  const totalAtual = investimentos.reduce((soma, i) => soma + i.valorAtual, 0);
  const rendimento = totalAtual - totalAplicado;

  return (
    <div className="pilha">
      <div>
        <h1 className="pagina-titulo">Investimentos e reservas</h1>
        <p className="pagina-subtitulo">
          Total investido: <strong>{formatCurrency(totalAtual)}</strong>
          {" · "}
          Rendimento acumulado:{" "}
          <strong style={{ color: rendimento >= 0 ? "var(--cor-sucesso-texto)" : "var(--cor-perigo-texto)" }}>
            {formatCurrency(rendimento)}
          </strong>
        </p>
      </div>

      <form action={criarInvestimento} className="cartao form-grade">
        <input name="nome" placeholder="Nome do investimento" required className="campo" />
        <select name="objetivo" required defaultValue="" className="campo">
          <option value="" disabled>
            Objetivo
          </option>
          {OBJETIVOS.map((objetivo) => (
            <option key={objetivo} value={objetivo}>
              {objetivo}
            </option>
          ))}
        </select>
        <input name="instituicao" placeholder="Instituição (opcional)" className="campo" />
        <input name="tipo" placeholder="Tipo (ex: CDB, Tesouro, Poupança)" className="campo" />
        <input
          name="valorAplicado"
          placeholder="Valor aplicado"
          type="number"
          step="0.01"
          required
          className="campo"
        />
        <input
          name="aporteMensal"
          placeholder="Aporte mensal planejado (opcional)"
          type="number"
          step="0.01"
          className="campo"
        />
        <input name="prazo" type="date" className="campo" title="Prazo (opcional)" />
        <input name="liquidez" placeholder="Liquidez (ex: imediata, 30 dias)" className="campo" />
        <input
          name="rentabilidadeInformada"
          placeholder="Rentabilidade informada (ex: 110% do CDI)"
          className="campo"
        />
        <button type="submit" className="botao botao-abrange-linha">
          Adicionar investimento
        </button>
      </form>

      <div className="tabela-wrap">
        <table className="tabela">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Objetivo</th>
              <th>Valor atual</th>
              <th>Aporte mensal</th>
              <th>Último aporte</th>
              <th />
              <th />
            </tr>
          </thead>
          <tbody>
            {investimentos.map((investimento) => (
              <tr key={investimento.id}>
                <td>
                  <strong>{investimento.nome}</strong>
                  {investimento.instituicao && (
                    <p className="texto-suave" style={{ fontSize: "0.8rem", margin: 0 }}>
                      {investimento.instituicao}
                      {investimento.tipo ? ` · ${investimento.tipo}` : ""}
                    </p>
                  )}
                </td>
                <td className="texto-suave">{investimento.objetivo}</td>
                <td>{formatCurrency(investimento.valorAtual)}</td>
                <td>
                  {investimento.aporteMensal ? formatCurrency(investimento.aporteMensal) : "—"}
                </td>
                <td className="texto-suave">
                  {investimento.dataUltimoAporte ? formatDate(investimento.dataUltimoAporte) : "—"}
                </td>
                <td>
                  <form action={registrarAporte} className="linha-flex" style={{ justifyContent: "flex-start" }}>
                    <input type="hidden" name="id" value={investimento.id} />
                    <input
                      name="valorAporte"
                      type="number"
                      step="0.01"
                      placeholder="Valor do aporte"
                      required
                      className="campo"
                      style={{ width: "9rem" }}
                    />
                    <button className="botao botao-pequeno">Registrar aporte</button>
                  </form>
                </td>
                <td>
                  <form action={excluirInvestimento}>
                    <input type="hidden" name="id" value={investimento.id} />
                    <button className="link-acao link-perigo">Excluir</button>
                  </form>
                </td>
              </tr>
            ))}
            {investimentos.length === 0 && (
              <tr>
                <td colSpan={7} className="tabela-vazia">
                  Nenhum investimento cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
