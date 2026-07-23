import { prisma } from "@/lib/prisma";
import { exigirUsuarioAtual } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/format";
import { criarReceita, marcarComoRecebida, excluirReceita } from "./actions";
import { InfoIcone } from "@/components/info-icone";

export const dynamic = "force-dynamic";

const TIPOS = [
  "Salário",
  "Trabalho freelancer",
  "Serviços de audiovisual",
  "Venda de produtos",
  "Comissão",
  "Renda extra",
  "Benefícios",
  "Cashback",
  "Outros",
];

export default async function ReceitasPage() {
  const usuario = await exigirUsuarioAtual();
  const receitas = await prisma.receita.findMany({
    where: { familiaId: usuario.familiaId },
    orderBy: { dataPrevista: "asc" },
  });

  return (
    <div className="pilha">
      <div>
        <h1 className="pagina-titulo">Receitas</h1>
        <p className="pagina-subtitulo">Tudo que entra: previsto e recebido.</p>
      </div>

      <form action={criarReceita} className="cartao form-grade">
        <InfoIcone texto="Cadastre aqui uma entrada de dinheiro prevista (salário, freelance, etc.). Depois marque como recebida quando o valor cair na conta — isso é o que alimenta a Renda do Mês no Dashboard." />
        <input name="nome" placeholder="Nome" required className="campo" />
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
          name="valorPrevisto"
          placeholder="Valor previsto"
          type="number"
          step="0.01"
          required
          className="campo"
        />
        <input name="dataPrevista" type="date" required className="campo" />
        <input name="categoria" placeholder="Categoria (opcional)" className="campo" />
        <input
          name="contaBancaria"
          placeholder="Conta bancária (opcional)"
          className="campo"
        />
        <input name="observacao" placeholder="Observação (opcional)" className="campo" />
        <label className="campo-checkbox">
          <input type="checkbox" name="recorrente" />
          Recorrente
        </label>
        <button type="submit" className="botao">
          Adicionar receita
        </button>
      </form>

      <div className="tabela-wrap">
        <table className="tabela">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Tipo</th>
              <th>Previsto</th>
              <th>Data prevista</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {receitas.map((receita) => (
              <tr key={receita.id}>
                <td>
                  <strong>{receita.nome}</strong>
                </td>
                <td className="texto-suave">{receita.tipo}</td>
                <td>{formatCurrency(receita.valorPrevisto)}</td>
                <td>{formatDate(receita.dataPrevista)}</td>
                <td>
                  <span
                    className={`selo ${
                      receita.status === "RECEBIDO" ? "selo-sucesso" : "selo-alerta"
                    }`}
                  >
                    {receita.status === "RECEBIDO" ? "Recebida" : "Prevista"}
                  </span>
                </td>
                <td>
                  <div className="acoes">
                    {receita.status !== "RECEBIDO" && (
                      <form action={marcarComoRecebida}>
                        <input type="hidden" name="id" value={receita.id} />
                        <button className="link-acao link-sucesso">
                          Marcar como recebida
                        </button>
                      </form>
                    )}
                    <form action={excluirReceita}>
                      <input type="hidden" name="id" value={receita.id} />
                      <button className="link-acao link-perigo">Excluir</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {receitas.length === 0 && (
              <tr>
                <td colSpan={6} className="tabela-vazia">
                  Nenhuma receita cadastrada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
