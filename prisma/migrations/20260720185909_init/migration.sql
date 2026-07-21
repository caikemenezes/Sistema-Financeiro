-- CreateTable
CREATE TABLE "ContaBancaria" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "banco" TEXT,
    "saldoInicial" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "FamiliaMembro" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "parentesco" TEXT NOT NULL,
    "dataNascimento" DATETIME,
    "observacoes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Receita" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "valorPrevisto" REAL NOT NULL,
    "valorRecebido" REAL,
    "dataPrevista" DATETIME NOT NULL,
    "dataRecebimento" DATETIME,
    "categoria" TEXT,
    "recorrente" BOOLEAN NOT NULL DEFAULT false,
    "contaBancariaId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PREVISTO',
    "observacao" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Receita_contaBancariaId_fkey" FOREIGN KEY ("contaBancariaId") REFERENCES "ContaBancaria" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContaMes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "subcategoria" TEXT,
    "valor" REAL NOT NULL,
    "vencimento" DATETIME NOT NULL,
    "formaPagamento" TEXT,
    "contaBancariaId" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'FIXA',
    "recorrenteMensal" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "dataPagamento" DATETIME,
    "observacoes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContaMes_contaBancariaId_fkey" FOREIGN KEY ("contaBancariaId") REFERENCES "ContaBancaria" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Cartao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "banco" TEXT,
    "limiteTotal" REAL NOT NULL,
    "diaFechamento" INTEGER NOT NULL,
    "diaVencimento" INTEGER NOT NULL,
    "contaBancariaId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Cartao_contaBancariaId_fkey" FOREIGN KEY ("contaBancariaId") REFERENCES "ContaBancaria" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompraCartao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cartaoId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "valorTotal" REAL NOT NULL,
    "numeroParcelas" INTEGER NOT NULL DEFAULT 1,
    "dataCompra" DATETIME NOT NULL,
    "familiaMembroId" TEXT,
    "classificacao" TEXT NOT NULL DEFAULT 'IMPORTANTE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompraCartao_cartaoId_fkey" FOREIGN KEY ("cartaoId") REFERENCES "Cartao" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CompraCartao_familiaMembroId_fkey" FOREIGN KEY ("familiaMembroId") REFERENCES "FamiliaMembro" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Parcela" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "compraId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "valor" REAL NOT NULL,
    "mesReferencia" DATETIME NOT NULL,
    "paga" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Parcela_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES "CompraCartao" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Meta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "categoria" TEXT,
    "valorEstimado" REAL NOT NULL,
    "valorGuardado" REAL NOT NULL DEFAULT 0,
    "dataDesejada" DATETIME,
    "prioridade" TEXT NOT NULL DEFAULT 'MEDIA',
    "status" TEXT NOT NULL DEFAULT 'PLANEJADA',
    "familiaMembroId" TEXT,
    "observacoes" TEXT,
    "linksPesquisados" TEXT,
    "orcamentosEncontrados" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Meta_familiaMembroId_fkey" FOREIGN KEY ("familiaMembroId") REFERENCES "FamiliaMembro" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Necessidade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "item" TEXT NOT NULL,
    "familiaMembroId" TEXT,
    "categoria" TEXT NOT NULL,
    "prioridade" TEXT NOT NULL DEFAULT 'MEDIA',
    "valorEstimado" REAL NOT NULL,
    "mesPlanejado" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANEJADA',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Necessidade_familiaMembroId_fkey" FOREIGN KEY ("familiaMembroId") REFERENCES "FamiliaMembro" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Divida" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "credor" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "valorOriginal" REAL NOT NULL,
    "valorAtual" REAL NOT NULL,
    "juros" REAL,
    "numeroParcelas" INTEGER,
    "valorParcela" REAL,
    "vencimento" DATETIME,
    "parcelasPagas" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'EM_DIA',
    "prioridade" TEXT NOT NULL DEFAULT 'MEDIA',
    "possibilidadeNegociacao" BOOLEAN NOT NULL DEFAULT false,
    "observacoes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
