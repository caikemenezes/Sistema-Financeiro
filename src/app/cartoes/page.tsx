import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import {
  criarCartao,
  criarCompra,
  marcarProximaParcelaPaga,
  excluirCompra,
} from "./actions";

export const dynamic = "force-dynamic";

const CLASSIFICACOES = [
  { value: "ESSENCIAL", label: "Essencial" },
  { value: "IMPORTANTE", label: "Importante" },
  { value: "SUPERFLUA", label: "Supérflua" },
];

export default async function CartoesPage() {
  const [cartoes, familiaMembros] = await Promise.all([
    prisma.cartao.findMany({
      orderBy: { nome: "asc" },
      include: {
        compras: {
          orderBy: { dataCompra: "desc" },
          include: { parcelas: true, familiaMembro: true },
        },
      },
    }),
    prisma.familiaMembro.findMany({ orderBy: { nome: "asc" } }),
  ]);

  return (
    <div className="pilha">
      <div>
        <h1 className="pagina-titulo">Cartões de crédito</h1>
        <p className="pagina-subtitulo">Cartões, compras e parcelas.</p>
      </div>

      <form action={criarCartao} className="cartao form-grade">
        <input name="nome" placeholder="Nome do cartão" required className="campo" />
        <input name="banco" placeholder="Banco (opcional)" className="campo" />
        <input
          name="limiteTotal"
          placeholder="Limite total"
          type="number"
          step="0.01"
          required
          className="campo"
        />
        <input
          name="diaFechamento"
          placeholder="Dia do fechamento"
          type="number"
          min="1"
          max="31"
          required
          className="campo"
        />
        <input
          name="diaVencimento"
          placeholder="Dia do vencimento"
          type="number"
          min="1"
          max="31"
          required
          className="campo"
        />
        <button type="submit" className="botao botao-abrange-linha">
          Adicionar cartão
        </button>
      </form>

      {cartoes.length === 0 && (
        <p className="texto-suave">Nenhum cartão cadastrado ainda.</p>
      )}

      {cartoes.map((cartao) => {
        const limiteUtilizado = cartao.compras.reduce(
          (total, compra) =>
            total +
            compra.parcelas
              .filter((parcela) => !parcela.paga)
              .reduce((soma, parcela) => soma + parcela.valor, 0),
          0
        );
        const limiteDisponivel = cartao.limiteTotal - limiteUtilizado;

        return (
          <section key={cartao.id} className="cartao pilha-pequena">
            <div className="linha-flex">
              <div>
                <h2 className="cartao-titulo">{cartao.nome}</h2>
                <p className="texto-suave" style={{ fontSize: "0.8rem" }}>
                  {cartao.banco ? `${cartao.banco} · ` : ""}Fecha dia{" "}
                  {cartao.diaFechamento}, vence dia {cartao.diaVencimento}
                </p>
              </div>
              <div className="grupo-valores">
                <div>
                  <p className="stat-rotulo">Limite total</p>
                  <p className="stat-valor" style={{ fontSize: "1rem" }}>
                    {formatCurrency(cartao.limiteTotal)}
                  </p>
                </div>
                <div>
                  <p className="stat-rotulo">Utilizado</p>
                  <p className="stat-valor" style={{ fontSize: "1rem" }}>
                    {formatCurrency(limiteUtilizado)}
                  </p>
                </div>
                <div>
                  <p className="stat-rotulo">Disponível</p>
                  <p className="stat-valor" style={{ fontSize: "1rem" }}>
                    {formatCurrency(limiteDisponivel)}
                  </p>
                </div>
              </div>
            </div>

            <form
              action={criarCompra}
              className="form-grade"
              style={{
                background: "var(--cor-tabela-cabecalho)",
                padding: "0.75rem",
                borderRadius: "8px",
              }}
            >
              <input type="hidden" name="cartaoId" value={cartao.id} />
              <input
                name="descricao"
                placeholder="Descrição da compra"
                required
                className="campo"
              />
              <input name="categoria" placeholder="Categoria" className="campo" />
              <input
                name="valorTotal"
                placeholder="Valor total"
                type="number"
                step="0.01"
                required
                className="campo"
              />
              <input
                name="numeroParcelas"
                placeholder="Nº de parcelas"
                type="number"
                min="1"
                defaultValue="1"
                required
                className="campo"
              />
              <input name="dataCompra" type="date" required className="campo" />
              <select name="familiaMembroId" defaultValue="" className="campo">
                <option value="">Família (geral)</option>
                {familiaMembros.map((membro) => (
                  <option key={membro.id} value={membro.id}>
                    {membro.nome}
                  </option>
                ))}
              </select>
              <select name="classificacao" defaultValue="IMPORTANTE" className="campo">
                {CLASSIFICACOES.map((classificacao) => (
                  <option key={classificacao.value} value={classificacao.value}>
                    {classificacao.label}
                  </option>
                ))}
              </select>
              <button type="submit" className="botao">
                Adicionar compra
              </button>
            </form>

            <div className="tabela-wrap">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Descrição</th>
                    <th>Pessoa</th>
                    <th>Valor total</th>
                    <th>Parcelas</th>
                    <th>Falta pagar</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {cartao.compras.map((compra) => {
                    const parcelasPagas = compra.parcelas.filter(
                      (parcela) => parcela.paga
                    ).length;
                    const valorRestante = compra.parcelas
                      .filter((parcela) => !parcela.paga)
                      .reduce((soma, parcela) => soma + parcela.valor, 0);

                    return (
                      <tr key={compra.id}>
                        <td>
                          <strong>{compra.descricao}</strong>
                        </td>
                        <td className="texto-suave">
                          {compra.familiaMembro?.nome ?? "Família"}
                        </td>
                        <td>{formatCurrency(compra.valorTotal)}</td>
                        <td>
                          {parcelasPagas}/{compra.numeroParcelas}
                        </td>
                        <td>{formatCurrency(valorRestante)}</td>
                        <td>
                          <div className="acoes">
                            {parcelasPagas < compra.numeroParcelas && (
                              <form action={marcarProximaParcelaPaga}>
                                <input type="hidden" name="compraId" value={compra.id} />
                                <button className="link-acao link-sucesso">
                                  Marcar parcela paga
                                </button>
                              </form>
                            )}
                            <form action={excluirCompra}>
                              <input type="hidden" name="id" value={compra.id} />
                              <button className="link-acao link-perigo">Excluir</button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {cartao.compras.length === 0 && (
                    <tr>
                      <td colSpan={6} className="tabela-vazia">
                        Nenhuma compra registrada neste cartão.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}
