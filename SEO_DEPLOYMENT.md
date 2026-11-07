# SEO de NStock

Le build `npm run build` produit l’accueil en HTML avec les mêmes composants que
la version interactive, ses styles, son titre et sa description, son URL canonique,
les métadonnées de partage et les données structurées WebSite. Il produit aussi
`robots.txt`, `sitemap.xml`, les pages `/app/`, `/platform/` et une page 404 en noindex.
Aucun compte, stockage local ou session n’est utilisé pour le prérendu.

## Déploiement

- Domaine configuré par défaut : https://nstock.medaaris.com.
- Si le domaine change, définir `VITE_SITE_URL` au build (origine HTTPS sans chemin).
  Cet argument est aussi disponible dans le Dockerfile.
- Déployer avec `npm run build`, puis publier le dossier `dist` ou utiliser le Dockerfile.
- Nginx sert une vraie réponse 404 pour les chemins inconnus. Les pages app et platform
  disposent de leur propre fichier HTML pour ne pas reprendre les métadonnées indexables.
- Le sitemap contient uniquement l’accueil : les sections sont des ancres et les
  écrans privés ne doivent pas devenir des résultats de recherche.

## Google Search Console

1. Télécharger le fichier HTML de validation fourni par Google, sans le modifier.
2. Le placer dans `frontend/public/` avec son nom exact, puis redéployer.
   Vite le publie à la racine du domaine. Garder ce fichier dans le dépôt.
3. Ouvrir son URL publique pour confirmer qu’elle renvoie le contenu de Google,
   sans connexion ni redirection vers l’accueil. Cliquer ensuite sur « Valider ».
4. Dans « Sitemaps », envoyer `sitemap.xml`.
5. Inspecter `https://nstock.medaaris.com/`, tester l’URL publiée, puis demander l’indexation.
6. Suivre les impressions et clics pour NStock dans « Performances ».

La validation de propriété et la publication du sitemap ne garantissent ni
l’indexation ni la première position. La variante mal orthographiée « nstcok »
n’est pas ajoutée artificiellement au contenu. Ne pas utiliser robots.txt pour
protéger des données : l’authentification reste nécessaire.

## Vérification locale

`npm run test:seo` reconstruit et vérifie le contenu HTML sans JavaScript, les
ressources publiées, les directives noindex et les fichiers de découverte.
