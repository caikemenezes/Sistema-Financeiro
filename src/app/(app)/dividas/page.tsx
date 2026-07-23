import { prisma } from "@/lib/prisma";
import { exigirUsuarioAtual } from "@/lib/auth";
import { formatCurrency, inicioDoDiaUTC, toDateInputValue } from "@/lib/format";
import { InfoIcone } from "@/components/info-icone";
import { criarDivida, editarDivida, pagarParcelaDivida, excluirDivida } from "./actions";

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

function statusExibido(divida: { status: string; vencimento: Date | null }) {
  if (divida.status === "EM_DIA" && divida.vencimento && divida.vencimento < inicioDoDiaUTC()) {
    return "ATRASADA";
  }
  return divida.status;
}

export default async function DividasPage() {
  const usuario = await exigirUsuarioAtual();
  const dividas = await prisma.divida.findMany({
    where: { familiaId: usuario.familiaId, status: { not: "QUITADA" } },
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
        <InfoIcone texto="Cadastre aqui uma dívida (empréstimo, financiamento, cartão, parcelamento...). Depois é só usar 'Pagar parcela' na tabela pra ir abatendo o valor conforme você paga." />
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

      <div style={{ display: "none" }}>
        {dividas.map((divida) => (
          <form key={`editar-${divida.id}`} id={`editar-divida-${divida.id}`} action={editarDivida}>
            <input type="hidden" name="id" value={divida.id} />
          </form>
        ))}
      </div>

      <div className="tabela-wrap">
        <table className="tabela">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Credor</th>
              <th>Parcelas pagas</th>
              <th>Valor atual</th>
              <th>Valor da parcela</th>
              <th>Próximo vencimento</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {dividas.map((divida) => {
              const status = statusExibido(divida);
              const formId = `editar-divida-${divida.id}`;
              return (
                <tr key={divida.id}>
                  <td>
                    <input
                      form={formId}
                      name="nome"
                      defaultValue={divida.nome}
                      required
                      className="campo campo-tabela"
                    />
                  </td>
                  <td>
                    <input
                      form={formId}
                      name="credor"
                      defaultValue={divida.credor}
                      required
                      className="campo campo-tabela"
                    />
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <input
                        form={formId}
                        name="parcelasPagas"
                        type="number"
                        min="0"
                        max={divida.numeroParcelas ?? undefined}
                        defaultValue={divida.parcelasPagas}
                        className="campo campo-tabela"
                        style={{ width: "4rem" }}
                      />
                      {divida.numeroParcelas && (
                        <span className="texto-suave">/{divida.numeroParcelas}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <input
                      form={formId}
                      name="valorAtual"
                      type="number"
                      step="0.01"
                      defaultValue={divida.valorAtual}
                      required
                      className="campo campo-tabela"
                      style={{ width: "7rem" }}
                    />
                  </td>
                  <td>
                    <input
                      form={formId}
                      name="valorParcela"
                      type="number"
                      step="0.01"
                      defaultValue={divida.valorParcela ?? ""}
                      className="campo campo-tabela"
                      style={{ width: "7rem" }}
                    />
                  </td>
                  <td>
                    <input
                      form={formId}
                      name="vencimento"
                      type="date"
                      defaultValue={divida.vencimento ? toDateInputValue(divida.vencimento) : ""}
                      className="campo campo-tabela"
                    />
                  </td>
                  <td>
                    <span className={`selo ${STATUS_SELO[status]}`}>{STATUS_LABEL[status]}</span>
                  </td>
                  <td>
                    <div className="acoes">
                      <button form={formId} type="submit" className="link-acao link-sucesso">
                        Salvar
                      </button>
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
              );
            })}
            {dividas.length === 0 && (
              <tr>
                <td colSpan={8} className="tabela-vazia">
                  Nenhuma dívida cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="texto-suave" style={{ fontSize: "0.8rem" }}>
        &ldquo;Pagar parcela&rdquo; abate o valor da parcela automaticamente e avança o vencimento
        em um mês. Se precisar ajustar manualmente (parcelas pagas, valor ou a data do próximo
        vencimento), edite os campos da linha e clique em &ldquo;Salvar&rdquo;.
      </p>
    </div>
  );
}
