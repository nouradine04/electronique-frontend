# Organisation des écrans

Commencer par le fichier `*Page.jsx` : il assemble les sections et montre les conditions d'affichage. Ouvrir ensuite le composant de la section à modifier. Les états et actions de l'écran sont dans son hook `use…`.

## Accueil public et inscription

Point d'entrée : `common/LandingPage.jsx`.

- `common/landing/useLandingPage.jsx` : navigation publique, thème/langue, étapes et soumission de l'inscription.
- `BenefitsSection`, `FeaturesSection`, `PricingSection`, `FaqSection`, `ContactSection` : contenu des sections.
- `RegistrationModal.jsx` : champs et affichage des étapes d'inscription.
- `translations.js` : textes français/arabe propres à cette page.
- `FaqItem.jsx` : ouverture/fermeture d'une réponse.
- `LandingStyles.jsx` : styles historiques intégrés, conservés pour ce découpage.
- Le hero et la navbar existants restent dans `components/LandingHero.tsx` et `components/LandingNavbar.tsx`.

## Tableau de bord gestionnaire

Point d'entrée : `manager/ManagerDashboardPage.jsx`.

- `manager/dashboard/useManagerDashboard.jsx` : lectures locales, calcul des indicateurs, données/options du graphique et état des alertes.
- `DashboardHeader`, `DashboardSummary`, `RevenueChart`, `RecentSales` : affichage des différentes sections.
- `StockAlertsModal.jsx` : liste des alertes et action de masquage.
- `LocalBackupPanel.jsx` : interface et actions d'export/restauration ; chiffrement et persistance restent dans `db/backup.js`.

## Caisse

Point d'entrée : `manager/PosPage.jsx`.

- `manager/pos/usePos.jsx` : recherche, état du panier par ID, client/paiement, validation et enregistrement atomique de la vente, création du reçu PDF.
- `ProductGrid.jsx` : recherche et produits paginés.
- `CartPanel.jsx` : panier ordinateur ; le panneau mobile reste visible dans le fichier principal.
- `PaymentModal.jsx` : choix du client, du paiement et des unités IMEI.
- `SaleReceipt.jsx` : confirmation de vente et bouton PDF.
- `constants.js` : couleur et présentation de la variante.

## Règles de maintenance

1. Les composants d'affichage reçoivent des props explicites ; ne pas y ajouter un deuxième moteur de synchronisation ou une nouvelle écriture de vente.
2. La validation finale, le stock, les unités et le journal restent ensemble dans le writer de caisse. Ne pas répartir cette transaction entre les composants.
3. Les services transversaux restent dans `src/services`, les modèles/requêtes WatermelonDB dans `src/db`, les composants réutilisables dans `src/components`.
4. Garder les styles publics dans `common/public-responsive.css` et `common/landing-flow.css`, ceux du dashboard dans `manager/recent-sales.css`, ceux de la caisse dans `manager/pos-products.css`.
5. Ne créer un composant que pour une section identifiable ; éviter les wrappers qui ne font que renvoyer un autre composant.

Ce découpage conserve les règles et le design existants. Il ne constitue pas une migration générale vers TypeScript ni une refonte de la synchronisation.
