import { prisma } from "@/lib/prisma";
import { exigirUsuarioAtual } from "@/lib/auth";
import { formatCurrency } from "@/lib/format";
import { criarPrioridade, aportarPrioridade, excluirPrioridade } from "./actions";
import { InfoIcone } from "@/components/info-icone";

export const dynamic = "force-dynamic";

const CATEGORIAS = [
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

function mesesRestantes(mesPlanejado: Date): number {
  const hoje = new Date();
  const meses =
    (mesPlanejado.getUTCFullYear() - hoje.getUTCFullYear()) * 12 +
    (mesPlanejado.getUTCMonth() - hoje.getUTCMonth());
  return Math.max(1, meses);
}

export default async function PrioridadesPage() {
  const usuario = await exigirUsuarioAtual();
  const [itens, membros] = await Promise.all([
    prisma.necessidade.findMany({
      where: { familiaId: usuario.familiaId, status: { not: "CANCELADA" } },
      orderBy: [{ prioridade: "asc" }, { mesPlanejado: "asc" }],
      include: { familiaMembro: true },
    }),
    prisma.familiaMembro.findMany({
      where: { familiaId: usuario.familiaId },
      orderBy: { nome: "asc" },
    }),
  ]);

  return (
    <div className="pilha">
      <div>
        <h1 className="pagina-titulo">Prioridades</h1>
        <p className="pagina-subtitulo">
          Necessidades urgentes da família, com quanto falta guardar por mês.
        </p>
      </div>

      <form action={criarPrioridade} className="cartao form-grade">
        <InfoIcone texto="Cadastre aqui uma necessidade urgente e mais pontual (tênis, mamadeira, material escolar), diferente de uma meta maior. Digite o nome de qualquer pessoa, mesmo que não esteja cadastrada em Família e Filhos." />
        <input name="item" placeholder="Item (ex: Tênis)" required className="campo" />
        <input
          name="pessoaNome"
          placeholder="Nome da pessoa (opcional)"
          list="prioridades-sugestoes-nome"
          className="campo"
        />
        <datalist id="prioridades-sugestoes-nome">
          {membros.map((membro) => (
            <option key={membro.id} value={membro.nome} />
          ))}
        </datalist>
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
          Adicionar prioridade
        </button>
      </form>

      <div className="pilha-pequena">
        {itens.map((item) => {
          const valorRestante = Math.max(0, item.valorEstimado - item.valorGuardado);
          const meses = mesesRestantes(item.mesPlanejado);
          const valorMensal = valorRestante / meses;
          const progresso = Math.min(
            100,
            Math.round((item.valorGuardado / item.valorEstimado) * 100)
          );

          return (
            <div key={item.id} className="cartao pilha-pequena">
              <div className="linha-flex">
                <div>
                  <h3 style={{ margin: 0 }}>{item.item}</h3>
                  <p className="texto-suave" style={{ fontSize: "0.8rem", margin: "0.2rem 0 0 0" }}>
                    {item.categoria}
                    {item.familiaMembro || item.pessoaNome
                      ? ` · ${item.familiaMembro?.nome ?? item.pessoaNome}`
                      : ""}
                    {" · até "}
                    {item.mesPlanejado.toLocaleDateString("pt-BR", {
                      month: "long",
                      year: "numeric",
                      timeZone: "UTC",
                    })}
                    {" · "}
                    <span className={`selo ${PRIORIDADE_SELO[item.prioridade]}`}>
                      {PRIORIDADE_LABEL[item.prioridade]}
                    </span>
                  </p>
                </div>
                <form action={excluirPrioridade}>
                  <input type="hidden" name="id" value={item.id} />
                  <button className="link-acao link-perigo">Excluir</button>
                </form>
              </div>

              <div className="progresso-trilho">
                <div className="progresso-barra" style={{ width: `${progresso}%` }} />
              </div>

              <div className="grupo-valores">
                <div>
                  <p className="stat-rotulo">Estimado</p>
                  <p className="stat-valor" style={{ fontSize: "1rem" }}>
                    {formatCurrency(item.valorEstimado)}
                  </p>
                </div>
                <div>
                  <p className="stat-rotulo">Guardado</p>
                  <p className="stat-valor" style={{ fontSize: "1rem" }}>
                    {formatCurrency(item.valorGuardado)}
                  </p>
                </div>
                <div>
                  <p className="stat-rotulo">Falta</p>
                  <p className="stat-valor" style={{ fontSize: "1rem" }}>
                    {formatCurrency(valorRestante)}
                  </p>
                </div>
                {valorRestante > 0 && (
                  <div>
                    <p className="stat-rotulo">Guardar por mês</p>
                    <p className="stat-valor" style={{ fontSize: "1rem" }}>
                      {formatCurrency(valorMensal)}
                    </p>
                  </div>
                )}
              </div>

              {valorRestante > 0 && (
                <form action={aportarPrioridade} className="linha-flex" style={{ justifyContent: "flex-start" }}>
                  <input type="hidden" name="id" value={item.id} />
                  <input
                    name="valorAporte"
                    type="number"
                    step="0.01"
                    placeholder="Valor a guardar agora"
                    required
                    className="campo"
                    style={{ width: "12rem" }}
                  />
                  <button className="botao botao-pequeno">Reservar valor</button>
                </form>
              )}
            </div>
          );
        })}
        {itens.length === 0 && <p className="texto-suave">Nenhuma prioridade cadastrada ainda.</p>}
      </div>
    </div>
  );
}
