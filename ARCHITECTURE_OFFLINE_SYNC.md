# Architecture hors ligne et synchronisation

## État au 6 septembre 2026

Le socle web local est opérationnel sans PostgreSQL : catalogue téléphones avec saisie manuelle de secours, variantes de stock, livraisons, ventes, retours, dépenses et rentabilité. Les collections locales utilisent le schéma WatermelonDB version 7. Les retours et les dépenses portent aussi `synced = false` pour leur future synchronisation. Le socle mobile Expo existe maintenant avec WatermelonDB sur SQLite natif et un premier tableau de bord local.

Ce qui n'est pas encore livré : les écrans mobiles complets caisse/stock/retours, le stockage SQLite natif du client Tauri, la synchronisation cloud et le workflow complet d'échange contre un autre appareil.

## Décision locale

- Les écritures sont toujours effectuées d'abord dans WatermelonDB.
- L'interface ne bloque jamais une vente en attendant le réseau.
- Les images sont compressées en WebP avant d'être enregistrées avec le produit ou la boutique dans WatermelonDB.
- Aucun second stockage Dexie ou IndexedDB n'est utilisé directement par le code de l'application.

## Limite de la PWA

Sur le web, l'adaptateur officiel WatermelonDB est LokiJS. Il travaille en mémoire et utilise IndexedDB pour persister les données entre deux ouvertures. WatermelonDB ne remplace donc pas IndexedDB dans une PWA : il l'encapsule.

Pour une base SQLite locale indépendante du stockage du navigateur, l'application mobile utilisera Expo/React Native avec l'adaptateur SQLite de WatermelonDB. Cette cible demande une development build native ; Expo Go ne contient pas le module WatermelonDB.

Le projet Tauri actuel utilise lui aussi une WebView ; WatermelonDB ne fournit pas d'adaptateur SQLite officiel pour Tauri. La cible bureau devra donc recevoir soit un adaptateur WatermelonDB/Tauri validé, soit un dépôt SQLite natif derrière la même interface métier. Tant que ce travail n'est pas terminé, Tauri conserve le stockage web de la WebView et la sauvegarde chiffrée reste indispensable.

## Rôles et appareils

- Le rôle appartient au compte connecté, jamais au type d'appareil.
- Un gestionnaire peut utiliser le PC, la tablette ou le téléphone. Il vend, consulte son stock, ajoute un produit en attente de prix et traite un retour.
- L'administrateur peut utiliser les mêmes appareils. Il voit en plus les prix d'achat, la rentabilité, les dépenses, l'équipe et toutes ses boutiques autorisées par l'abonnement.
- Le plan Standard contient une boutique et jusqu'à deux gestionnaires. Le plan Multi-boutiques autorise jusqu'à cinq boutiques et l'administration centrale de leurs équipes.

## Produits, variantes et livraisons

- Le catalogue fournit le modèle et ses caractéristiques quand il est disponible.
- Chaque combinaison exacte de capacité, RAM, couleur et SIM devient une fiche de stock distincte avec son propre SKU.
- Un modèle absent du catalogue reste saisissable manuellement, y compris hors ligne.
- Chaque entrée de stock conserve la date, la quantité, le fournisseur, la référence de livraison et le coût d'achat.
- Une vente conserve une copie du coût unitaire au moment de la transaction afin qu'une modification future du prix d'achat ne réécrive pas l'ancienne marge.

## Retours et dépenses

- Un retour conserve la vente, le produit, la quantité, le motif, la solution, le remboursement et l'opérateur.
- Un article revendable peut revenir dans le stock ; un mouvement d'entrée est alors créé automatiquement.
- Le bénéfice net retire les remboursements, le coût des produits vendus et les dépenses, puis réintègre le coût des articles réellement remis en stock.
- Les dépenses couvrent notamment loyer, salaire, électricité, Internet, transport et achats divers. Une dépense mensuelle est marquée comme récurrente mais chaque paiement reste confirmé pour éviter les doublons.

## Flux cloud prévu

1. L'appareil écrit localement dans WatermelonDB.
2. Au retour de la connexion, l'application déclenche la synchronisation en arrière-plan.
3. Elle pousse d'abord les changements locaux vers l'API NestJS avec des identifiants idempotents.
4. Elle récupère ensuite les changements du serveur et les applique à WatermelonDB.
5. L'utilisateur continue à travailler pendant l'opération et ne lance aucune action manuelle.

Le backend ne peut pas ouvrir directement la base privée d'un navigateur ou d'un téléphone. Il reçoit les changements envoyés par l'application puis les conserve dans la base cloud.

Les entités à synchroniser sont : boutiques, comptes et droits, catégories, produits/variantes, clients, ventes, paiements, mouvements de stock, factures, retours et dépenses. Le serveur doit vérifier le compte, la boutique et le rôle sur chaque écriture.

## Fenêtre de sept jours

- Première connexion d'un appareil : récupérer l'état courant des boutiques, utilisateurs, clients, catégories et produits, puis l'historique des transactions des sept derniers jours.
- Reconnexion habituelle : récupérer tous les changements depuis la dernière synchronisation réussie, même si l'appareil est resté hors ligne plus de sept jours. Limiter systématiquement à sept jours ferait perdre des changements.

## Ordre de mise en place

1. **Terminé côté web local :** stabiliser WatermelonDB, les produits, les livraisons, les ventes, les retours et les dépenses.
2. **Terminé côté socle mobile :** créer la configuration Expo native, porter le schéma local sur SQLite WatermelonDB et afficher les métriques locales admin/gestionnaire.
3. **Étape suivante :** porter d'abord la connexion, le stock, la caisse et les ventes sur téléphone/tablette ; ajouter ensuite les écrans administrateur.
4. Rendre le stockage Tauri durable avec une couche SQLite native et des sauvegardes automatiques vérifiées.
5. Aligner le schéma PostgreSQL sur le schéma local, y compris retours, dépenses, coûts figés et droits par boutique.
6. Remplacer le prototype de synchronisation par un seul protocole `push/pull` idempotent avec isolation par compte et boutique.
7. Activer la synchronisation silencieuse et tester les conflits, les coupures pendant une vente, le changement d'appareil et la restauration.
8. Terminer l'échange : choisir l'appareil de remplacement, sortir son stock et calculer automatiquement la différence de prix.

## Protection contre la perte

- PWA : demander `navigator.storage.persist()`, afficher l'état de protection et proposer la sauvegarde chiffrée.
- Expo : SQLite se trouve dans l'espace privé de l'application ; une désinstallation ou la perte du téléphone supprime tout de même les données locales.
- Tauri : enregistrer la base et les sauvegardes dans le répertoire privé de l'application.
- Tous les appareils : la vraie protection reste la copie cloud confirmée. L'interface doit distinguer « enregistré sur l'appareil » et « sauvegardé sur le cloud ».
- Le chiffrement local sera ajouté avec une clé conservée dans Keychain/Keystore sur mobile et dans le coffre du système sur bureau. Il protège une copie de fichier, mais pas un appareil déjà déverrouillé et contrôlé par son utilisateur.
