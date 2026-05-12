-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'SECRETAIRE',
    "niveau" TEXT NOT NULL DEFAULT 'STANDARD',
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "creeParId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "utilisateurs_creeParId_fkey" FOREIGN KEY ("creeParId") REFERENCES "utilisateurs" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "utilisateurId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "refreshToken" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "dernierAcces" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sessions_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "utilisateurId" INTEGER NOT NULL,
    "ressource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "permissions_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "utilisateurId" INTEGER,
    "action" TEXT NOT NULL,
    "ressource" TEXT,
    "ressourceId" INTEGER,
    "description" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'SUCCESS',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs" ("id") ON DELETE SET NULL ON UPDATE CASCADE
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
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
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
    "prochaineRevisionKm" INTEGER,
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

-- CreateTable
CREATE TABLE "company_config" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "adresse" TEXT,
    "telephone" TEXT,
    "email" TEXT,
    "siteWeb" TEXT,
    "numeroFiscal" TEXT,
    "logoPath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "tarifs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "formationId" INTEGER NOT NULL,
    "prix" REAL NOT NULL,
    "dateDebut" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateFin" DATETIME,
    CONSTRAINT "tarifs_formationId_fkey" FOREIGN KEY ("formationId") REFERENCES "formations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "documents" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "candidatId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "nomFichier" TEXT NOT NULL,
    "chemin" TEXT NOT NULL,
    "taille" INTEGER,
    "mimeType" TEXT,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "documents_candidatId_fkey" FOREIGN KEY ("candidatId") REFERENCES "candidats" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_email_key" ON "utilisateurs"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_refreshToken_key" ON "sessions"("refreshToken");

-- CreateIndex
CREATE INDEX "sessions_utilisateurId_idx" ON "sessions"("utilisateurId");

-- CreateIndex
CREATE INDEX "sessions_token_idx" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "permissions_utilisateurId_idx" ON "permissions"("utilisateurId");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_utilisateurId_ressource_action_key" ON "permissions"("utilisateurId", "ressource", "action");

-- CreateIndex
CREATE INDEX "audit_logs_utilisateurId_idx" ON "audit_logs"("utilisateurId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

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
CREATE INDEX "lecons_date_idx" ON "lecons"("date");

-- CreateIndex
CREATE INDEX "lecons_candidatId_idx" ON "lecons"("candidatId");

-- CreateIndex
CREATE INDEX "lecons_moniteurId_idx" ON "lecons"("moniteurId");

-- CreateIndex
CREATE INDEX "examens_date_idx" ON "examens"("date");

-- CreateIndex
CREATE INDEX "examens_candidatId_idx" ON "examens"("candidatId");

-- CreateIndex
CREATE INDEX "paiements_candidatId_idx" ON "paiements"("candidatId");

-- CreateIndex
CREATE INDEX "paiements_date_idx" ON "paiements"("date");

-- CreateIndex
CREATE INDEX "depenses_date_idx" ON "depenses"("date");

-- CreateIndex
CREATE INDEX "depenses_categorie_idx" ON "depenses"("categorie");

-- CreateIndex
CREATE INDEX "caisse_date_idx" ON "caisse"("date");

-- CreateIndex
CREATE UNIQUE INDEX "factures_numero_key" ON "factures"("numero");

-- CreateIndex
CREATE INDEX "factures_candidatId_idx" ON "factures"("candidatId");

-- CreateIndex
CREATE INDEX "factures_statut_idx" ON "factures"("statut");

-- CreateIndex
CREATE INDEX "entretiens_vehiculeId_idx" ON "entretiens"("vehiculeId");

-- CreateIndex
CREATE INDEX "entretiens_date_idx" ON "entretiens"("date");

-- CreateIndex
CREATE UNIQUE INDEX "tarifs_formationId_dateDebut_key" ON "tarifs"("formationId", "dateDebut");

-- CreateIndex
CREATE INDEX "documents_candidatId_idx" ON "documents"("candidatId");
