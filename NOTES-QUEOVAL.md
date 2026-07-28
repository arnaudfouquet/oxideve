# Intégration Queoval → Calendrier Oxideve — Journal

## Objectif
Récupérer automatiquement le calendrier des sessions de formation (dates, ville,
places restantes) depuis Queoval/Applimetier et l'ajouter au calendrier public
d'Oxideve, via un bouton manuel dans l'admin (`/admin` → onglet Sessions).

---

## 2026-07-24 — État du jour

### Ce qui a été découvert sur l'API Queoval

Deux APIs distinctes existent :

1. **`api.applimetier.com/web.API.auth`** (celle documentée dans le fichier
   `infos api queoval`, token permanent) — API "OData-like" maison, sans schéma
   de colonnes documenté. Le tâtonnement par messages d'erreur SQL a permis de
   confirmer la structure du catalogue (`CATALOGUE/catalogues`,
   `CATALOGUE/formations/{code}` avec `Info_FOR`/`identFOR`) mais **pas**
   retrouvé les colonnes dates/ville/places des sessions malgré ~60 essais.
   Abandonnée au profit de la piste n°2.

2. **`applimetier.com/QueovalSiteWS1/api/...`** (API interne du front web
   Queoval, découverte via l'onglet Network du navigateur) — **celle utilisée
   au final**. Authentification par session web (Bearer token + header custom
   `qgmt` + cookies `.ASPXFORMSAUTH`/`ASP.NET_SessionId`), pas un token API
   permanent.

   Endpoint clé :
   `POST https://applimetier.com/QueovalSiteWS1/api/Pipe/Formation/Filtered/CARD_PAGINATION`

   Body :
   ```json
   {
     "column": {
       "columnSelector": [{"PropKey":"stg.Etat_PRO","PropValue":"2","PropOperator":1,"PropInWhere":true}],
       "pagination": {"step": 50, "stepOffset": 0, "getPagination": true}
     },
     "filterBadges": [],
     "columnDefinition": {
       "codeBo": "BO_STAGE", "codeProperty": "Etat_PRO",
       "tableName": "TDOProduction", "tablePrefix": "stg",
       "columnOrderBy": "DatedPRO asc", "columnFilterCode": "0",
       "columnFilterGroupe": "COLPIPESTAGE"
     }
   }
   ```

   Codes `Etat_PRO` confirmés : 2=Planifiée, 3=Confirmée, 5=Annulée,
   6=TEREVA intra confirmée, 7=Intra, 8=INTRA confirmée, 11=CFA CAMPUS 2024.
   On importe uniquement 2 et 3.

   Champs utiles par carte : `Ident` (id technique), `Titre`, `DateDebut`/
   `DateFin` ({Year,Month,Day}), `Etat`, `CpVille` ("66000, PERPIGNAN" ou null
   si à distance), `NbStagiaire`, `NumStage` (numéro métier affiché à l'écran,
   différent de `Ident`).

### Code écrit (poussé sur GitHub, branche main)

- **`prisma/schema.prisma`** : `Session` a gagné `source`, `externalId`
  (unique), `externalTitle`, `externalState`, `lastSyncedAt`. Nouveau modèle
  `PendingSyncSession` pour les stages Queoval qu'on n'arrive pas à rattacher
  automatiquement à une `Formation` existante.
- **`backend/services/queovalService.js`** (nouveau) : appelle
  CARD_PAGINATION pour les états 2 et 3, pagine automatiquement, fait un
  rapprochement de titre par similarité de mots-clés (seuil 0.5) contre les
  `Formation` existantes. En dessous du seuil → va dans
  `PendingSyncSession` au lieu d'être mal rattaché.
- **`backend/routes/api.js`** : 3 routes ajoutées —
  `POST /api/admin/queoval/sync`, `GET /api/admin/queoval/pending`,
  `POST /api/admin/queoval/pending/:id/resolve`.
- **`frontend/components/AdminWorkspace.tsx`** : dans l'onglet Sessions,
  bloc "Synchronisation du calendrier" avec bouton "Synchroniser Queoval" +
  liste des sessions en attente avec sélecteur de formation pour rattachement
  manuel.
- **`shared/types.ts`** : type `PendingSyncSession` ajouté.
- **`.env.example`** : documente `QUEOVAL_BEARER_TOKEN`, `QUEOVAL_QGMT_TOKEN`,
  `QUEOVAL_COOKIE`.
- **`.gitignore`** : ajout de `mot de passe client`, `infos api queoval`,
  `Ressources/` (fichiers sensibles à ne jamais committer, repo GitHub public).

Commits : `f9941dc` (fonctionnalité complète) puis `1b3e0dd` (fix : séquencer
les appels état 2/3 au lieu de parallèle + logger le corps de la réponse
d'erreur Queoval pour mieux diagnostiquer).

### Déploiement Infomaniak — ce qui a été fait

- Build relancé avec succès après avoir ajouté `--accept-data-loss` au flag
  `prisma db push` dans la commande de build Infomaniak (nécessaire car
  `externalId` unique sur une table qui a déjà des lignes — sans danger, la
  colonne était vide partout).
- `.env` du serveur (`/srv/customer/oxideve/.env`, via la console SSH web
  Infomaniak) mis à jour avec les 3 variables `QUEOVAL_*`, valeurs récupérées
  depuis l'onglet Network du navigateur (session web active, pas un token API
  permanent — **ces valeurs expirent** et devront être renouvelées à chaque
  fois qu'on veut synchroniser, ou remplacées par un vrai accès API si Queoval
  en propose un un jour).

### Bug en cours d'investigation (non résolu à la pause)

Le bouton "Synchroniser Queoval" renvoie une erreur 500 côté Queoval, de façon
**intermittente et sur des états différents à chaque essai** (tantôt état 2,
tantôt état 3) — ça pointe vers un problème de concurrence : les deux appels
(état 2 et état 3) partaient en parallèle avec la même session ASP.NET, ce que
Queoval n'apprécie peut-être pas.

**Correctif poussé mais PAS ENCORE TESTÉ** (commit `1b3e0dd`) :
- Les deux appels se font maintenant en séquence, pas en parallèle.
- L'erreur affichée inclut désormais le corps de la réponse HTTP de Queoval
  (au lieu de juste "statut 500"), ce qui donnera enfin le vrai message
  d'erreur au prochain test.

---

## 2026-07-28 — Changement d'architecture (résolution du 500/401 intermittent)

### Diagnostic final
Le fix "Accept-Language" (commit `47f04ba`) a bien réglé l'erreur "culture non
supportée", mais a révélé une 2e erreur derrière : `401 JWT is not well
formed` sur `QueovalSiteWS1`, reproductible même avec des cookies/tokens
tout juste copiés du navigateur, testé en `curl` **directement depuis le
serveur Infomaniak** (donc pas un problème Node/notre code). Hypothèse
retenue : cette API interne du front web Queoval (session-based) ne
supporte pas bien les appels serveur-à-serveur (WAF, IP datacenter, ou
validation stricte liée à la session navigateur) — non résolu et abandonné.

### Nouvelle architecture (commit `aed018f`)
Retour à l'API **`api.applimetier.com/web.API.auth`** (token permanent,
`infos api queoval` / trouvé aussi dans le KeePass) — celle qu'on avait
abandonnée vendredi faute d'avoir trouvé les bonnes colonnes. Avec de
**vrais idents de stage** (trouvés via `QueovalSiteWS1` avant qu'on
l'abandonne : 191738, 192274, 192282, 191364, 191729, 191831, 192376,
191375, 192532, 190902...), on a enfin percé :

- `GET /STAGE/sessions/{externalId}?select=Info_PRO,datedEVE,datefEVE,Etat_PRO`
  → fonctionne parfaitement, donne titre, dates de chaque créneau (4-6
  lignes par stage = matin/après-midi × jours), statut (`Etat_PRO`).
  Premier `datedEVE` = début du stage, dernier `datefEVE` = fin.
- `GET /STAGE/adresse/{externalId}?select=DenomADR,villeADR` → ville
  exacte confirmée sur 2 stages différents.
- Toujours pas de colonne "places restantes/capacité" trouvée sur cette
  API — `seatsLeft` est mis à 0 par défaut, à ajuster manuellement.
- Toujours impossible de lister mécaniquement les idents à venir depuis
  cette API (`STAGE/stages` liste bien les titres+Etat_PRO mais jamais un
  `ident` exploitable, même testé avec ~10 alias de table différents).
  **Décision : saisie manuelle des idents dans l'admin** plutôt que de
  continuer à chercher — le champ "Identifiants de stage" accepte une
  liste séparée par virgules/espaces, à copier depuis l'URL de la fiche
  stage Queoval (`stage-detail/{id}/vue360`).

### Ce qui a changé dans le code
- `.env` : remplacer les 3 variables `QUEOVAL_BEARER_TOKEN`/
  `QUEOVAL_QGMT_TOKEN`/`QUEOVAL_COOKIE` par une seule `QUEOVAL_API_TOKEN`
  (le token permanent du fichier `infos api queoval`/KeePass).
- `backend/services/queovalService.js` : entièrement réécrit pour appeler
  `api.applimetier.com/web.API.auth` par ident de stage plutôt que
  `QueovalSiteWS1` par état de pipeline.
- `POST /api/admin/queoval/sync` attend maintenant `{ externalIds: string[] }`
  dans le corps de la requête.
- `AdminWorkspace.tsx` : le bouton est remplacé par un champ de saisie des
  idents + bouton, dans l'onglet Sessions.

### ⚠️ Pas encore testé après ce changement
Ce commit n'a pas encore été déployé ni testé de bout en bout via le
bouton admin — seuls les appels `curl` individuels (`STAGE/sessions`,
`STAGE/adresse`) ont été validés en isolation.

---

## À faire au retour

1. **Mettre à jour le `.env` serveur** (`/srv/customer/oxideve/.env`, via
   console SSH web Infomaniak) : supprimer les 3 lignes `QUEOVAL_BEARER_TOKEN`/
   `QUEOVAL_QGMT_TOKEN`/`QUEOVAL_COOKIE`, les remplacer par une seule ligne :
   ```
   QUEOVAL_API_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjMzOTUiLCJEYk5hbWUiOiJPWElERVZFIiwiTW9kZSI6IjAiLCJQYXJ0ZW5haXJLZXkiOiIiLCJVc2VyTmFtZSI6Ik9YSURFVkU4NDkzMDIiLCJuYmYiOjE3NDQxMDM1NjgsImV4cCI6MTkwMTg2OTk2OCwiaWF0IjoxNzQ0MTAzNTY4fQ.z4CfibA8dCIlfVA4CALUEoG-fS6T6udByr6McN9iGwY
   ```
   (ce token est **permanent**, expire en 2030 — pas besoin de le renouveler
   à chaque session comme avant). Vérifier avec `cat .env` avant de
   redémarrer.
2. **Refaire un Build** sur Infomaniak (`git pull` récupérera le commit
   `aed018f`) puis redémarrer.
3. **Tester** : dans `/admin` → Sessions → coller quelques idents de stage
   connus dans le nouveau champ "Identifiants de stage" (ex:
   `191738, 192274, 192282, 191364, 191729`) → cliquer "Synchroniser Queoval".
   - Pour trouver d'autres idents à jour : ouvrir Queoval → "Gestion des
     stages" → cliquer sur un stage → lire l'URL, format
     `.../formations/stage-detail/{ID}/vue360`.
   - Si ça marche : vérifier les sessions créées dans le calendrier public
     et la liste "en attente de rattachement" pour les formations non
     reconnues automatiquement (seuil de similarité de titre = 0.5).
   - Si erreur : le message inclut maintenant le corps de la réponse Queoval
     pour diagnostiquer précisément.
4. **Limitation connue** : `seatsLeft` (places restantes) est mis à 0 par
   défaut pour toute session importée — aucune colonne "places/capacité" n'a
   été trouvée sur cette API après plusieurs dizaines d'essais. À ajuster
   manuellement dans l'admin après import, ou creuser plus tard si besoin.
5. **Sécurité** : les tokens `QueovalSiteWS1` (session web, abandonnés) et le
   token permanent ont été partagés en clair dans cette conversation — sans
   gravité immédiate ("site de test" confirmé), mais à garder en tête si ce
   compte Queoval donne accès à des données de production plus tard.
6. Amélioration possible plus tard : demander à Queoval/Applimetier si un
   endpoint de leur API permanente permet de lister mécaniquement les idents
   de stage à venir (aucun trouvé après recherche approfondie sur
   `STAGE/stages` avec de nombreux alias de table) — éliminerait la saisie
   manuelle.
