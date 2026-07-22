"use client";

import { useState } from "react";
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

/** Caminho SVG suavizado (Catmull-Rom → Bézier) passando por todos os pontos. */
function caminhoSuave(pontosXY: Array<[number, number]>): string {
  if (pontosXY.length < 2) return "";
  let d = `M ${pontosXY[0][0]},${pontosXY[0][1]}`;
  for (let i = 0; i < pontosXY.length - 1; i++) {
    const p0 = pontosXY[i - 1] ?? pontosXY[i];
    const p1 = pontosXY[i];
    const p2 = pontosXY[i + 1];
    const p3 = pontosXY[i + 2] ?? p2;
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
  }
  return d;
}

export function GraficoFluxoCaixa({ pontos }: { pontos: PontoFluxo[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const teveMovimento = pontos.some((p) => p.receitas > 0 || p.despesas > 0);

  if (!teveMovimento) {
    return (
      <div className="item-vazio">Ainda sem receitas ou contas pagas registradas este mês.</div>
    );
  }

  const largura = 600;
  const altura = 210;
  const padEsq = 46;
  const padDir = 12;
  const padTopo = 10;
  const padBaixo = 22;
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
    caminhoSuave(pontos.map((p, i) => [x(i), y(p[chave])]));

  const area = (chave: "receitas" | "despesas" | "saldo") => {
    const topo = caminhoSuave(pontos.map((p, i) => [x(i), y(p[chave])]));
    return `${topo} L ${x(pontos.length - 1)},${y(0)} L ${x(0)},${y(0)} Z`;
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

  const coresBase = { receitas: "#b6b5bf", despesas: "#726f7d", saldo: "#f5f5f6" } as const;
  const coresPastel = { receitas: "#a8dab8", despesas: "#eeaeae", saldo: "#e9d18c" } as const;
  const estaHover = hoverIndex !== null;
  const corDe = (chave: "receitas" | "despesas" | "saldo") =>
    estaHover ? coresPastel[chave] : coresBase[chave];

  const ultimo = pontos[pontos.length - 1];
  const finais = [
    { chave: "receitas" as const, valor: ultimo.receitas },
    { chave: "despesas" as const, valor: ultimo.despesas },
    { chave: "saldo" as const, valor: ultimo.saldo },
  ].sort((a, b) => y(a.valor) - y(b.valor));

  // Empurra rótulos que colidiriam verticalmente, mantendo o ponto na posição real
  const rotuloY: number[] = [];
  finais.forEach((f, i) => {
    const posicao = y(f.valor);
    rotuloY.push(i === 0 ? posicao : Math.max(posicao, rotuloY[i - 1] + 13));
  });

  const larguraTotal = largura + 70;

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percentX = (e.clientX - rect.left) / rect.width;
    const alvoX = percentX * larguraTotal;
    let maisProximo = 0;
    let menorDistancia = Infinity;
    pontos.forEach((_, i) => {
      const distancia = Math.abs(x(i) - alvoX);
      if (distancia < menorDistancia) {
        menorDistancia = distancia;
        maisProximo = i;
      }
    });
    setHoverIndex(maisProximo);
  };

  const pontoHover = hoverIndex !== null ? pontos[hoverIndex] : null;
  const variacaoHover =
    pontoHover && pontos[0].saldo !== 0
      ? Math.round(((pontoHover.saldo - pontos[0].saldo) / Math.abs(pontos[0].saldo)) * 100)
      : null;

  return (
    <div className="grafico-svg-wrap" style={{ position: "relative" }}>
      <svg
        viewBox={`0 0 ${larguraTotal} ${altura}`}
        width="100%"
        role="img"
        aria-label="Fluxo de caixa do mês"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id="areaSaldo" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={corDe("saldo")} stopOpacity={0.16} />
            <stop offset="100%" stopColor={corDe("saldo")} stopOpacity={0} />
          </linearGradient>
          <filter id="brilhoPonto" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
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

        <path
          d={linha("receitas")}
          fill="none"
          stroke={corDe("receitas")}
          strokeWidth={1.3}
          strokeOpacity={0.7}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transition: "stroke 0.2s ease" }}
        />
        <path
          d={linha("despesas")}
          fill="none"
          stroke={corDe("despesas")}
          strokeWidth={1.3}
          strokeOpacity={0.85}
          strokeDasharray="4 4"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transition: "stroke 0.2s ease" }}
        />
        <path
          d={linha("saldo")}
          fill="none"
          stroke={corDe("saldo")}
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transition: "stroke 0.2s ease" }}
        />

        {finais.map((f, i) => (
          <g key={f.chave}>
            <circle
              cx={x(pontos.length - 1)}
              cy={y(f.valor)}
              r={4}
              fill={corDe(f.chave)}
              stroke="var(--cor-fundo-cartao)"
              strokeWidth={2}
              style={{ transition: "fill 0.2s ease" }}
            />
            <text
              x={x(pontos.length - 1) + 8}
              y={rotuloY[i] + 3}
              className="grafico-eixo-texto"
              style={{ fill: "var(--cor-texto-suave)", fontWeight: 500 }}
            >
              {formatCurrency(f.valor)}
            </text>
          </g>
        ))}

        {pontoHover && (
          <g>
            <line
              x1={x(hoverIndex!)}
              x2={x(hoverIndex!)}
              y1={padTopo}
              y2={padTopo + altPlot}
              stroke="var(--cor-texto-suave)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <circle
              cx={x(hoverIndex!)}
              cy={y(pontoHover.saldo)}
              r={5}
              fill={corDe("saldo")}
              stroke="var(--cor-fundo-cartao)"
              strokeWidth={2}
              filter="url(#brilhoPonto)"
            />
          </g>
        )}
      </svg>

      {pontoHover && (
        <div
          className="grafico-tooltip"
          style={{
            left: `${(x(hoverIndex!) / larguraTotal) * 100}%`,
            top: `${(y(pontoHover.saldo) / altura) * 100}%`,
          }}
        >
          <p className="grafico-tooltip-data">
            {pontoHover.dia === 0 ? "Início do mês" : `Dia ${pontoHover.dia}`}
          </p>

          <div className="grafico-tooltip-linha">
            <span className="grafico-tooltip-chave" style={{ background: corDe("receitas") }} />
            <span className="grafico-tooltip-rotulo">Receitas</span>
            <span className="grafico-tooltip-valor-item">{formatCurrency(pontoHover.receitas)}</span>
          </div>
          <div className="grafico-tooltip-linha">
            <span className="grafico-tooltip-chave" style={{ background: corDe("despesas") }} />
            <span className="grafico-tooltip-rotulo">Despesas</span>
            <span className="grafico-tooltip-valor-item">{formatCurrency(pontoHover.despesas)}</span>
          </div>
          <div className="grafico-tooltip-linha grafico-tooltip-linha-destaque">
            <span className="grafico-tooltip-chave" style={{ background: corDe("saldo") }} />
            <span className="grafico-tooltip-rotulo">Saldo</span>
            <span className="grafico-tooltip-valor-item">
              {formatCurrency(pontoHover.saldo)}
              {variacaoHover !== null && (
                <span
                  className={`selo-delta ${variacaoHover >= 0 ? "selo-delta-positivo" : "selo-delta-negativo"}`}
                  style={{ marginLeft: "0.4rem" }}
                >
                  {variacaoHover >= 0 ? "+" : ""}
                  {variacaoHover}%
                </span>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

type PontoMensal = { mes: number; label: string; receitas: number; despesas: number };

/** Linha de evolução mensal — compara receitas x despesas ao longo dos 12 meses do ano. */
export function GraficoEvolucaoMensal({ pontos }: { pontos: PontoMensal[] }) {
  const teveMovimento = pontos.some((p) => p.receitas > 0 || p.despesas > 0);

  if (!teveMovimento) {
    return <div className="item-vazio">Nenhuma receita recebida ou conta paga neste ano ainda.</div>;
  }

  const largura = 640;
  const altura = 220;
  const padEsq = 50;
  const padDir = 60;
  const padTopo = 14;
  const padBaixo = 26;
  const largPlot = largura - padEsq - padDir;
  const altPlot = altura - padTopo - padBaixo;

  const maxBruto = Math.max(...pontos.flatMap((p) => [p.receitas, p.despesas]), 1);
  const maxY = arredondarTeto(maxBruto);

  const x = (i: number) => padEsq + (i / (pontos.length - 1)) * largPlot;
  const y = (v: number) => padTopo + ((maxY - v) / maxY) * altPlot;

  const linha = (chave: "receitas" | "despesas") =>
    pontos.map((p, i) => `${x(i)},${y(p[chave])}`).join(" L ");

  const nTicks = 4;
  const ticks = Array.from({ length: nTicks + 1 }, (_, i) => (maxY * i) / nTicks);

  const ultimo = pontos[pontos.length - 1];
  const cores = { receitas: "var(--cor-sucesso-texto)", despesas: "var(--cor-perigo-texto)" } as const;

  return (
    <div className="grafico-svg-wrap">
      <svg viewBox={`0 0 ${largura} ${altura}`} width="100%" role="img" aria-label="Receitas x despesas por mês">
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

        {pontos.map((p, i) => (
          <text key={p.mes} x={x(i)} y={altura - 6} textAnchor="middle" className="grafico-eixo-texto">
            {p.label}
          </text>
        ))}

        <path d={`M ${linha("receitas")}`} fill="none" stroke={cores.receitas} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <path d={`M ${linha("despesas")}`} fill="none" stroke={cores.despesas} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        <circle cx={x(pontos.length - 1)} cy={y(ultimo.receitas)} r={4} fill={cores.receitas} stroke="var(--cor-fundo-cartao)" strokeWidth={2} />
        <circle cx={x(pontos.length - 1)} cy={y(ultimo.despesas)} r={4} fill={cores.despesas} stroke="var(--cor-fundo-cartao)" strokeWidth={2} />

        <text x={x(pontos.length - 1) + 8} y={y(ultimo.receitas) + 3} className="grafico-eixo-texto" style={{ fill: cores.receitas, fontWeight: 600 }}>
          {formatoCompacto(ultimo.receitas)}
        </text>
        <text x={x(pontos.length - 1) + 8} y={y(ultimo.despesas) + 3} className="grafico-eixo-texto" style={{ fill: cores.despesas, fontWeight: 600 }}>
          {formatoCompacto(ultimo.despesas)}
        </text>
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

type FatiaAlocacao = { categoria: string; valor: number; cor: string };

/** Barra empilhada horizontal — mostra como um total (ex: renda) se divide entre categorias. */
export function GraficoBarraAlocacao({ fatias, total }: { fatias: FatiaAlocacao[]; total: number }) {
  const [hoverCategoria, setHoverCategoria] = useState<string | null>(null);

  if (total <= 0) {
    return <div className="item-vazio">Informe uma renda simulada maior que zero.</div>;
  }

  const fatiasVisiveis = fatias.filter((f) => f.valor > 0);

  // Posição horizontal (centro, em %) de cada fatia, calculada fora da faixa com overflow
  // recortado — o tooltip é irmão da faixa, não filho, pra não ser cortado pelas bordas arredondadas.
  const fatiasComPosicao = fatiasVisiveis.reduce<Array<FatiaAlocacao & { largura: number; centro: number }>>(
    (acumuladas, fatia) => {
      const acumulado = acumuladas.reduce((soma, f) => soma + f.largura, 0);
      const largura = (fatia.valor / total) * 100;
      const centro = acumulado + largura / 2;
      return [...acumuladas, { ...fatia, largura, centro }];
    },
    []
  );
  const fatiaHover = fatiasComPosicao.find((f) => f.categoria === hoverCategoria);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ position: "relative" }}>
        <div
          style={{
            display: "flex",
            gap: "2px",
            height: "22px",
            borderRadius: "999px",
            overflow: "hidden",
            background: "var(--cor-fundo-cartao-alt)",
          }}
        >
          {fatiasComPosicao.map((fatia) => (
            <div
              key={fatia.categoria}
              onMouseEnter={() => setHoverCategoria(fatia.categoria)}
              onMouseLeave={() => setHoverCategoria(null)}
              style={{
                width: `${fatia.largura}%`,
                background: fatia.cor,
                filter: hoverCategoria && hoverCategoria !== fatia.categoria ? "brightness(0.7)" : undefined,
                transition: "filter 0.15s ease",
              }}
            />
          ))}
        </div>

        {fatiaHover && (
          <div className="grafico-tooltip" style={{ left: `${fatiaHover.centro}%`, top: "0" }}>
            <div className="grafico-tooltip-linha grafico-tooltip-linha-destaque" style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}>
              <span className="grafico-tooltip-chave" style={{ background: fatiaHover.cor }} />
              <span className="grafico-tooltip-rotulo">{fatiaHover.categoria}</span>
              <span className="grafico-tooltip-valor-item">
                {formatCurrency(fatiaHover.valor)} · {Math.round((fatiaHover.valor / total) * 100)}%
              </span>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem 1.25rem" }}>
        {fatiasVisiveis.map((fatia) => (
          <span key={fatia.categoria} className="legenda-item" style={{ fontSize: "0.8rem" }}>
            <span className="legenda-marcador" style={{ background: fatia.cor }} />
            {fatia.categoria}
            <span className="texto-suave">{formatCurrency(fatia.valor)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Barra horizontal compacta — mostra o valor proporcional ao maior item da lista. */
export function BarraHorizontal({ valor, max }: { valor: number; max: number }) {
  const percentual = max > 0 ? Math.min(100, (valor / max) * 100) : 0;
  return (
    <div className="barra-horizontal-trilho">
      <div className="barra-horizontal-preenchida" style={{ width: `${percentual}%` }} />
    </div>
  );
}

/** Anel de progresso (gauge circular) — usado para metas em andamento. */
export function AnelProgresso({ percentual, tamanho = 46 }: { percentual: number; tamanho?: number }) {
  const espessura = 5;
  const raio = (tamanho - espessura) / 2;
  const centro = tamanho / 2;
  const circunferencia = 2 * Math.PI * raio;
  const pct = Math.min(100, Math.max(0, percentual));
  const tracoVisivel = (pct / 100) * circunferencia;

  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox={`0 0 ${tamanho} ${tamanho}`}
      role="img"
      aria-label={`${Math.round(pct)}% concluído`}
      style={{ flexShrink: 0 }}
    >
      <circle
        cx={centro}
        cy={centro}
        r={raio}
        fill="none"
        stroke="var(--cor-fundo-cartao-alt)"
        strokeWidth={espessura}
      />
      <circle
        cx={centro}
        cy={centro}
        r={raio}
        fill="none"
        stroke="var(--dourado-linha)"
        strokeWidth={espessura}
        strokeLinecap="round"
        strokeDasharray={`${tracoVisivel} ${circunferencia - tracoVisivel}`}
        transform={`rotate(-90 ${centro} ${centro})`}
      />
      <text
        x={centro}
        y={centro + 4}
        textAnchor="middle"
        style={{ fontSize: tamanho * 0.24, fontWeight: 700, fill: "var(--cor-texto)" }}
      >
        {Math.round(pct)}%
      </text>
    </svg>
  );
}
