import { variantLabel } from './constants';

import { validateSelectedUnits, prepareUnitEvent, unitRaw } from '../../../services/productUnits';
import { prepareCheckoutOperation } from '../../../services/operationQueue';
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useQuery } from '../../../db/useQuery.js';
import { useShop } from '../../../context/ShopContext.jsx';
import { queryProductsInStock, queryClients, database } from '../../../db/queries.js';
import { Banknote, Smartphone, CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { usePagination } from '../../../components/ui/usePagination.js';
export function usePos({ setActiveTab }) {
  const { currentShop, userName, userRole } = useShop();
  const { t } = useTranslation();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  // POS State
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [showCartSheet, setShowCartSheet] = useState(false);

  const checkoutLock = useRef(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Checkout
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [amountReceived, setAmountReceived] = useState(0);

  // Invoice
  const [invoiceData, setInvoiceData] = useState(null);
  const [showInlineInvoice, setShowInlineInvoice] = useState(false);

  // WatermelonDB queries (réactifs, offline-first)
  const allProducts = useQuery(
    currentShop ? queryProductsInStock(currentShop.id) : null,
    [currentShop?.id]
  ) || [];

  const allClients = useQuery(
    currentShop ? queryClients(currentShop.id) : null,
    [currentShop?.id]
  ) || [];

  const productsById = useMemo(() => new Map(allProducts.map(product => [product.id, product])), [allProducts]);
  const cartItems = useMemo(() => cart
    .map(item => ({ ...item, product: productsById.get(item.productId) }))
    .filter(item => item.product), [cart, productsById]);

  const filteredProducts = useMemo(() => {
    const q = (searchQuery || '').toLowerCase();
    return allProducts.filter(p => {
      if (String(p.status || '').toUpperCase() !== 'ACTIVE' || Number(p.price || 0) <= 0) return false;
      const n = (p.name || '').toLowerCase();
      const s = (p.sku || '').toLowerCase();
      return `${n} ${s} ${variantLabel(p)}`.toLowerCase().includes(q);
    });
  }, [allProducts, searchQuery]);
  const productPage = usePagination(filteredProducts, `${currentShop?.id}:${searchQuery}`);

  const filteredClients = useMemo(() => {
    const q = (clientSearch || '').toLowerCase();
    if (!q) return [];
    return allClients.filter(c => {
      return (c.name || '').toLowerCase().includes(q) ||
             (c.phone || '').toLowerCase().includes(q);
    });
  }, [allClients, clientSearch]);

  const cartTotal = useMemo(() =>
    cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0),
    [cartItems]
  );

  const addToCart = useCallback((product) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) return prev;
        return prev.map(i => i.productId === product.id
          ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { productId: product.id, quantity: 1 }];
    });
  }, []);

  const updateQty = useCallback((productId, delta) => {
    setCart(prev => prev
      .map(i => i.productId === productId ? { ...i, quantity: i.quantity + delta, unitIds: (i.unitIds || []).slice(0, Math.max(0, i.quantity + delta)) } : i)
      .filter(i => i.quantity > 0)
    );
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCart(prev => prev.filter(i => i.productId !== productId));
  }, []);

  const finalizeCheckout = async () => {
    if (cartItems.length === 0 || checkoutLock.current) return;
    checkoutLock.current = true;
    setIsCheckingOut(true);

    const hasExistingClient = !!selectedClient;
    const hasNewClient = newClientName.trim().length > 0;

    try {
      let finalClientId = selectedClient?.id || null;
      let finalClientName = selectedClient?.name || newClientName;
      let finalClientPhone = selectedClient?.phone || newClientPhone;
      const now = new Date().toISOString();

      const saleIds = [];
      const selectedUnits = new Map();
      const trackedCount = cartItems.filter(item => item.product.trackingMode !== 'QUANTITY').reduce((n, item) => n + item.quantity, 0);
      if (cartItems.length > 100 || 4 * cartItems.length + 2 * trackedCount + 2 > 500) throw new Error('Ce panier est trop volumineux. Répartissez-le en plusieurs ventes.');
      await database.write(async () => {
        if (paymentMethod === 'credit' && !hasExistingClient && !hasNewClient) {
          throw new Error('Choisissez un client pour une vente à crédit.');
        }
        const received = Number(amountReceived);
        if (paymentMethod === 'credit' && (!Number.isFinite(received) || received < 0 || received > cartTotal)) {
          throw new Error('Le montant reçu doit être compris entre zéro et le total.');
        }
        if (cartItems.some(item => item.product.trackingMode !== 'QUANTITY') && (!finalClientName?.trim() || !finalClientPhone?.trim())) throw new Error('Le nom et le téléphone du client sont nécessaires pour tracer les appareils.');
        // Validate the whole cart inside the writer before preparing mutations.
        for (const item of cartItems) {
          selectedUnits.set(item.productId, await validateSelectedUnits(database, item.product, item.unitIds || [], item.quantity));
          if (!Number.isInteger(item.quantity) || item.quantity <= 0 || item.quantity > item.product.quantity) {
            throw new Error(`Stock insuffisant pour ${item.product.name}.`);
          }
          if (item.product.shopId !== currentShop.id || !Number.isFinite(item.product.price) || item.product.price <= 0 || item.product.status === 'PENDING_PRICE') {
            throw new Error(`Définissez un prix valide pour ${item.product.name} avant la vente.`);
          }
        }
        const operations = [];
        if (!hasExistingClient && hasNewClient) {
          const newClient = database.get('clients').prepareCreate(c => {
            c.shopId = currentShop.id;
            c.name = newClientName.trim();
            c.phone = newClientPhone;
            c.email = '';
            c.synced = false;
          });
          operations.push(newClient);
          finalClientId = newClient.id;
        }
        for (const item of cartItems) {
          operations.push(database.get('stock_movements').prepareCreate(m => {
            m.productId = item.product.id;
            m.shopId = currentShop.id;
            m.type = 'OUT';
            m.quantity = item.quantity;
            m.reason = 'Vente client';
            m.userName = userName || 'Utilisateur';
            m.date = now;
            m.synced = false;
          }));
          operations.push(item.product.prepareUpdate(p => {
            p.quantity -= item.quantity;
            p.synced = false;
          }));
          const sale = database.get('sales').prepareCreate(s => {
            s.shopId = currentShop.id;
            s.productId = item.product.id;
            s.clientId = finalClientId || '';
            s.paymentMethod = paymentMethod;
            s.date = now;
            s.quantity = item.quantity;
            s.totalPrice = item.product.price * item.quantity;
            s.sellerName = userName || 'Utilisateur';
            s.sellerRole = userRole || 'manager';
            s.unitCost = item.product.unitCost || 0;
            s.returnedQuantity = 0;
            s.refundedAmount = 0;
            s.synced = false;
          });
          operations.push(sale);
          for (const unit of selectedUnits.get(item.productId) || []) {
            operations.push(unit.prepareUpdate(record => { record._setRaw('state', 'SOLD'); record._setRaw('synced', false); }));
            operations.push(prepareUnitEvent(database, { shop_id: currentShop.id, product_id: item.product.id, unit_id: unit.id, kind: 'SOLD', sale_id: sale.id, client_id: finalClientId, client_name: finalClientName, client_phone: finalClientPhone, amount: item.product.price, date: now }));
          }
          saleIds.push(sale.id);
        }
        // One deposit per checkout, regardless of the number of products.
        if (paymentMethod === 'credit' && received > 0 && finalClientId) {
          operations.push(database.get('payments').prepareCreate(p => {
            p.shopId = currentShop.id;
            p.clientId = finalClientId;
            p.amount = received;
            p.date = now;
            p.synced = false;
          }));
        }
        const journal = await prepareCheckoutOperation(database, currentShop.id, operations);
        await database.batch(...operations, ...journal);
      });

      setInvoiceData({
        pendingSync: true,
        saleIds,
        clientName: finalClientName,
        clientPhone: finalClientPhone,
        items: cartItems.map(item => ({ ...item, identifiers: (selectedUnits.get(item.productId) || []).map(unit => unitRaw(unit).identifier) })),
        total: cartTotal,
        amountReceived: paymentMethod === 'credit' ? Number(amountReceived) : cartTotal,
        remainingDebt: paymentMethod === 'credit' ? cartTotal - Number(amountReceived) : 0,
        paymentMethod,
        date: new Date()
      });

      setCart([]);
      setShowCartSheet(false);
      setShowPaymentModal(false);
      setShowInlineInvoice(false);

    } catch (err) {
      console.error(err);
      alert('Erreur lors de la vente: ' + err.message);
    } finally {
      checkoutLock.current = false;
      setIsCheckingOut(false);
    }
  };

  const generatePDF = async () => {
    if (!invoiceData) return;
    const { default: jsPDF } = await import('jspdf');
    await import('jspdf-autotable');
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(currentShop?.name || 'Boutique', 14, 20);
    doc.setFontSize(10);
    doc.text(`Date: ${invoiceData.date.toLocaleDateString('fr-FR')}`, 14, 50);
    doc.text(`Client: ${invoiceData.clientName || 'Anonyme'}`, 14, 56);
    doc.autoTable({
      startY: 65,
      head: [['Produit', 'Qté', 'PU', 'Total']],
      body: invoiceData.items.map(i => [
        [i.product.name, ...(i.identifiers || [])].join('\n'),
        i.quantity,
        `${i.product.price} FCFA`,
        `${i.product.price * i.quantity} FCFA`
      ])
    });
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(13);
    doc.text(`Total: ${invoiceData.total} FCFA`, 14, finalY);
    doc.save(`facture_${Date.now()}.pdf`);
  };

  if (!currentShop) {
    return <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
      Sélectionnez une boutique pour commencer.
    </div>;
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  const paymentMethods = [
    { id: 'cash', label: 'Espèces', icon: Banknote, color: '#10b981' },
    { id: 'mobile_money', label: 'Mobile Money', icon: Smartphone, color: '#6366f1' },
    { id: 'credit', label: 'Crédit', icon: CreditCard, color: '#f59e0b' }
  ];

  
  return {
    searchQuery,
    setSearchQuery,
    filteredProducts,
    productPage,
    addToCart,
    cart,
    isMobile,
    cartItems,
    updateQty,
    removeFromCart,
    cartTotal,
    setShowPaymentModal,
    setShowCartSheet,
    showCartSheet,
    showPaymentModal,
    setCart,
    paymentMethods,
    paymentMethod,
    setPaymentMethod,
    selectedClient,
    setSelectedClient,
    clientSearch,
    setClientSearch,
    filteredClients,
    newClientName,
    setNewClientName,
    newClientPhone,
    setNewClientPhone,
    amountReceived,
    setAmountReceived,
    finalizeCheckout,
    isCheckingOut,
    invoiceData,
    generatePDF,
    setInvoiceData,
  };
}
