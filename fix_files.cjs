const fs = require('fs');

function applyColorReplacements(content) {
  let c = content;
  const repList = [
    [/['"]#(?:ffffff|fff)['"]/gi, "'var(--bg-surface)'"],
    [/['"]#(?:111827|1e293b|374151)['"]/gi, "'var(--text-primary)'"],
    [/['"]#(?:6b7280|6c757d)['"]/gi, "'var(--text-secondary)'"],
    [/['"]#(?:9ca3af|d1d5db)['"]/gi, "'var(--text-muted)'"],
    [/['"]#(?:f3f4f6|f9fafb|f8f9fa)['"]/gi, "'var(--bg-main)'"],
    [/['"](?:1px solid )?rgba\(0,\s*0,\s*0,\s*\.0[68]\)['"]/g, "'1px solid var(--border-color)'"],
    [/rgba\(0,\s*0,\s*0,\s*\.0[68]\)/g, "var(--border-color)"],
    [/['"]1px solid #(?:e5e7eb|f3f4f6|f9fafb|dee2e6|ced4da)['"]/gi, "'1px solid var(--border-color)'"],
    [/['"]2px solid #(?:e5e7eb|f3f4f6|f9fafb|dee2e6|ced4da)['"]/gi, "'2px solid var(--border-color)'"]
  ];
  repList.forEach(([reg, rep]) => {
    c = c.replace(reg, rep);
  });
  return c;
}

function processDashboard() {
  const p = './src/pages/admin/DashboardPage.jsx';
  let c = fs.readFileSync(p, 'utf8');
  
  c = applyColorReplacements(c);
  
  // Dashboard texts
  c = c.replace(/>Total Ventes</g, ">{t('dashboard.total_sales')}<");
  c = c.replace(/>Bénéfice Net</g, ">{t('dashboard.profit_net')}<");
  c = c.replace(/>Produits Actifs</g, ">{t('dashboard.active_products')}<");
  c = c.replace(/>Ruptures</g, ">{t('dashboard.out_of_stock')}<");
  c = c.replace(/vente\(s\)/g, "{t('dashboard.sales_count')}");
  c = c.replace(/marge/g, "{t('dashboard.margin')}");
  c = c.replace(/Voir détails →/g, "{t('dashboard.see_details')}");
  c = c.replace(/Ventes & Bénéfices \(7 jours\)/g, "{t('dashboard.sales_chart')}");
  c = c.replace(/CA/g, "{t('dashboard.ca')}");
  c = c.replace(/>Bénéfice</g, ">{t('dashboard.profit')}<");
  c = c.replace(/>Top Ventes</g, ">{t('dashboard.top_sales')}<");
  c = c.replace(/ vendus</g, " {t('dashboard.sold')}<");
  c = c.replace(/Aucune vente enregistrée\./g, "{t('dashboard.no_sales')}");
  c = c.replace(/Voir tout/g, "{t('dashboard.see_all')}");
  c = c.replace(/Alertes Stock/g, "{t('dashboard.alerts')}");
  c = c.replace(/RUPTURE/g, "{t('dashboard.rupture')}");
  c = c.replace(/Stock Restant/g, "{t('dashboard.remaining')}");
  c = c.replace(/Tout est en stock/g, "{t('dashboard.all_in_stock')}");
  c = c.replace(/Tous les produits vendus/g, "{t('dashboard.top_sales')}");
  
  fs.writeFileSync(p, c, 'utf8');
}

function processProfit() {
  const p = './src/pages/admin/ProfitPage.jsx';
  let c = fs.readFileSync(p, 'utf8');
  
  if (!c.includes("useTranslation")) {
    c = c.replace("import React", "import React;\nimport { useTranslation } from 'react-i18next';");
  }
  if (!c.includes("const { t } = useTranslation();")) {
    c = c.replace(/export default function ProfitPage\([^)]*\)\s*{/, "$&\n  const { t } = useTranslation();");
  }
  
  c = applyColorReplacements(c);
  
  c = c.replace(/>Rentabilité</g, ">{t('profit_page.title')}<");
  c = c.replace(/>Marges, bénéfices & historique par produit</g, ">{t('profit_page.subtitle')}<");
  c = c.replace(/>Ce Mois</g, ">{t('profit_page.this_month')}<");
  c = c.replace(/>Cette Année</g, ">{t('profit_page.this_year')}<");
  c = c.replace(/>Global</g, ">{t('profit_page.global')}<");
  c = c.replace(/>Chiffre d'Affaires</g, ">{t('profit_page.revenue')}<");
  c = c.replace(/>Bénéfice Net</g, ">{t('profit_page.net_profit')}<");
  c = c.replace(/>Investissement</g, ">{t('profit_page.investment')}<");
  c = c.replace(/>Produits Actifs</g, ">{t('profit_page.active_products')}<");
  c = c.replace(/>Tendances \(12 mois\)</g, ">{t('profit_page.trends')}<");
  c = c.replace(/placeholder="Rechercher un produit\.\.\."/g, "placeholder={t('profit_page.search_product')}");
  c = c.replace(/>Rentabilité par produit</g, ">{t('profit_page.per_product')}<");
  c = c.replace(/>Achat:</g, ">{t('profit_page.purchase')}:<");
  c = c.replace(/>Vente:</g, ">{t('profit_page.sale')}:<");
  // we do these carefully
  c = c.replace(/>Achat</g, ">{t('profit_page.purchase')}<");
  c = c.replace(/>Vente</g, ">{t('profit_page.sale')}<");
  c = c.replace(/>Marge</g, ">{t('profit_page.margin')}<");
  c = c.replace(/>Stock actuel</g, ">{t('profit_page.current_stock')}<");
  c = c.replace(/>Total vendu</g, ">{t('profit_page.total_sold')}<");
  c = c.replace(/>Historique des ventes</g, ">{t('profit_page.sales_history')}<");
  c = c.replace(/unité\(s\)/g, "{t('profit_page.units')}");
  c = c.replace(/>Espèces</g, ">{t('profit_page.cash')}<");
  c = c.replace(/>Mobile Money</g, ">{t('profit_page.mobile_money')}<");
  c = c.replace(/>Crédit</g, ">{t('profit_page.credit')}<");
  c = c.replace(/>Aucune vente pour ce produit\.</g, ">{t('profit_page.no_sales')}<");
  c = c.replace(/>Aucun produit avec prix et coût définis\.</g, ">{t('profit_page.no_data')}<");
  
  fs.writeFileSync(p, c, 'utf8');
}

function processCrm() {
  const p = './src/pages/admin/CrmPage.jsx';
  let c = fs.readFileSync(p, 'utf8');
  
  if (!c.includes("useTranslation")) {
    c = c.replace("import React", "import React;\nimport { useTranslation } from 'react-i18next';");
  }
  if (!c.includes("const { t } = useTranslation();")) {
    c = c.replace(/export default function CrmPage\([^)]*\)\s*{/, "$&\n  const { t } = useTranslation();");
  }
  
  c = applyColorReplacements(c);
  
  c = c.replace(/>Clients</g, ">{t('clients_page.title')}<"); // We will manually fix KPI if it breaks
  c = c.replace(/>Historique d'achats & crédits</g, ">{t('clients_page.subtitle')}<");
  c = c.replace(/>Avec crédit</g, ">{t('clients_page.with_credit_filter')}<");
  c = c.replace(/>Dette totale \(F\)</g, ">{t('clients_page.total_debt')} (F)<");
  c = c.replace(/>Tous</g, ">{t('clients_page.all')}<");
  c = c.replace(/placeholder="Rechercher un client\.\.\."/g, "placeholder={t('clients_page.search')}");
  c = c.replace(/>Aucun client trouvé\.</g, ">{t('clients_page.no_client')}<");
  c = c.replace(/ dépensé</g, " {t('clients_page.spent')}<");
  c = c.replace(/>Doit</g, ">{t('clients_page.owes')}<");
  c = c.replace(/ achat\(s\)</g, " {t('clients_page.purchases')}<");
  c = c.replace(/>Total Acheté</g, ">{t('clients_page.total_bought')}<");
  c = c.replace(/>Payé</g, ">{t('clients_page.paid')}<");
  c = c.replace(/>Reste à payer</g, ">{t('clients_page.remaining')}<");
  c = c.replace(/>Historique</g, ">{t('clients_page.history')}<");
  c = c.replace(/>Aucun achat\.</g, ">{t('clients_page.no_purchase')}<");
  c = c.replace(/>Non renseigné</g, ">{t('clients_page.phone_na')}<");
  c = c.replace(/>Produit</g, ">{t('clients_page.product')}<");
  c = c.replace(/>CRÉDIT</g, ">{t('profit_page.credit')}<");

  fs.writeFileSync(p, c, 'utf8');
}

processDashboard();
processProfit();
processCrm();
