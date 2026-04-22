# Oxideve

Application web complète pour un organisme de formation spécialisé en photovoltaïque, pompes à chaleur, IRVE et climatisation.

## Stack

- Frontend SSR/ISR: Next.js App Router + TypeScript
- Backend API: Express sur le même runtime Node.js
- Données: Prisma + PostgreSQL
- Déploiement: `node server.js` compatible Infomaniak

## Architecture

- `frontend/`: application Next.js, pages marketing, admin et SEO
- `backend/`: API Express, sécurité, validation et services
- `prisma/`: schéma PostgreSQL
- `shared/`: types et catalogue métier partagé
- `server.js`: serveur Node unique compatible Infomaniak

## Variables d'environnement

Créer un fichier `.env` avec au minimum:

```bash
PORT=3000
SITE_URL=https://oxideve.fr
DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/DATABASE
```

## Développement

```bash
npm install
npm run prisma:generate
npm run build
npm start
```

## Déploiement Infomaniak

Le script [deploy.sh](deploy.sh) met à jour le code, installe les dépendances, génère Prisma, rebuild l'application et relance le process Node.

Le workflow GitHub Actions [.github/workflows/deploy-infomaniak.yml](.github/workflows/deploy-infomaniak.yml) se connecte en SSH sur Infomaniak après chaque push sur `main`.

Secrets GitHub attendus:

- `INFOMANIAK_HOST`
- `INFOMANIAK_PORT`
- `INFOMANIAK_USERNAME`
- `INFOMANIAK_SSH_KEY`
- `INFOMANIAK_APP_PATH`
- `INFOMANIAK_RESTART_COMMAND` (optionnel)

## Endpoints

- `GET /health`
- `GET /api/formations`
- `GET /api/formations/:slug`
- `GET /api/sessions`
- `POST /api/inscription`