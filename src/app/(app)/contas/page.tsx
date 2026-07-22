import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency, toDateInputValue } from "@/lib/format";
import { getDashboardData } from "@/lib/dashboard";
import { BarraHorizontal } from "@/components/charts";
import { IconClock, IconCheckCircle, IconWallet, IconAlertTriangle } from "@/components/icons";
import { criarConta, editarConta, marcarComoPaga, excluirConta } from "./actions";

export const dynamic = "force-dynamic";

const CATEGORIAS = [
  "Moradia",
  "Alimentação",
  "Transporte",
  "Saúde",
  "Assinaturas",
  "Trabalho e estudos",
  "Cartão de Crédito",
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

const FILTROS = [
  { valor: "todas", label: "Todas", status: null },
  { valor: "pendente", label: "Pendentes", status: "PENDENTE" },
  { valor: "atrasada", label: "Atrasadas", status: "ATRASADA" },
  { valor: "paga", label: "Pagas", status: "PAGA" },
] as const;

export default async function ContasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const filtroAtivo = FILTROS.some((f) => f.valor === params.status) ? params.status! : "todas";

  const [contasBrutas, dashboardData] = await Promise.all([
    prisma.contaMes.findMany({ orderBy: { vencimento: "asc" } }),
    getDashboardData(),
  ]);

  const contas = contasBrutas.map((conta) => ({ ...conta, statusExibido: statusExibido(conta) }));

  const totalPendente = contas
    .filter((conta) => conta.statusExibido === "PENDENTE")
    .reduce((soma, conta) => soma + conta.valor, 0);
  const totalAtrasado = contas
    .filter((conta) => conta.statusExibido === "ATRASADA")
    .reduce((soma, conta) => soma + conta.valor, 0);
  const totalPago = contas
    .filter((conta) => conta.statusExibido === "PAGA")
    .reduce((soma, conta) => soma + conta.valor, 0);
  const totalAPagar = totalPendente + totalAtrasado;
  const saldoEmCaixa = dashboardData.saldoDisponivel;
  const maiorValor = Math.max(totalAPagar, totalPago, saldoEmCaixa, 1);

  const contasFiltradas =
    filtroAtivo === "todas"
      ? contas
      : contas.filter(
          (conta) => conta.statusExibido === FILTROS.find((f) => f.valor === filtroAtivo)?.status
        );

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

      <div style={{ display: "none" }}>
        {contasFiltradas.map((conta) => (
          <form key={`editar-${conta.id}`} id={`editar-conta-${conta.id}`} action={editarConta}>
            <input type="hidden" name="id" value={conta.id} />
          </form>
        ))}
      </div>

      <div className="filtro-abas">
        {FILTROS.map((filtro) => {
          const quantidade =
            filtro.valor === "todas"
              ? contas.length
              : contas.filter((conta) => conta.statusExibido === filtro.status).length;
          return (
            <Link
              key={filtro.valor}
              href={filtro.valor === "todas" ? "/contas" : `/contas?status=${filtro.valor}`}
              className={`filtro-aba ${filtroAtivo === filtro.valor ? "filtro-aba-ativa" : ""}`}
            >
              {filtro.label}
              <span className="filtro-aba-contagem">{quantidade}</span>
            </Link>
          );
        })}
      </div>

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
            {contasFiltradas.map((conta) => {
              const status = conta.statusExibido;
              const formId = `editar-conta-${conta.id}`;
              return (
                <tr key={conta.id}>
                  <td>
                    <input
                      form={formId}
                      name="nome"
                      defaultValue={conta.nome}
                      required
                      className="campo campo-tabela"
                    />
                  </td>
                  <td>
                    <select
                      form={formId}
                      name="categoria"
                      defaultValue={conta.categoria}
                      className="campo campo-tabela"
                    >
                      {CATEGORIAS.map((categoria) => (
                        <option key={categoria} value={categoria}>
                          {categoria}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      form={formId}
                      name="valor"
                      type="number"
                      step="0.01"
                      defaultValue={conta.valor}
                      required
                      className="campo campo-tabela"
                      style={{ width: "7rem" }}
                    />
                  </td>
                  <td>
                    <input
                      form={formId}
                      name="vencimento"
                      type="date"
                      defaultValue={toDateInputValue(conta.vencimento)}
                      required
                      className="campo campo-tabela"
                    />
                  </td>
                  <td>
                    <span className={`selo ${STATUS_SELO[status]}`}>
                      {STATUS_LABEL[status]}
                    </span>
                  </td>
                  <td>
                    <div className="acoes">
                      <button form={formId} type="submit" className="link-acao link-sucesso">
                        Salvar
                      </button>
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
            {contasFiltradas.length === 0 && (
              <tr>
                <td colSpan={6} className="tabela-vazia">
                  {contas.length === 0
                    ? "Nenhuma conta cadastrada ainda."
                    : "Nenhuma conta nesse filtro."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="cartao pilha-pequena">
        <h2 className="cartao-titulo">Resumo de pagamentos</h2>

        {filtroAtivo !== "paga" && (
            <div className="item-lista-rica item-lista-rica-com-barra">
              <div className="item-lista-rica-linha">
                <span className="item-icone">
                  {filtroAtivo === "atrasada" ? (
                    <IconAlertTriangle size={18} />
                  ) : (
                    <IconClock size={18} />
                  )}
                </span>
                <div className="item-corpo">
                  <p className="item-titulo">
                    {filtroAtivo === "pendente"
                      ? "Pendente"
                      : filtroAtivo === "atrasada"
                        ? "Atrasado"
                        : "Falta pagar"}
                  </p>
                  <p className="item-subtitulo">
                    {filtroAtivo === "pendente"
                      ? "Contas pendentes"
                      : filtroAtivo === "atrasada"
                        ? "Contas atrasadas"
                        : "Contas pendentes e atrasadas"}
                  </p>
                </div>
                <span className="item-valor">
                  {formatCurrency(
                    filtroAtivo === "pendente"
                      ? totalPendente
                      : filtroAtivo === "atrasada"
                        ? totalAtrasado
                        : totalAPagar
                  )}
                </span>
              </div>
              <BarraHorizontal
                valor={
                  filtroAtivo === "pendente"
                    ? totalPendente
                    : filtroAtivo === "atrasada"
                      ? totalAtrasado
                      : totalAPagar
                }
                max={maiorValor}
              />
            </div>
          )}

        {(filtroAtivo === "todas" || filtroAtivo === "paga") && (
          <div className="item-lista-rica item-lista-rica-com-barra">
            <div className="item-lista-rica-linha">
              <span className="item-icone">
                <IconCheckCircle size={18} />
              </span>
              <div className="item-corpo">
                <p className="item-titulo">Já pago</p>
                <p className="item-subtitulo">Contas quitadas</p>
              </div>
              <span className="item-valor">{formatCurrency(totalPago)}</span>
            </div>
            <BarraHorizontal valor={totalPago} max={maiorValor} />
          </div>
        )}

        <div className="item-lista-rica item-lista-rica-com-barra">
          <div className="item-lista-rica-linha">
            <span className="item-icone">
              <IconWallet size={18} />
            </span>
            <div className="item-corpo">
              <p className="item-titulo">Em caixa</p>
              <p className="item-subtitulo">Saldo disponível no mês</p>
            </div>
            <span className="item-valor">{formatCurrency(saldoEmCaixa)}</span>
          </div>
          <BarraHorizontal valor={Math.max(saldoEmCaixa, 0)} max={maiorValor} />
        </div>
      </div>
    </div>
  );
}
