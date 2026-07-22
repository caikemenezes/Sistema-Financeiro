-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Necessidade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "item" TEXT NOT NULL,
    "familiaMembroId" TEXT,
    "categoria" TEXT NOT NULL,
    "prioridade" TEXT NOT NULL DEFAULT 'MEDIA',
    "valorEstimado" REAL NOT NULL,
    "valorGuardado" REAL NOT NULL DEFAULT 0,
    "mesPlanejado" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANEJADA',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Necessidade_familiaMembroId_fkey" FOREIGN KEY ("familiaMembroId") REFERENCES "FamiliaMembro" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Necessidade" ("categoria", "createdAt", "familiaMembroId", "id", "item", "mesPlanejado", "prioridade", "status", "valorEstimado") SELECT "categoria", "createdAt", "familiaMembroId", "id", "item", "mesPlanejado", "prioridade", "status", "valorEstimado" FROM "Necessidade";
DROP TABLE "Necessidade";
ALTER TABLE "new_Necessidade" RENAME TO "Necessidade";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
