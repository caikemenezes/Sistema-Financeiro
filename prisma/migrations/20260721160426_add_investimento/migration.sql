-- CreateTable
CREATE TABLE "Investimento" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
