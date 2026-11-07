# Auto-Ecole COS

Application de bureau (Windows) de gestion d'auto-école : candidats, formations, planning des
leçons, examens, moniteurs, véhicules, paiements, factures, dépenses, caisse et administration.

**Stack :** Electron 41 · React 19 · Vite 8 · TypeScript · Tailwind 4 / shadcn · Zustand ·
Prisma 6 + SQLite.

## Démarrage

```bash
pnpm install
pnpm prisma:generate   # génère le client Prisma dans generated-prisma/
pnpm dev               # Vite + Electron
```

La base de développement est `prisma/dev.db`. Elle est créée et migrée automatiquement au
lancement. `pnpm db:seed` la vide puis insère les formations par défaut.

| Commande | Rôle |
| --- | --- |
| `pnpm dev` | Lance Vite et Electron en développement |
| `pnpm electron` | Lance Electron sur le build `dist/` |
| `pnpm build` | Vérifie les types et construit l'interface |
| `pnpm typecheck` / `pnpm lint` | Vérification des types / ESLint |
| `pnpm db:migrate` | Crée une nouvelle migration (`prisma migrate dev`) |
| `pnpm package:win` | Construit l'installeur Windows (`dist_electron/`) |

## Architecture

```
electron/
  main.cjs            amorce CommonJS : charge .env (dev), puis importe main.js
  main.js             fenêtre, démarrage, base de données, enregistrement des handlers
  preload.cjs         pont IPC (sandbox) exposé sous window.api
  ipc/security.js     authentification, rôles et limitation des tentatives pour chaque appel IPC
  ipc/handlers/*.js   handlers IPC par domaine (auth, candidats, paiements, ...)
  services/*.js       logique métier et accès Prisma
src/                  interface React (features/, store/, hooks/, components/)
prisma/               schéma, migrations, seed
```

### Sécurité des appels IPC

- Le preload joint le token d'accès à chaque appel. `electron/ipc/security.js` le valide
  (signature JWT et session active en base) avant d'exécuter le handler.
- L'identité de l'appelant est disponible dans `event.auth` (`userId`, `role`, `niveau`,
  `sessionId`). **Ne jamais lire l'identité dans le payload envoyé par l'interface.**
- Canaux publics (utilisables sans connexion) : `PUBLIC_CHANNELS`. Restrictions de rôle :
  `CHANNEL_ROLES`. Les deux listes sont dans `security.js`. Tout nouveau canal exige par défaut
  une session valide.
- Les mots de passe sont hachés avec scrypt et un sel. Les anciens hash SHA-256 sont convertis
  automatiquement lors de la connexion.

### Base de données et migrations

Au démarrage, `electron/services/migrations.js` applique les migrations manquantes de
`prisma/migrations/`. Il utilise la table `_prisma_migrations`, compatible avec Prisma. Une
installation neuve part d'une base vide. Une mise à jour applique les nouvelles migrations sur la
base existante, stockée dans `%APPDATA%/Auto-Ecole COS/database.db`.

Pour faire évoluer le schéma : modifier `prisma/schema.prisma`, lancer `pnpm db:migrate`, puis
commiter le dossier de migration généré.

## Secrets et installation

| Secret | Développement | Application installée |
| --- | --- | --- |
| Clés JWT | `JWT_SECRET`, `JWT_REFRESH_SECRET` dans `.env` | Générées au premier lancement dans `secrets.json` (userData), propres à chaque poste |
| Code d'installation | `AUTO_ECOLE_SETUP_CODE` dans `.env` (sinon `COS-DEV-SETUP-2026`) | Contenu de `build/setup-code.txt` au moment du packaging, ou variable `AUTO_ECOLE_SETUP_CODE` |

Le code d'installation permet de créer l'entreprise et le premier administrateur sur une base
vide (écran « Accès développeur »). Une fois qu'un administrateur existe, il n'a plus d'effet.

Avant `pnpm package:win`, créer `build/setup-code.txt` avec un code long et aléatoire. Ce fichier
est ignoré par git. Sans lui, l'application installée ne peut pas être initialisée.
