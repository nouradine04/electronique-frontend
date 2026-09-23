# Fiabilité locale et synchronisation

## Comportement

Les mutations web attendent la sauvegarde WatermelonDB/Loki dans IndexedDB avant
leur résolution. La base existante est ouverte au démarrage : aucune remise à
zéro à chaque connexion. Le chemin Tauri/SQLCipher reste distinct.

Une notification locale de mutation regroupe les demandes de synchronisation
pendant 750 ms. Le verrou évite les exécutions simultanées dans cet onglet ; le
backoff existant temporise les erreurs. Les requêtes distantes à vide restent
limitées par la politique de rafraîchissement (5 minutes).

Les lignes rejetées sont conservées dans WatermelonDB. Leurs identifiants sont
mémorisés par tenant/boutique dans `nstock_sync_conflicts:*`. Les lots suivants
excluent ces identifiants et leurs références directes avant la limite de 500.
Le compteur total inclut toujours les données en attente. Une synchronisation
manuelle réessaie les conflits ; elle ne force jamais un écrasement serveur.

Les versions serveur sont persistées avant le passage à l'état synchronisé :
une interruption intermédiaire laisse une ligne en attente, rejouable.

## Tests

- `npm run test:sync` : sessions, copie distante, protection des éditions en
  cours, temporisation, registre des conflits.
- `node tests/persistence.browser.mjs` : nécessite Playwright et Google Chrome.
  Le module Playwright peut être indiqué via `NSTOCK_PLAYWRIGHT_MODULE`.
  Utilise un profil temporaire, un serveur local sur 3198 et une session simulée.
  Teste les vrais adaptateurs WatermelonDB/IndexedDB : création, fermeture
  complète, réouverture, création hors ligne, accusé partiel, dépendance bloquée,
  deuxième fermeture et vérification des statuts. Aucun compte réel n'est utilisé.

## À ne pas confondre

Le test de fermeture du navigateur ne simule pas une panne matérielle, une
suppression volontaire des données, une saturation disque ou les particularités
iOS. La copie distante et ses sauvegardes restent indispensables.
Les conflits de version sont isolés ; la résolution guidée, les opérations métier
atomiques entre plusieurs pages et la traçabilité IMEI restent à compléter.
Déployer le backend compatible avant le frontend ; aucun déploiement automatique
n'est effectué par ces modifications.

## Caisse : journal durable (schéma local 11)

Une vente, ses mouvements, ses produits, son éventuel client/acompte et son journal
sont préparés dans le même `database.batch`. Les tables locales `sync_operations`
et `sync_operation_links` empêchent le push générique d'envoyer séparément une
partie de cette vente. Aucun nouveau service de file d'attente n'est requis.

Après l'écriture : déclenchement différé de 750 ms, même pour une seule vente.
Après reconnexion : délai aléatoire de 0,5 à 5 secondes par appareil. Les erreurs
réseau utilisent un backoff exponentiel avec variation aléatoire ; une requête
bloquée expire après 30 secondes. Une passe traite jusqu'à 20 ventes complètes,
séquentiellement, une opération par requête. On n'attend jamais d'atteindre 500.

Une réponse perdue conserve le journal. Le même identifiant sera renvoyé. Les
versions sont enregistrées avant l'acquittement ; le journal n'est supprimé
qu'après celui-ci. Une édition locale plus récente n'est pas écrasée par l'accusé
d'une vente précédente. Une opération bloquée conserve ses liens ; les autres
opérations indépendantes continuent. La reprise manuelle réessaie les blocages.

`tests/checkout.browser.mjs` utilise un profil Chrome temporaire, WatermelonDB et
IndexedDB réels, avec un transport simulé : deux ventes hors ligne, protection
contre le push générique, réponse perdue, fermeture complète, réouverture, renvoi
du même ID, conservation du stock le plus récent et suppression des seuls journaux
confirmés. Les tests backend PGlite contrôlent séparément l'atomicité et les reçus.

Le miroir Tauri inclut les nouvelles tables, mais la validation native SQLCipher
et les essais iOS/Android restent à effectuer. Les anciennes ventes déjà en attente
ne sont pas converties artificiellement en opérations : pas de réécriture de leur
historique. La résolution guidée des conflits et le journal des retours restent à faire.

## Extension du 21 septembre 2026

Le journal couvre maintenant les mouvements `recordStockMovement`, les retours `processSaleReturn` et les stocks initiaux `createProduct`. Les paragraphes plus anciens qui indiquent que tous les retours restent à faire ne décrivent plus ces parcours.

Le schéma local 12 ajoute `product_units`, `unit_events` et `tracking_mode`. Les nouvelles unités reçues, vendues et retournées sont enregistrées avec les opérations correspondantes ; les tables sont incluses dans le miroir desktop. Le contrôle des IMEI et des identifiants dupliqués précède la réception. Une vente exige les unités sélectionnées ; un retour exige leur association à cette vente. Les accessoires restent en quantité.

Restent : tests métier et appareils, extraction photo/caméra, conversion des stocks historiques, résolution guidée des conflits, validation native/Expo et déploiement. La pagination du panneau d’appareils limite l’affichage à 20 unités, l’historique à 10 événements ; les événements complets restent pour l’instant synchronisés en arrière-plan, par pages.

## MVP : lecture photo et erreurs — 22 septembre 2026

- Lecture d’une photo/capture via Tesseract.js 6.0.1, exécutée dans un worker sur l’appareil. Aucun envoi de la photo à une API. Le moteur et le modèle anglais compact sont copiés depuis les dépendances verrouillées lors du build/dev, servis depuis `/ocr/v6/`, chargés à la demande et mis en cache par le service worker. Le démarrage de la boutique ne dépend pas du moteur OCR. La toute première lecture nécessite le réseau ; sans cache OCR disponible, un message invite à préparer cette fonction en ligne.
- Détection d’IMEI à 15 chiffres avec contrôle Luhn ; proposition de numéros de série sur les lignes S/N ou SERIAL. Pas de correction automatique de chiffres ambigus. Photo présentée et numéro confirmé avant ajout ; un seul IMEI principal choisi si plusieurs sont détectés. Contrôle des doublons inchangé. Caméra cadrée ou import de photo dans l’ajout et les réceptions. Taille d’image limitée, délai maximal, arrêt du worker et libération des images à la fermeture.
- La PWA conserve son shell précaché et sa session locale au démarrage hors ligne : pas de redirection réseau pour les utilisateurs déjà présents localement. La session autorise les écritures jusqu’à `offline_access_until`, pas seulement jusqu’à expiration de l’access token. Première connexion et session arrivée à échéance nécessitent Internet. Si le navigateur a effacé le stockage ou si l’installation/cache n’a jamais abouti, aucune promesse de démarrage hors ligne n’est possible.
- Page 404 pour chemins inconnus, page connexion indisponible lors d’un échec réseau sans session utilisable, et ErrorBoundary pour erreurs de rendu/lecture locale. Ces écrans ne vident aucun stockage. Les erreurs métier restent affichées dans leurs formulaires. Chemins d’assets absolus pour servir aussi les pages inconnues imbriquées.
- Aucune migration ni mise en production effectuée sur cette étape. Pas de campagne de tests de scénarios/appareils à la demande de l’utilisateur ; compilation et contrôle TypeScript uniquement. Le multi-boutique reste un changement de boutique active, sans transfert ajouté ni fusion des stocks.

## Vérifications avant push — 22 septembre 2026

À la demande de validation avant push : 9 tests frontend et 12 tests backend réussis ; build de production Vite/PWA et compilation NestJS réussis ; contrôle TypeScript ciblé du journal et du lecteur photo réussi. Le build frontend contient encore des avertissements de taille de bundles, sans erreur bloquante.

Le Dockerfile frontend copie maintenant `scripts/`, nécessaire à la génération des assets OCR au build. Inclure `scripts/ocr-assets.mjs`, les dépendances et le lockfile dans le push ; les fichiers OCR publics sont générés à partir des paquets verrouillés, pas à télécharger manuellement.

Déployer le backend et ses migrations avant le frontend. Configurer `VITE_BACKEND_URL` au build avec l'URL réelle de l'API ; autoriser l'origine frontend via `CORS_ORIGINS` côté backend au runtime. Aucun push ni déploiement de production exécuté par cette vérification. Les tests IMEI PostgreSQL embarqués ne remplacent pas un essai de concurrence multi-connexion ou un essai PWA hors ligne sur iPhone réel.
