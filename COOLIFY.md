# Frontend sur Coolify

Créer une application séparée pour le frontend depuis le dépôt Git :

- Build Pack : Dockerfile.
- Base Directory : `/frontend`.
- Dockerfile Location : `/Dockerfile` (relatif au dossier de base).
- Ports Exposes : `8080`.
- Domaine : le domaine HTTPS du site.

## Variables de compilation

Activer **Build Variable** dans Coolify pour ces variables, puis reconstruire :

```dotenv
VITE_BACKEND_URL=https://nstockbackend.assanediallo.com
VITE_ENABLE_CLOUD_SYNC=true
```

L'adresse du backend doit être publique et accessible depuis le navigateur des
clients, pas une adresse Docker interne. Ajouter le domaine du frontend dans
`CORS_ORIGINS` du backend.

Les variables optionnelles sont `VITE_GOOGLE_CLIENT_ID`, `VITE_ANDROID_APK_URL`,
`VITE_IOS_TESTFLIGHT_URL`, `VITE_MACOS_DOWNLOAD_URL`, `VITE_WINDOWS_DOWNLOAD_URL`
et `VITE_LINUX_DOWNLOAD_URL`. Les liens de téléchargement doivent pointer vers
des installateurs réellement disponibles.

Vite intègre ces valeurs dans les fichiers JavaScript : elles sont publiques.
Ne jamais mettre `DATABASE_URL`, un mot de passe ou `JWT_SECRET` dans le frontend.
Une modification des variables nécessite une nouvelle compilation ; changer
seulement l'environnement du conteneur déjà construit ne suffit pas.
Les fichiers `.env` locaux sont exclus du contexte Docker.

## Vérification locale

Depuis la racine du dépôt :

```sh
docker build --build-arg VITE_BACKEND_URL=https://votre-api.example -t nstock-frontend ./frontend
docker run --rm -p 3000:8080 nstock-frontend
```

Nginx sert les fichiers compilés sans privilèges root, avec compression,
routage de l'application et contrôle de santé sur `/health`. Le service worker
et la page HTML sont revalidés pour permettre les mises à jour. Utiliser HTTPS
en production pour les fonctionnalités PWA.
