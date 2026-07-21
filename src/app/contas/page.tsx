import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";
import { criarConta, marcarComoPaga, excluirConta } from "./actions";

export const dynamic = "force-dynamic";

const CATEGORIAS = [
  "Moradia",
  "Alimentação",
  "Transporte",
  "Saúde",
  "Assinaturas",
  "Trabalho e estudos",
];

function statusExibido(conta: { status: string; vencimento: Date }) {
  if (conta.status === "PENDENTE" && conta.vencimento < new Date()) {
    return "ATRASADA";
  }
  return conta.status;
}

const STATUS_SELO: Record<string, string> = {
  PAGA: "selo-sucesso",
  PENDENTE: "selo-alerta",
  ATRASADA: "selo-perigo",
};

const STATUS_LABEL: Record<string, string> = {
  PAGA: "Paga",
  PENDENTE: "Pendente",
  ATRASADA: "Atrasada",
};

export default async function ContasPage() {
  const contas = await prisma.contaMes.findMany({
    orderBy: { vencimento: "asc" },
  });

  return (
    <div className="pilha">
      <div>
        <h1 className="pagina-titulo">Contas do mês</h1>
        <p className="pagina-subtitulo">Tudo que precisa ser pago mensalmente.</p>
      </div>

      <form action={criarConta} className="cartao form-grade">
        <input name="nome" placeholder="Nome (ex: Aluguel)" required className="campo" />
        <select name="categoria" required defaultValue="" className="campo">
          <option value="" disabled>
            Categoria
          </option>
          {CATEGORIAS.map((categoria) => (
            <option key={categoria} value={categoria}>
              {categoria}
            </option>
          ))}
        </select>
        <input
          name="subcategoria"
          placeholder="Subcategoria (opcional)"
          className="campo"
        />
        <input
          name="valor"
          placeholder="Valor"
          type="number"
          step="0.01"
          required
          className="campo"
        />
        <input name="vencimento" type="date" required className="campo" />
        <input name="formaPagamento" placeholder="Forma de pagamento" className="campo" />
        <input
          name="contaBancaria"
          placeholder="Conta bancária ou cartão"
          className="campo"
        />
        <select name="tipo" defaultValue="FIXA" className="campo">
          <option value="FIXA">Conta fixa</option>
          <option value="VARIAVEL">Conta variável</option>
        </select>
        <input name="observacoes" placeholder="Observações (opcional)" className="campo" />
        <label className="campo-checkbox">
          <input type="checkbox" name="recorrenteMensal" defaultChecked />
          Recorrente todo mês
        </label>
        <button type="submit" className="botao">
          Adicionar conta
        </button>
      </form>

      <div className="tabela-wrap">
        <table className="tabela">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Categoria</th>
              <th>Valor</th>
              <th>Vencimento</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {contas.map((conta) => {
              const status = statusExibido(conta);
              return (
                <tr key={conta.id}>
                  <td>
                    <strong>{conta.nome}</strong>
                  </td>
                  <td className="texto-suave">
                    {conta.categoria}
                    {conta.subcategoria ? ` · ${conta.subcategoria}` : ""}
                  </td>
                  <td>{formatCurrency(conta.valor)}</td>
                  <td>{formatDate(conta.vencimento)}</td>
                  <td>
                    <span className={`selo ${STATUS_SELO[status]}`}>
                      {STATUS_LABEL[status]}
                    </span>
                  </td>
                  <td>
                    <div className="acoes">
                      {conta.status !== "PAGA" && (
                        <form action={marcarComoPaga}>
                          <input type="hidden" name="id" value={conta.id} />
                          <button className="link-acao link-sucesso">
                            Marcar como paga
                          </button>
                        </form>
                      )}
                      <form action={excluirConta}>
                        <input type="hidden" name="id" value={conta.id} />
                        <button className="link-acao link-perigo">Excluir</button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {contas.length === 0 && (
              <tr>
                <td colSpan={6} className="tabela-vazia">
                  Nenhuma conta cadastrada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
