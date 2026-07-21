/*
  Warnings:

  - You are about to drop the `ContaBancaria` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `contaBancariaId` on the `Cartao` table. All the data in the column will be lost.
  - You are about to drop the column `contaBancariaId` on the `ContaMes` table. All the data in the column will be lost.
  - You are about to drop the column `contaBancariaId` on the `Receita` table. All the data in the column will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ContaBancaria";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Cartao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "banco" TEXT,
    "limiteTotal" REAL NOT NULL,
    "diaFechamento" INTEGER NOT NULL,
    "diaVencimento" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Cartao" ("banco", "createdAt", "diaFechamento", "diaVencimento", "id", "limiteTotal", "nome") SELECT "banco", "createdAt", "diaFechamento", "diaVencimento", "id", "limiteTotal", "nome" FROM "Cartao";
DROP TABLE "Cartao";
ALTER TABLE "new_Cartao" RENAME TO "Cartao";
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_ContaMes" ("categoria", "createdAt", "dataPagamento", "formaPagamento", "id", "nome", "observacoes", "recorrenteMensal", "status", "subcategoria", "tipo", "valor", "vencimento") SELECT "categoria", "createdAt", "dataPagamento", "formaPagamento", "id", "nome", "observacoes", "recorrenteMensal", "status", "subcategoria", "tipo", "valor", "vencimento" FROM "ContaMes";
DROP TABLE "ContaMes";
ALTER TABLE "new_ContaMes" RENAME TO "ContaMes";
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Receita" ("categoria", "createdAt", "dataPrevista", "dataRecebimento", "id", "nome", "observacao", "recorrente", "status", "tipo", "valorPrevisto", "valorRecebido") SELECT "categoria", "createdAt", "dataPrevista", "dataRecebimento", "id", "nome", "observacao", "recorrente", "status", "tipo", "valorPrevisto", "valorRecebido" FROM "Receita";
DROP TABLE "Receita";
ALTER TABLE "new_Receita" RENAME TO "Receita";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
