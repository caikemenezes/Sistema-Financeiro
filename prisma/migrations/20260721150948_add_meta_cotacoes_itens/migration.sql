-- CreateTable
CREATE TABLE "MetaCotacao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "metaId" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "fornecedor" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "link" TEXT,
    "escolhida" BOOLEAN NOT NULL DEFAULT false,
    "observacao" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MetaCotacao_metaId_fkey" FOREIGN KEY ("metaId") REFERENCES "Meta" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MetaItemNecessario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "metaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "valorEstimado" REAL NOT NULL,
    "concluido" BOOLEAN NOT NULL DEFAULT false,
    "observacao" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MetaItemNecessario_metaId_fkey" FOREIGN KEY ("metaId") REFERENCES "Meta" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
