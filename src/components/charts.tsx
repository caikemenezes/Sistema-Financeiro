import { formatCurrency } from "@/lib/format";

type PontoFluxo = { dia: number; receitas: number; despesas: number; saldo: number };

function arredondarTeto(valor: number): number {
  if (valor <= 0) return 100;
  const expoente = Math.floor(Math.log10(valor));
  const base = Math.pow(10, expoente);
  const normalizado = valor / base;
  const passo = normalizado <= 1 ? 1 : normalizado <= 2 ? 2 : normalizado <= 5 ? 5 : 10;
  return passo * base;
}

function formatoCompacto(valor: number): string {
  if (Math.abs(valor) >= 1000) return `R$ ${(valor / 1000).toFixed(valor % 1000 === 0 ? 0 : 1)}k`;
  return `R$ ${Math.round(valor)}`;
}

export function GraficoFluxoCaixa({ pontos }: { pontos: PontoFluxo[] }) {
  const teveMovimento = pontos.some((p) => p.receitas > 0 || p.despesas > 0);

  if (!teveMovimento) {
    return (
      <div className="item-vazio">Ainda sem receitas ou contas pagas registradas este mês.</div>
    );
  }

  const largura = 640;
  const altura = 260;
  const padEsq = 46;
  const padDir = 12;
  const padTopo = 12;
  const padBaixo = 26;
  const largPlot = largura - padEsq - padDir;
  const altPlot = altura - padTopo - padBaixo;

  const valores = pontos.flatMap((p) => [p.receitas, p.despesas, p.saldo]);
  const maxBruto = Math.max(...valores, 1);
  const minBruto = Math.min(0, ...valores);
  const maxY = arredondarTeto(maxBruto);
  const minY = minBruto < 0 ? -arredondarTeto(-minBruto) : 0;

  const x = (i: number) => padEsq + (i / (pontos.length - 1)) * largPlot;
  const y = (v: number) => padTopo + ((maxY - v) / (maxY - minY)) * altPlot;

  const linha = (chave: "receitas" | "despesas" | "saldo") =>
    pontos.map((p, i) => `${x(i)},${y(p[chave])}`).join(" ");

  const area = (chave: "receitas" | "despesas" | "saldo") => {
    const pontosLinha = pontos.map((p, i) => `${x(i)},${y(p[chave])}`).join(" L ");
    return `M ${x(0)},${y(0)} L ${pontosLinha} L ${x(pontos.length - 1)},${y(0)} Z`;
  };

  const nTicks = 4;
  const ticks = Array.from({ length: nTicks + 1 }, (_, i) => minY + ((maxY - minY) * i) / nTicks);

  const passoRotulo = Math.max(1, Math.round((pontos.length - 1) / 5));
  const indicesRotulos: number[] = [0];
  for (let i = passoRotulo; i < pontos.length - 1 - passoRotulo / 2; i += passoRotulo) {
    indicesRotulos.push(i);
  }
  indicesRotulos.push(pontos.length - 1);
  const rotulosX = indicesRotulos.map((i) => pontos[i]);

  const ultimo = pontos[pontos.length - 1];
  const finais = [
    { chave: "receitas" as const, valor: ultimo.receitas, cor: "var(--status-bom)" },
    { chave: "despesas" as const, valor: ultimo.despesas, cor: "var(--status-critico)" },
    { chave: "saldo" as const, valor: ultimo.saldo, cor: "var(--dourado-linha)" },
  ].sort((a, b) => y(a.valor) - y(b.valor));

  // Empurra rótulos que colidiriam verticalmente, mantendo o ponto na posição real
  const rotuloY: number[] = [];
  finais.forEach((f, i) => {
    const posicao = y(f.valor);
    rotuloY.push(i === 0 ? posicao : Math.max(posicao, rotuloY[i - 1] + 13));
  });

  return (
    <div className="grafico-svg-wrap">
      <svg viewBox={`0 0 ${largura + 70} ${altura}`} width="100%" role="img" aria-label="Fluxo de caixa do mês">
        <defs>
          <linearGradient id="areaSaldo" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--dourado-linha)" stopOpacity={0.32} />
            <stop offset="100%" stopColor="var(--dourado-linha)" stopOpacity={0} />
          </linearGradient>
        </defs>
        {ticks.map((valorTick, i) => (
          <g key={i}>
            <line
              x1={padEsq}
              x2={padEsq + largPlot}
              y1={y(valorTick)}
              y2={y(valorTick)}
              stroke="var(--cor-borda)"
              strokeWidth={1}
            />
            <text x={padEsq - 8} y={y(valorTick) + 3} textAnchor="end" className="grafico-eixo-texto">
              {formatoCompacto(valorTick)}
            </text>
          </g>
        ))}

        {minY < 0 && (
          <line
            x1={padEsq}
            x2={padEsq + largPlot}
            y1={y(0)}
            y2={y(0)}
            stroke="var(--cor-texto-suave)"
            strokeWidth={1}
          />
        )}

        {rotulosX.map((p) => (
          <text
            key={p.dia}
            x={x(pontos.indexOf(p))}
            y={altura - 6}
            textAnchor="middle"
            className="grafico-eixo-texto"
          >
            {p.dia === 0 ? "início" : `dia ${p.dia}`}
          </text>
        ))}

        <path d={area("saldo")} fill="url(#areaSaldo)" />

        <polyline points={linha("receitas")} fill="none" stroke="var(--status-bom)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={linha("despesas")} fill="none" stroke="var(--status-critico)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={linha("saldo")} fill="none" stroke="var(--dourado-linha)" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />

        {finais.map((f, i) => (
          <g key={f.chave}>
            <circle
              cx={x(pontos.length - 1)}
              cy={y(f.valor)}
              r={4}
              fill={f.cor}
              stroke="var(--cor-fundo-cartao)"
              strokeWidth={2}
            />
            <text
              x={x(pontos.length - 1) + 8}
              y={rotuloY[i] + 3}
              className="grafico-eixo-texto"
              style={{ fill: f.cor, fontWeight: 600 }}
            >
              {formatCurrency(f.valor)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

type FatiaCategoria = { categoria: string; valor: number; percentual: number; cor: string };

export function GraficoGastosPorCategoria({
  dados,
  total,
}: {
  dados: FatiaCategoria[];
  total: number;
}) {
  if (dados.length === 0 || total === 0) {
    return <div className="item-vazio">Nenhuma conta cadastrada este mês ainda.</div>;
  }

  const raio = 62;
  const espessura = 24;
  const cx = 80;
  const cy = 80;
  const circunferencia = 2 * Math.PI * raio;
  const gap = dados.length > 1 ? 3 : 0;

  const comprimentos = dados.map((d) => (d.percentual / 100) * circunferencia);
  const fatias = dados.map((d, i) => {
    const inicioDaFatia = comprimentos.slice(0, i).reduce((soma, c) => soma + c, 0);
    return {
      ...d,
      tracoVisivel: Math.max(comprimentos[i] - gap, 0),
      offset: -inicioDaFatia,
      circunferencia,
    };
  });

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "1.25rem", alignItems: "center" }}>
      <svg
        viewBox="0 0 160 160"
        width={160}
        height={160}
        role="img"
        aria-label="Gastos por categoria"
        style={{ flexShrink: 0 }}
      >
        <g transform={`rotate(-90 ${cx} ${cy})`}>
          {fatias.map((f) => (
            <circle
              key={f.categoria}
              cx={cx}
              cy={cy}
              r={raio}
              fill="none"
              stroke={f.cor}
              strokeWidth={espessura}
              strokeDasharray={`${f.tracoVisivel} ${f.circunferencia - f.tracoVisivel}`}
              strokeDashoffset={f.offset}
            />
          ))}
        </g>
        <text x={cx} y={cy - 4} textAnchor="middle" style={{ fontSize: 10, fill: "var(--cor-texto-suave)" }}>
          Total
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          style={{ fontSize: 13, fontWeight: 700, fill: "var(--cor-texto)" }}
        >
          {formatoCompacto(total)}
        </text>
      </svg>

      <ul className="rosca-lista" style={{ flex: 1, minWidth: "180px" }}>
        {dados.map((d) => (
          <li key={d.categoria} className="rosca-item">
            <span className="legenda-marcador" style={{ background: d.cor }} />
            <span className="rosca-item-nome">{d.categoria}</span>
            <span className="rosca-item-percentual">{Math.round(d.percentual)}%</span>
            <span className="rosca-item-valor">{formatCurrency(d.valor)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
