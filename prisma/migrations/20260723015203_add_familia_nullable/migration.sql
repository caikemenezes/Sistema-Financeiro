-- CreateTable
CREATE TABLE "Familia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ContaMes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "subcategoria" TEXT,
    "valor" REAL NOT NULL,
    "vencimento" DATETIME NOT NULL,
    "formaPagamento" TEXT,
    "contaBancaria" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'FIXA',
    "recorrenteMensal" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "dataPagamento" DATETIME,
    "observacoes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "familiaId" TEXT,
    CONSTRAINT "ContaMes_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "Familia" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ContaMes" ("categoria", "contaBancaria", "createdAt", "dataPagamento", "formaPagamento", "id", "nome", "observacoes", "recorrenteMensal", "status", "subcategoria", "tipo", "valor", "vencimento") SELECT "categoria", "contaBancaria", "createdAt", "dataPagamento", "formaPagamento", "id", "nome", "observacoes", "recorrenteMensal", "status", "subcategoria", "tipo", "valor", "vencimento" FROM "ContaMes";
DROP TABLE "ContaMes";
ALTER TABLE "new_ContaMes" RENAME TO "ContaMes";
CREATE TABLE "new_Divida" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "familiaId" TEXT,
    CONSTRAINT "Divida_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "Familia" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Divida" ("createdAt", "credor", "id", "juros", "nome", "numeroParcelas", "observacoes", "parcelasPagas", "possibilidadeNegociacao", "prioridade", "status", "tipo", "valorAtual", "valorOriginal", "valorParcela", "vencimento") SELECT "createdAt", "credor", "id", "juros", "nome", "numeroParcelas", "observacoes", "parcelasPagas", "possibilidadeNegociacao", "prioridade", "status", "tipo", "valorAtual", "valorOriginal", "valorParcela", "vencimento" FROM "Divida";
DROP TABLE "Divida";
ALTER TABLE "new_Divida" RENAME TO "Divida";
CREATE TABLE "new_FamiliaMembro" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "parentesco" TEXT NOT NULL,
    "dataNascimento" DATETIME,
    "observacoes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "familiaId" TEXT,
    CONSTRAINT "FamiliaMembro_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "Familia" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_FamiliaMembro" ("createdAt", "dataNascimento", "id", "nome", "observacoes", "parentesco") SELECT "createdAt", "dataNascimento", "id", "nome", "observacoes", "parentesco" FROM "FamiliaMembro";
DROP TABLE "FamiliaMembro";
ALTER TABLE "new_FamiliaMembro" RENAME TO "FamiliaMembro";
CREATE TABLE "new_Investimento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "objetivo" TEXT NOT NULL,
    "instituicao" TEXT,
    "tipo" TEXT,
    "valorAplicado" REAL NOT NULL,
    "valorAtual" REAL NOT NULL,
    "aporteMensal" REAL,
    "dataUltimoAporte" DATETIME,
    "prazo" DATETIME,
    "liquidez" TEXT,
    "rentabilidadeInformada" TEXT,
    "observacoes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "familiaId" TEXT,
    CONSTRAINT "Investimento_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "Familia" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Investimento" ("aporteMensal", "createdAt", "dataUltimoAporte", "id", "instituicao", "liquidez", "nome", "objetivo", "observacoes", "prazo", "rentabilidadeInformada", "tipo", "valorAplicado", "valorAtual") SELECT "aporteMensal", "createdAt", "dataUltimoAporte", "id", "instituicao", "liquidez", "nome", "objetivo", "observacoes", "prazo", "rentabilidadeInformada", "tipo", "valorAplicado", "valorAtual" FROM "Investimento";
DROP TABLE "Investimento";
ALTER TABLE "new_Investimento" RENAME TO "Investimento";
CREATE TABLE "new_Meta" (
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
    "familiaId" TEXT,
    CONSTRAINT "Meta_familiaMembroId_fkey" FOREIGN KEY ("familiaMembroId") REFERENCES "FamiliaMembro" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Meta_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "Familia" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Meta" ("categoria", "createdAt", "dataDesejada", "familiaMembroId", "id", "linksPesquisados", "nome", "observacoes", "orcamentosEncontrados", "prioridade", "status", "tipo", "valorEstimado", "valorGuardado") SELECT "categoria", "createdAt", "dataDesejada", "familiaMembroId", "id", "linksPesquisados", "nome", "observacoes", "orcamentosEncontrados", "prioridade", "status", "tipo", "valorEstimado", "valorGuardado" FROM "Meta";
DROP TABLE "Meta";
ALTER TABLE "new_Meta" RENAME TO "Meta";
CREATE TABLE "new_Necessidade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "item" TEXT NOT NULL,
    "familiaMembroId" TEXT,
    "pessoaNome" TEXT,
    "categoria" TEXT NOT NULL,
    "prioridade" TEXT NOT NULL DEFAULT 'MEDIA',
    "valorEstimado" REAL NOT NULL,
    "valorGuardado" REAL NOT NULL DEFAULT 0,
    "mesPlanejado" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANEJADA',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "familiaId" TEXT,
    CONSTRAINT "Necessidade_familiaMembroId_fkey" FOREIGN KEY ("familiaMembroId") REFERENCES "FamiliaMembro" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Necessidade_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "Familia" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Necessidade" ("categoria", "createdAt", "familiaMembroId", "id", "item", "mesPlanejado", "pessoaNome", "prioridade", "status", "valorEstimado", "valorGuardado") SELECT "categoria", "createdAt", "familiaMembroId", "id", "item", "mesPlanejado", "pessoaNome", "prioridade", "status", "valorEstimado", "valorGuardado" FROM "Necessidade";
DROP TABLE "Necessidade";
ALTER TABLE "new_Necessidade" RENAME TO "Necessidade";
CREATE TABLE "new_Receita" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "valorPrevisto" REAL NOT NULL,
    "valorRecebido" REAL,
    "dataPrevista" DATETIME NOT NULL,
    "dataRecebimento" DATETIME,
    "categoria" TEXT,
    "recorrente" BOOLEAN NOT NULL DEFAULT false,
    "contaBancaria" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PREVISTO',
    "observacao" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "familiaId" TEXT,
    CONSTRAINT "Receita_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "Familia" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Receita" ("categoria", "contaBancaria", "createdAt", "dataPrevista", "dataRecebimento", "id", "nome", "observacao", "recorrente", "status", "tipo", "valorPrevisto", "valorRecebido") SELECT "categoria", "contaBancaria", "createdAt", "dataPrevista", "dataRecebimento", "id", "nome", "observacao", "recorrente", "status", "tipo", "valorPrevisto", "valorRecebido" FROM "Receita";
DROP TABLE "Receita";
ALTER TABLE "new_Receita" RENAME TO "Receita";
CREATE TABLE "new_Usuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "familiaId" TEXT,
    CONSTRAINT "Usuario_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "Familia" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Usuario" ("createdAt", "email", "id", "nome", "senhaHash") SELECT "createdAt", "email", "id", "nome", "senhaHash" FROM "Usuario";
DROP TABLE "Usuario";
ALTER TABLE "new_Usuario" RENAME TO "Usuario";
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
