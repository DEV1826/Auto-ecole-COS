-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "candidats" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT,
    "telephone" TEXT,
    "dateNaissance" DATETIME,
    "adresse" TEXT,
    "numeroPermis" TEXT,
    "categorie" TEXT NOT NULL DEFAULT 'B',
    "statut" TEXT NOT NULL DEFAULT 'EN_COURS',
    "dateInscription" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "formations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "prixTotal" REAL NOT NULL,
    "heuresCode" INTEGER NOT NULL DEFAULT 0,
    "heuresConduite" INTEGER NOT NULL DEFAULT 20,
    "categorie" TEXT NOT NULL DEFAULT 'B',
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "formation_candidats" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "candidatId" INTEGER NOT NULL,
    "formationId" INTEGER NOT NULL,
    "heuresCodeEffectuees" INTEGER NOT NULL DEFAULT 0,
    "heuresConduiteEffectuees" INTEGER NOT NULL DEFAULT 0,
    "montantTotal" REAL NOT NULL,
    "dateDebut" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateFin" DATETIME,
    CONSTRAINT "formation_candidats_candidatId_fkey" FOREIGN KEY ("candidatId") REFERENCES "candidats" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "formation_candidats_formationId_fkey" FOREIGN KEY ("formationId") REFERENCES "formations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "moniteurs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT,
    "telephone" TEXT,
    "specialite" TEXT,
    "dateEmbauche" DATETIME,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "vehicules" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "immatriculation" TEXT NOT NULL,
    "marque" TEXT NOT NULL,
    "modele" TEXT NOT NULL,
    "annee" INTEGER NOT NULL,
    "categorie" TEXT NOT NULL DEFAULT 'B',
    "kilometrage" INTEGER NOT NULL DEFAULT 0,
    "dateAcquisition" DATETIME,
    "dateDerniereRevision" DATETIME,
    "prochaineRevision" INTEGER,
    "statut" TEXT NOT NULL DEFAULT 'DISPONIBLE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "lecons" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "duree" INTEGER NOT NULL DEFAULT 60,
    "type" TEXT NOT NULL DEFAULT 'CONDUITE',
    "statut" TEXT NOT NULL DEFAULT 'PLANIFIEE',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "candidatId" INTEGER NOT NULL,
    "moniteurId" INTEGER NOT NULL,
    "vehiculeId" INTEGER,
    CONSTRAINT "lecons_candidatId_fkey" FOREIGN KEY ("candidatId") REFERENCES "candidats" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "lecons_moniteurId_fkey" FOREIGN KEY ("moniteurId") REFERENCES "moniteurs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "lecons_vehiculeId_fkey" FOREIGN KEY ("vehiculeId") REFERENCES "vehicules" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "examens" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "type" TEXT NOT NULL,
    "resultat" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    "note" REAL,
    "centre" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "candidatId" INTEGER NOT NULL,
    CONSTRAINT "examens_candidatId_fkey" FOREIGN KEY ("candidatId") REFERENCES "candidats" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "paiements" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "montant" REAL NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mode" TEXT NOT NULL DEFAULT 'ESPECES',
    "reference" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "candidatId" INTEGER NOT NULL,
    "factureId" INTEGER,
    CONSTRAINT "paiements_candidatId_fkey" FOREIGN KEY ("candidatId") REFERENCES "candidats" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "paiements_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "factures" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "depenses" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "categorie" TEXT NOT NULL,
    "montant" REAL NOT NULL,
    "description" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fournisseur" TEXT,
    "reference" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vehiculeId" INTEGER,
    CONSTRAINT "depenses_vehiculeId_fkey" FOREIGN KEY ("vehiculeId") REFERENCES "vehicules" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "caisse" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "montant" REAL NOT NULL,
    "solde" REAL NOT NULL,
    "description" TEXT,
    "reference" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "factures" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numero" TEXT NOT NULL,
    "montantTotal" REAL NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    "dateEmission" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateEcheance" DATETIME,
    "pdfPath" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "candidatId" INTEGER NOT NULL,
    CONSTRAINT "factures_candidatId_fkey" FOREIGN KEY ("candidatId") REFERENCES "candidats" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "entretiens" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "cout" REAL,
    "kilometre" INTEGER,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "prochainKm" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vehiculeId" INTEGER NOT NULL,
    CONSTRAINT "entretiens_vehiculeId_fkey" FOREIGN KEY ("vehiculeId") REFERENCES "vehicules" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_email_key" ON "utilisateurs"("email");

-- CreateIndex
CREATE UNIQUE INDEX "candidats_email_key" ON "candidats"("email");

-- CreateIndex
CREATE UNIQUE INDEX "candidats_numeroPermis_key" ON "candidats"("numeroPermis");

-- CreateIndex
CREATE UNIQUE INDEX "formation_candidats_candidatId_key" ON "formation_candidats"("candidatId");

-- CreateIndex
CREATE UNIQUE INDEX "moniteurs_email_key" ON "moniteurs"("email");

-- CreateIndex
CREATE UNIQUE INDEX "vehicules_immatriculation_key" ON "vehicules"("immatriculation");

-- CreateIndex
CREATE UNIQUE INDEX "factures_numero_key" ON "factures"("numero");
