/**
 * Application des migrations Prisma au démarrage, sans CLI Prisma ni Python.
 *
 * - Lit `prisma/migrations/<nom>/migration.sql` dans l'ordre alphabétique.
 * - Utilise la table `_prisma_migrations` au même format que `prisma migrate deploy`,
 *   ce qui garde `prisma migrate dev` utilisable sur la même base en développement.
 * - Chaque migration est appliquée dans une transaction, clés étrangères désactivées
 *   (comme le fait Prisma pour SQLite), puis `PRAGMA foreign_key_check` est vérifié.
 * - Les bases créées avant cette version (sans table de suivi) sont « baselinées » :
 *   une migration dont toutes les tables existent déjà est marquée comme appliquée.
 *
 * @module electron/services/migrations
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const MIGRATIONS_TABLE_SQL = `CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id"                    TEXT PRIMARY KEY NOT NULL,
    "checksum"              TEXT NOT NULL,
    "finished_at"           DATETIME,
    "migration_name"        TEXT NOT NULL,
    "logs"                  TEXT,
    "rolled_back_at"        DATETIME,
    "started_at"            DATETIME NOT NULL DEFAULT current_timestamp,
    "applied_steps_count"   INTEGER UNSIGNED NOT NULL DEFAULT 0
)`;

/**
 * @param {string} migrationsDir
 * @returns {{ name: string, sql: string, checksum: string }[]}
 */
export function listMigrations(migrationsDir) {
  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Dossier des migrations introuvable : ${migrationsDir}`);
  }
  return fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .map((name) => {
      const file = path.join(migrationsDir, name, 'migration.sql');
      if (!fs.existsSync(file)) return null;
      const content = fs.readFileSync(file);
      return {
        name,
        sql: content.toString('utf8'),
        checksum: crypto.createHash('sha256').update(content).digest('hex'),
      };
    })
    .filter(Boolean);
}

function tableExists(db, name) {
  return Boolean(
    db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(name)
  );
}

function createdTables(sql) {
  return [...sql.matchAll(/CREATE TABLE\s+"([^"]+)"/gi)]
    .map((match) => match[1])
    .filter((name) => !name.startsWith('new_'));
}

function recordMigration(db, migration, startedAt) {
  db.prepare(
    `INSERT INTO "_prisma_migrations"
       (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
     VALUES (?, ?, ?, ?, NULL, NULL, ?, 1)`
  ).run(crypto.randomUUID(), migration.checksum, Date.now(), migration.name, startedAt);
}

/**
 * Applique les migrations manquantes sur la base SQLite (créée si absente).
 * @param {string} dbPath
 * @param {string} migrationsDir
 * @param {(message: string) => void} [log]
 * @returns {{ applied: string[], baselined: string[] }}
 */
export function applyMigrations(dbPath, migrationsDir, log = () => {}) {
  const migrations = listMigrations(migrationsDir);
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new DatabaseSync(dbPath, { enableForeignKeyConstraints: false });
  const applied = [];
  const baselined = [];

  try {
    const hadTrackingTable = tableExists(db, '_prisma_migrations');
    db.exec(MIGRATIONS_TABLE_SQL);

    const done = new Set(
      db
        .prepare(
          'SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL'
        )
        .all()
        .map((row) => row.migration_name)
    );

    const failed = db
      .prepare(
        'SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NULL AND rolled_back_at IS NULL'
      )
      .all();
    if (failed.length > 0) {
      throw new Error(
        `Migration(s) en échec dans la base : ${failed.map((r) => r.migration_name).join(', ')}`
      );
    }

    // Base créée par une ancienne version (copie de dev.db / script Python) : pas de suivi.
    if (!hadTrackingTable && done.size === 0) {
      for (const migration of migrations) {
        const tables = createdTables(migration.sql);
        if (tables.length > 0 && tables.every((t) => tableExists(db, t))) {
          recordMigration(db, migration, Date.now());
          done.add(migration.name);
          baselined.push(migration.name);
        } else {
          break;
        }
      }
    }

    for (const migration of migrations) {
      if (done.has(migration.name)) continue;

      const startedAt = Date.now();
      log(`Application de la migration ${migration.name}`);
      db.exec('BEGIN');
      try {
        db.exec(migration.sql);
        const violations = db.prepare('PRAGMA foreign_key_check').all();
        if (violations.length > 0) {
          throw new Error(
            `Violation de clés étrangères après ${migration.name} : ${JSON.stringify(violations.slice(0, 5))}`
          );
        }
        recordMigration(db, migration, startedAt);
        db.exec('COMMIT');
        applied.push(migration.name);
      } catch (error) {
        db.exec('ROLLBACK');
        throw new Error(`Échec de la migration ${migration.name} : ${error.message}`, {
          cause: error,
        });
      }
    }
  } finally {
    db.close();
  }

  return { applied, baselined };
}
