INSERT INTO "Familia" ("id", "nome", "createdAt")
VALUES ('familia-bootstrap-caike', 'Família de Caike', CURRENT_TIMESTAMP);

UPDATE "Usuario"       SET "familiaId" = 'familia-bootstrap-caike' WHERE "familiaId" IS NULL;
UPDATE "Receita"       SET "familiaId" = 'familia-bootstrap-caike' WHERE "familiaId" IS NULL;
UPDATE "ContaMes"      SET "familiaId" = 'familia-bootstrap-caike' WHERE "familiaId" IS NULL;
UPDATE "Meta"          SET "familiaId" = 'familia-bootstrap-caike' WHERE "familiaId" IS NULL;
UPDATE "Necessidade"   SET "familiaId" = 'familia-bootstrap-caike' WHERE "familiaId" IS NULL;
UPDATE "Divida"        SET "familiaId" = 'familia-bootstrap-caike' WHERE "familiaId" IS NULL;
UPDATE "Investimento"  SET "familiaId" = 'familia-bootstrap-caike' WHERE "familiaId" IS NULL;
UPDATE "FamiliaMembro" SET "familiaId" = 'familia-bootstrap-caike' WHERE "familiaId" IS NULL;
