-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_moniteurs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT,
    "telephone" TEXT,
    "specialite" TEXT,
    "dateEmbauche" DATETIME,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "utilisateurId" INTEGER,
    CONSTRAINT "moniteurs_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_moniteurs" ("actif", "createdAt", "dateEmbauche", "email", "id", "nom", "prenom", "specialite", "telephone", "updatedAt") SELECT "actif", "createdAt", "dateEmbauche", "email", "id", "nom", "prenom", "specialite", "telephone", "updatedAt" FROM "moniteurs";
DROP TABLE "moniteurs";
ALTER TABLE "new_moniteurs" RENAME TO "moniteurs";
CREATE UNIQUE INDEX "moniteurs_email_key" ON "moniteurs"("email");
CREATE UNIQUE INDEX "moniteurs_utilisateurId_key" ON "moniteurs"("utilisateurId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
