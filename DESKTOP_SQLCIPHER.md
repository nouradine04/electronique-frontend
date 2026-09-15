# NStock Desktop — stockage local chiffré

La version desktop Tauri utilise une base SQLite chiffrée par SQLCipher dans le dossier de données privé de l'application. Un fichier distinct est créé pour chaque compte. Le coffre est ouvert après la connexion et fermé à la déconnexion ou à l'arrêt de l'application.

## Règles de conservation

- Une vente, un paiement ou un mouvement créé hors ligne reste local jusqu'à confirmation de sa synchronisation.
- La limite de 7 jours concerne uniquement le premier chargement de données depuis le serveur. Elle ne supprime jamais les données locales.
- Les suppressions sont représentées par `deleted_at`; aucune suppression physique n'est nécessaire pour la synchronisation.
- Les échanges avec le serveur sont paginés avec une limite maximale de 500 enregistrements.

## Base locale

`local_records` conserve les objets métier, leur boutique, leur état de synchronisation et leur date de mise à jour. Les index couvrent `(tenant_id, updated_at)` et `(tenant_id, sync_status, updated_at)`. `local_media` est prévu pour les images propres à une boutique. `sync_state` conserve les curseurs de synchronisation.

La clé SQLCipher n'est pas enregistrée dans le code ni dans le fichier de configuration. Elle est fournie à l'ouverture du coffre depuis la connexion utilisateur et effacée de la mémoire Rust immédiatement après l'appel SQLCipher.

## Développement et compilation

```bash
npm run tauri:dev
npm run tauri:build
```

Les installateurs produits se trouvent dans `src-tauri/target/release/bundle`. Le site choisit automatiquement le lien adapté grâce à `VITE_MACOS_DOWNLOAD_URL`, `VITE_WINDOWS_DOWNLOAD_URL` ou `VITE_LINUX_DOWNLOAD_URL`. Les chemins peuvent être relatifs au site, ce qui garde le téléchargement indépendant de Vercel, Cloudflare ou de tout autre hébergeur.

## Étape d'intégration suivante

Dans Tauri, WatermelonDB reste le modèle réactif en mémoire pour l'interface, sans persistance IndexedDB. Chaque changement est recopié dans SQLCipher. Après un redémarrage, l'utilisateur ouvre son coffre en se connectant et les données sont restaurées dans le modèle en mémoire. Le navigateur/PWA conserve son adaptateur WatermelonDB habituel.
