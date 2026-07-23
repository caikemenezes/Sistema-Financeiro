"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/format";
import { GraficoBarraAlocacao } from "@/components/charts";
import { InfoIcone } from "@/components/info-icone";

export type ItemSimulacao = {
  id: string;
  nome: string;
  categoria: string;
  valorSugerido: number;
  valorParcela?: number;
  parcelasRestantes?: number;
};

type ItemEstado = ItemSimulacao & { valor: number; incluido: boolean; parcelas: number };

const CATEGORIAS_PADRAO = ["Contas do Mês", "Dívidas", "Metas", "Prioridades", "Investimentos"];

const COR_POR_CATEGORIA_PADRAO: Record<string, string> = {
  "Contas do Mês": "var(--grafico-1)",
  Dívidas: "var(--grafico-2)",
  Metas: "var(--grafico-3)",
  Prioridades: "var(--grafico-4)",
  Investimentos: "var(--grafico-5)",
};
const COR_PERSONALIZADA_PRINCIPAL = "var(--grafico-6)";
const COR_PERSONALIZADA_OUTRAS = "var(--cor-texto-suave)";

const DESCRICAO_POR_CATEGORIA: Record<string, string> = {
  "Contas do Mês": "Contas pendentes e atrasadas cadastradas em Contas do Mês. Já vêm marcadas, mas você pode desmarcar ou mudar o valor pra testar cenários.",
  Dívidas: "Valor da parcela de cada dívida ativa. Use o seletor de parcelas pra simular adiantar mais de uma parcela no mês (ex: 2 parcelas de uma vez). Se uma dívida não tem parcela definida, o valor sugerido é zero — edite manualmente se quiser simular um pagamento.",
  Metas: "Quanto seria preciso guardar por mês em cada meta pra chegar na data desejada.",
  Prioridades: "Quanto seria preciso guardar por mês em cada prioridade pra chegar no mês planejado.",
  Investimentos: "Aporte mensal planejado de cada investimento cadastrado.",
};

function gerarId(prefixo: string): string {
  return `${prefixo}-${Math.random().toString(36).slice(2, 10)}`;
}

function FormularioNovoItem({
  categoria,
  onAdicionar,
}: {
  categoria: string;
  onAdicionar: (categoria: string, nome: string, valor: number) => void;
}) {
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");

  function submeter(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    onAdicionar(categoria, nome.trim(), Number(valor) || 0);
    setNome("");
    setValor("");
  }

  return (
    <form onSubmit={submeter} className="linha-flex linha-flex-compacta" style={{ gap: "0.5rem" }}>
      <input
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Adicionar item (ex: Conserto do carro)"
        className="campo campo-tabela"
        style={{ flex: 1 }}
      />
      <input
        type="number"
        step="0.01"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder="Valor"
        className="campo campo-tabela"
        style={{ width: "7rem", textAlign: "right" }}
      />
      <button type="submit" className="botao botao-pequeno">
        + Adicionar
      </button>
    </form>
  );
}

function FormularioNovaCategoria({ onCriar }: { onCriar: (nome: string) => void }) {
  const [nome, setNome] = useState("");

  function submeter(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    onCriar(nome.trim());
    setNome("");
  }

  return (
    <form onSubmit={submeter} className="cartao linha-flex linha-flex-compacta" style={{ gap: "0.5rem" }}>
      <input
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Simular algo novo (ex: Reforma da cozinha, Viagem pra praia, Comprar um notebook)"
        className="campo"
        style={{ flex: 1 }}
      />
      <button type="submit" className="botao">
        + Nova simulação
      </button>
    </form>
  );
}

export function SimuladorClient({
  rendaInicial,
  itensIniciais,
}: {
  rendaInicial: number;
  itensIniciais: ItemSimulacao[];
}) {
  const [renda, setRenda] = useState(rendaInicial);
  const [itens, setItens] = useState<ItemEstado[]>(
    itensIniciais.map((item) => ({
      ...item,
      valor: item.valorSugerido,
      incluido: item.valorSugerido > 0,
      parcelas: 1,
    }))
  );
  const [categoriasPersonalizadas, setCategoriasPersonalizadas] = useState<string[]>([]);
  const [calculado, setCalculado] = useState(false);

  function atualizarValor(id: string, valor: number) {
    setItens((atual) => atual.map((item) => (item.id === id ? { ...item, valor } : item)));
  }

  function atualizarParcelas(id: string, parcelas: number) {
    setItens((atual) =>
      atual.map((item) =>
        item.id === id && item.valorParcela
          ? { ...item, parcelas, valor: item.valorParcela * parcelas }
          : item
      )
    );
  }

  function alternarIncluido(id: string) {
    setItens((atual) =>
      atual.map((item) => (item.id === id ? { ...item, incluido: !item.incluido } : item))
    );
  }

  function removerItem(id: string) {
    setItens((atual) => atual.filter((item) => item.id !== id));
  }

  function adicionarItem(categoria: string, nome: string, valor: number) {
    setItens((atual) => [
      ...atual,
      { id: gerarId("item"), nome, categoria, valor, valorSugerido: valor, incluido: true, parcelas: 1 },
    ]);
  }

  function adicionarCategoria(nome: string) {
    setCategoriasPersonalizadas((atual) => (atual.includes(nome) ? atual : [...atual, nome]));
  }

  function removerCategoria(nome: string) {
    setCategoriasPersonalizadas((atual) => atual.filter((c) => c !== nome));
    setItens((atual) => atual.filter((item) => item.categoria !== nome));
  }

  function restaurarValores() {
    setItens((atual) =>
      atual
        .filter((item) => !item.id.startsWith("item-"))
        .map((item) => ({
          ...item,
          valor: item.valorSugerido,
          incluido: item.valorSugerido > 0,
          parcelas: 1,
        }))
    );
    setCategoriasPersonalizadas([]);
  }

  const todasCategorias = [...CATEGORIAS_PADRAO, ...categoriasPersonalizadas];

  const totalDestinado = itens
    .filter((item) => item.incluido)
    .reduce((soma, item) => soma + item.valor, 0);
  const saldoRestante = renda - totalDestinado;
  const percentualDestinado = renda > 0 ? Math.min(100, (totalDestinado / renda) * 100) : 0;

  const corDaCategoria = (categoria: string) => {
    if (COR_POR_CATEGORIA_PADRAO[categoria]) return COR_POR_CATEGORIA_PADRAO[categoria];
    const indice = categoriasPersonalizadas.indexOf(categoria);
    return indice === 0 ? COR_PERSONALIZADA_PRINCIPAL : COR_PERSONALIZADA_OUTRAS;
  };

  const totalBase = Math.max(renda, totalDestinado, 1);
  const fatiasAlocacao = [
    ...todasCategorias
      .map((categoria) => ({
        categoria,
        valor: itens
          .filter((item) => item.categoria === categoria && item.incluido)
          .reduce((soma, item) => soma + item.valor, 0),
        cor: corDaCategoria(categoria),
      }))
      .filter((f) => f.valor > 0),
    saldoRestante >= 0
      ? { categoria: "Sobra", valor: saldoRestante, cor: "var(--dourado-linha)" }
      : { categoria: "Faltando", valor: -saldoRestante, cor: "var(--cor-perigo-texto)" },
  ];

  return (
    <div className="pilha">
      <div className="hero-coluna" style={{ flexDirection: "row", flexWrap: "wrap" }}>
        <div className="cartao cartao-hero" style={{ minWidth: "260px" }}>
          <InfoIcone texto="Comece digitando uma renda hipotética (ex: quanto você imagina receber esse mês). Os cartões abaixo recalculam tudo em cima desse valor." />
          <p className="cartao-hero-rotulo">Renda simulada</p>
          <input
            type="number"
            step="0.01"
            value={renda}
            onChange={(e) => setRenda(Number(e.target.value) || 0)}
            className="campo"
            style={{
              fontSize: "1.7rem",
              fontWeight: 700,
              border: "none",
              background: "transparent",
              padding: "0.3rem 0",
            }}
          />
        </div>

        <div className="cartao cartao-hero" style={{ minWidth: "260px" }}>
          <InfoIcone texto="Renda simulada menos tudo que está marcado (incluído) nas categorias abaixo. Fica vermelho se você destinar mais do que a renda simulada." />
          <p className="cartao-hero-rotulo">Saldo restante</p>
          <p
            className="cartao-hero-valor"
            style={{ color: saldoRestante >= 0 ? "var(--cor-sucesso-texto)" : "var(--cor-perigo-texto)" }}
          >
            {formatCurrency(saldoRestante)}
          </p>
          <p className="cartao-hero-sub">
            Destinado: <strong>{formatCurrency(totalDestinado)}</strong> ({Math.round(percentualDestinado)}% da renda)
          </p>
        </div>
      </div>

      <div className="cartao pilha-pequena">
        <InfoIcone texto="Barra mostrando como a renda simulada se divide entre as categorias marcadas, mais o que sobra (ou falta, se estourar). Passe o mouse numa fatia pra ver o valor exato." />
        <h2 className="cartao-titulo">Para onde vai a renda simulada</h2>
        <GraficoBarraAlocacao fatias={fatiasAlocacao} total={totalBase} />
      </div>

      <button type="button" onClick={restaurarValores} className="botao botao-pequeno" style={{ alignSelf: "flex-start" }}>
        Restaurar valores sugeridos
      </button>

      <div className="cartao cartao-cta pilha-pequena">
        <div>
          <p className="cartao-cta-titulo">Simular um projeto</p>
          <p className="cartao-cta-texto">
            Reforma, viagem, compra grande — dê um nome ao projeto, liste os itens com o valor de
            cada um, e veja o total que vai precisar. Esse total entra automaticamente no cálculo
            do saldo do mês acima.
          </p>
        </div>
        <FormularioNovaCategoria onCriar={adicionarCategoria} />
      </div>

      {categoriasPersonalizadas.map((categoria) => {
        const itensDoProjeto = itens.filter((item) => item.categoria === categoria);
        const totalProjeto = itensDoProjeto
          .filter((item) => item.incluido)
          .reduce((soma, item) => soma + item.valor, 0);

        return (
          <div
            key={categoria}
            className="cartao pilha-pequena"
            style={{ borderLeft: `4px solid ${corDaCategoria(categoria)}` }}
          >
            <div className="linha-flex">
              <h2 className="cartao-titulo" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {categoria}
                <span className="selo selo-neutro">Projeto</span>
              </h2>
              <button
                type="button"
                onClick={() => removerCategoria(categoria)}
                className="link-acao link-perigo"
              >
                Remover simulação
              </button>
            </div>

            {itensDoProjeto.length === 0 && (
              <p className="item-vazio">Nenhum item ainda — adicione o que esse projeto vai precisar abaixo.</p>
            )}

            {itensDoProjeto.map((item) => (
              <div key={item.id} className="linha-flex item-bloco linha-flex-compacta" style={{ gap: "0.75rem" }}>
                <label className="campo-checkbox" style={{ flex: 1, minWidth: 0 }}>
                  <input type="checkbox" checked={item.incluido} onChange={() => alternarIncluido(item.id)} />
                  <span style={{ opacity: item.incluido ? 1 : 0.5 }}>{item.nome}</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={item.valor}
                  onChange={(e) => atualizarValor(item.id, Number(e.target.value) || 0)}
                  disabled={!item.incluido}
                  className="campo campo-tabela"
                  style={{ width: "8rem", textAlign: "right", opacity: item.incluido ? 1 : 0.5 }}
                />
                <button type="button" onClick={() => removerItem(item.id)} className="link-acao link-perigo">
                  Remover
                </button>
              </div>
            ))}

            <FormularioNovoItem categoria={categoria} onAdicionar={adicionarItem} />

            <div className="linha-flex" style={{ borderTop: "1px solid var(--cor-borda)", paddingTop: "0.6rem" }}>
              <p className="cartao-hero-rotulo" style={{ margin: 0 }}>
                Total do projeto
              </p>
              <p className="cartao-hero-valor" style={{ fontSize: "1.3rem" }}>
                {formatCurrency(totalProjeto)}
              </p>
            </div>
          </div>
        );
      })}

      {CATEGORIAS_PADRAO.map((categoria) => {
        const itensDaCategoria = itens.filter((item) => item.categoria === categoria);
        const subtotal = itensDaCategoria
          .filter((item) => item.incluido)
          .reduce((soma, item) => soma + item.valor, 0);

        return (
          <div key={categoria} className="cartao pilha-pequena">
            <InfoIcone texto={DESCRICAO_POR_CATEGORIA[categoria] ?? ""} />
            <div className="linha-flex">
              <h2 className="cartao-titulo">{categoria}</h2>
              <p className="texto-suave" style={{ fontSize: "0.85rem", margin: 0 }}>
                Subtotal: <strong>{formatCurrency(subtotal)}</strong>
              </p>
            </div>

            {itensDaCategoria.length === 0 && (
              <p className="item-vazio">Nada aqui ainda — adicione um item abaixo pra simular.</p>
            )}

            {itensDaCategoria.map((item) => (
              <div key={item.id} className="linha-flex item-bloco linha-flex-compacta" style={{ gap: "0.75rem" }}>
                <label className="campo-checkbox" style={{ flex: 1, minWidth: 0 }}>
                  <input type="checkbox" checked={item.incluido} onChange={() => alternarIncluido(item.id)} />
                  <span style={{ opacity: item.incluido ? 1 : 0.5 }}>{item.nome}</span>
                </label>
                {item.valorParcela && (
                  <label
                    className="texto-suave"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      fontSize: "0.8rem",
                      opacity: item.incluido ? 1 : 0.5,
                    }}
                    title="Quantas parcelas pagar de uma vez neste mês"
                  >
                    Parcelas
                    <input
                      type="number"
                      min={1}
                      max={item.parcelasRestantes ?? undefined}
                      step="1"
                      value={item.parcelas}
                      onChange={(e) =>
                        atualizarParcelas(item.id, Math.max(1, Number(e.target.value) || 1))
                      }
                      disabled={!item.incluido}
                      className="campo campo-tabela"
                      style={{ width: "3.5rem", textAlign: "center" }}
                    />
                    {item.parcelasRestantes && `/${item.parcelasRestantes}`}
                  </label>
                )}
                <input
                  type="number"
                  step="0.01"
                  value={item.valor}
                  onChange={(e) => atualizarValor(item.id, Number(e.target.value) || 0)}
                  disabled={!item.incluido}
                  className="campo campo-tabela"
                  style={{ width: "8rem", textAlign: "right", opacity: item.incluido ? 1 : 0.5 }}
                />
                <button type="button" onClick={() => removerItem(item.id)} className="link-acao link-perigo">
                  Remover
                </button>
              </div>
            ))}

            <FormularioNovoItem categoria={categoria} onAdicionar={adicionarItem} />
          </div>
        );
      })}

      <div className="cartao" style={{ alignItems: "center", textAlign: "center" }}>
        <button
          type="button"
          onClick={() => setCalculado(true)}
          className="botao"
          style={{ fontSize: "1rem", padding: "0.75rem 2.5rem" }}
        >
          Calcular simulação
        </button>
      </div>

      {calculado && (
        <div className="cartao pilha-pequena">
          <InfoIcone texto="Resumo final: quanto sobra ou falta, e a porcentagem da renda que vai pra cada categoria — inclusive projetos personalizados que você criou." />
          <h2 className="cartao-titulo">Resultado da simulação</h2>

          <div className="linha-flex">
            <p className="texto-suave" style={{ margin: 0 }}>
              Renda simulada
            </p>
            <p style={{ margin: 0, fontWeight: 700 }}>{formatCurrency(renda)}</p>
          </div>
          <div className="linha-flex">
            <p className="texto-suave" style={{ margin: 0 }}>
              Total destinado
            </p>
            <p style={{ margin: 0, fontWeight: 700 }}>
              {formatCurrency(totalDestinado)} ({Math.round(percentualDestinado)}%)
            </p>
          </div>
          <div className="linha-flex">
            <p className="texto-suave" style={{ margin: 0 }}>
              Saldo restante
            </p>
            <p
              style={{
                margin: 0,
                fontWeight: 700,
                color: saldoRestante >= 0 ? "var(--cor-sucesso-texto)" : "var(--cor-perigo-texto)",
              }}
            >
              {formatCurrency(saldoRestante)}
            </p>
          </div>

          <div className="tabela-wrap">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Para onde vai</th>
                  <th>Valor</th>
                  <th>% da renda</th>
                </tr>
              </thead>
              <tbody>
                {fatiasAlocacao.map((fatia) => (
                  <tr key={fatia.categoria}>
                    <td>
                      <span
                        className="legenda-marcador"
                        style={{ background: fatia.cor, marginRight: "0.5rem" }}
                      />
                      {fatia.categoria}
                    </td>
                    <td>{formatCurrency(fatia.valor)}</td>
                    <td>{Math.round((fatia.valor / totalBase) * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
