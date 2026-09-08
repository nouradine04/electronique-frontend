import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useQuery } from '../../db/useQuery.js';
import { useShop } from '../../context/ShopContext.jsx';
import {
  queryProductsInStock,
  queryClients,
  createSale,
  createClient,
  createStockMovement,
  decrementProductStock,
  createPayment,
  database
} from '../../db/queries.js';
import {
  Search, Plus, Minus, Trash2, ShoppingCart,
  Banknote, Smartphone, CreditCard, User, Phone,
  Check, X, ChevronUp, FileText, Package
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const BRAND = '#0e6ba8';

export function PosPage({ setActiveTab }) {
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

  const filteredProducts = useMemo(() => {
    const q = (searchQuery || '').toLowerCase();
    return allProducts.filter(p => {
      if (String(p.status || '').toUpperCase() !== 'ACTIVE' || Number(p.price || 0) <= 0) return false;
      const n = (p.name || '').toLowerCase();
      const s = (p.sku || '').toLowerCase();
      return n.includes(q) || s.includes(q);
    });
  }, [allProducts, searchQuery]);

  const filteredClients = useMemo(() => {
    const q = (clientSearch || '').toLowerCase();
    if (!q) return [];
    return allClients.filter(c => {
      return (c.name || '').toLowerCase().includes(q) ||
             (c.phone || '').toLowerCase().includes(q);
    });
  }, [allClients, clientSearch]);

  const cartTotal = useMemo(() =>
    cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0),
    [cart]
  );

  const addToCart = useCallback((product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) return prev;
        return prev.map(i => i.product.id === product.id
          ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1 }];
    });
  }, []);

  const updateQty = useCallback((productId, delta) => {
    setCart(prev => prev
      .map(i => i.product.id === productId ? { ...i, quantity: i.quantity + delta } : i)
      .filter(i => i.quantity > 0)
    );
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCart(prev => prev.filter(i => i.product.id !== productId));
  }, []);

  const finalizeCheckout = async () => {
    if (cart.length === 0 || checkoutLock.current) return;
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
      await database.write(async () => {
        if (paymentMethod === 'credit' && !hasExistingClient && !hasNewClient) {
          throw new Error('Choisissez un client pour une vente à crédit.');
        }
        const received = Number(amountReceived);
        if (paymentMethod === 'credit' && (!Number.isFinite(received) || received < 0 || received > cartTotal)) {
          throw new Error('Le montant reçu doit être compris entre zéro et le total.');
        }
        // Validate the whole cart inside the writer before preparing mutations.
        for (const item of cart) {
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
        for (const item of cart) {
          operations.push(database.get('stock_movements').prepareCreate(m => {
            m.productId = item.product.id;
            m.shopId = currentShop.id;
            m.type = 'OUT';
            m.quantity = item.quantity;
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
        await database.batch(operations);
      });

      setInvoiceData({
        pendingSync: true,
        saleIds,
        clientName: finalClientName,
        clientPhone: finalClientPhone,
        items: [...cart],
        total: cartTotal,
        amountReceived: paymentMethod === 'credit' ? Number(amountReceived) : cartTotal,
        remainingDebt: paymentMethod === 'credit' ? cartTotal - Number(amountReceived) : 0,
        paymentMethod,
        date: new Date()
      });

      setCart([]);
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
        i.product.name,
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

  return (
    <div style={{ display: 'flex', height: 'calc(100dvh - 64px)', overflow: 'hidden', backgroundColor: 'var(--bg-main)' }}>
      <style>{`
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .pos-product-card { background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 12px; cursor: pointer; transition: all 0.2s; overflow: hidden; }
        .pos-product-card:hover { border-color: ${BRAND}; box-shadow: 0 4px 16px rgba(14,107,168,0.12); transform: translateY(-1px); }
        .pos-product-card:active { transform: scale(0.97); }
        .pos-cart-item { background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 10px; padding: 12px 16px; display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
        .qty-btn { width: 32px; height: 32px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-main); cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--text-primary); transition: all 0.15s; }
        .qty-btn:hover { background: var(--bg-sidebar-active); border-color: ${BRAND}; color: ${BRAND}; }
        .payment-method-btn { flex: 1; padding: 14px; border: 2px solid var(--border-color); border-radius: 12px; background: var(--bg-surface); cursor: pointer; text-align: center; transition: all 0.2s; }
        .payment-method-btn.selected { border-color: ${BRAND}; background: rgba(14,107,168,0.08); }
      `}</style>

      {/* ── Product Grid ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Search */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)' }}>
          <div style={{ position: 'relative', maxWidth: '480px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input-field"
              style={{ paddingLeft: '40px', height: '40px' }}
              placeholder="Rechercher un produit..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <Package size={48} style={{ marginBottom: '12px', opacity: 0.3 }} />
              <p>Aucun produit en stock</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
              {filteredProducts.map(product => (
                <div key={product.id} className="pos-product-card" onClick={() => addToCart(product)}>
                  <div style={{ padding: '16px' }}>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', marginBottom: '4px', lineHeight: 1.3 }}>
                      {product.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                      {product.sku || 'Sans SKU'}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 800, fontSize: '16px', color: BRAND }}>
                        {Number(product.price).toLocaleString('fr-FR')} <span style={{ fontSize: '11px', fontWeight: 600 }}>FCFA</span>
                      </div>
                      <div style={{
                        fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px',
                        backgroundColor: product.quantity <= product.minStock ? '#FEF2F2' : '#F0FDF4',
                        color: product.quantity <= product.minStock ? '#EF4444' : '#16A34A'
                      }}>
                        {product.quantity} restant{product.quantity > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <div style={{ height: '3px', backgroundColor: BRAND, opacity: 0.2 }} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Cart Panel (desktop) ── */}
      {!isMobile && (
        <div style={{ width: '340px', borderLeft: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingCart size={20} color={BRAND} />
            <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>Panier</span>
            {cart.length > 0 && (
              <span style={{ marginLeft: 'auto', background: BRAND, color: '#fff', borderRadius: '12px', padding: '2px 10px', fontSize: '13px', fontWeight: 700 }}>
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <ShoppingCart size={36} style={{ opacity: 0.2, marginBottom: '8px' }} />
                <p style={{ fontSize: '14px' }}>Cliquez sur un produit pour l'ajouter</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.product.id} className="pos-cart-item">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.product.name}
                    </div>
                    <div style={{ fontSize: '13px', color: BRAND, fontWeight: 700 }}>
                      {(item.product.price * item.quantity).toLocaleString('fr-FR')} FCFA
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button className="qty-btn" onClick={() => updateQty(item.product.id, -1)}><Minus size={14} /></button>
                    <span style={{ fontWeight: 700, minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                    <button className="qty-btn" onClick={() => updateQty(item.product.id, 1)} disabled={item.quantity >= item.product.quantity}><Plus size={14} /></button>
                    <button className="qty-btn" onClick={() => removeFromCart(item.product.id)} style={{ color: '#ef4444' }}><Trash2 size={14} /></button>
                  </div>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Total</span>
                <span style={{ fontWeight: 800, fontSize: '20px', color: BRAND }}>
                  {cartTotal.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
              <button
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: 700 }}
                onClick={() => setShowPaymentModal(true)}
              >
                Procéder au paiement
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Mobile Cart FAB ── */}
      {isMobile && cart.length > 0 && (
        <button
          onClick={() => setShowCartSheet(true)}
          style={{
            position: 'fixed', bottom: '24px', right: '24px', zIndex: 100,
            backgroundColor: BRAND, color: '#fff', border: 'none',
            borderRadius: '50px', padding: '16px 24px',
            display: 'flex', alignItems: 'center', gap: '10px',
            boxShadow: '0 8px 24px rgba(14,107,168,0.35)',
            fontWeight: 700, fontSize: '15px', cursor: 'pointer'
          }}
        >
          <ShoppingCart size={20} />
          {cart.reduce((s, i) => s + i.quantity, 0)} article{cart.length > 1 ? 's' : ''} —&nbsp;
          {cartTotal.toLocaleString('fr-FR')} FCFA
        </button>
      )}

      {/* ── Payment Modal ── */}
      {showPaymentModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: '16px' }}>
          <div style={{ background: 'var(--bg-surface)', borderRadius: '16px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontWeight: 800, fontSize: '20px', color: 'var(--text-primary)' }}>Paiement</h2>
              <button onClick={() => setShowPaymentModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={24} /></button>
            </div>

            {/* Total recap */}
            <div style={{ background: 'var(--bg-main)', borderRadius: '12px', padding: '16px', marginBottom: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Montant total</div>
              <div style={{ fontSize: '32px', fontWeight: 900, color: BRAND }}>{cartTotal.toLocaleString('fr-FR')} FCFA</div>
            </div>

            {/* Payment method */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '10px' }}>Mode de paiement</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {paymentMethods.map(pm => {
                  const Icon = pm.icon;
                  return (
                    <button
                      key={pm.id}
                      className={`payment-method-btn ${paymentMethod === pm.id ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod(pm.id)}
                    >
                      <Icon size={22} color={paymentMethod === pm.id ? BRAND : 'var(--text-muted)'} style={{ margin: '0 auto 6px' }} />
                      <div style={{ fontSize: '12px', fontWeight: 600, color: paymentMethod === pm.id ? BRAND : 'var(--text-secondary)' }}>{pm.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Client search */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
                <User size={14} style={{ display: 'inline', marginRight: '6px' }} />Client (optionnel)
              </label>
              {selectedClient ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-main)', padding: '10px 14px', borderRadius: '10px' }}>
                  <span style={{ flex: 1, fontWeight: 600 }}>{selectedClient.name}</span>
                  <button onClick={() => setSelectedClient(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={16} /></button>
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    className="input-field"
                    style={{ marginBottom: '8px' }}
                    placeholder="Rechercher un client existant..."
                    value={clientSearch}
                    onChange={e => setClientSearch(e.target.value)}
                  />
                  {filteredClients.length > 0 && (
                    <div style={{ border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden', marginBottom: '8px' }}>
                      {filteredClients.slice(0, 4).map(c => (
                        <button
                          key={c.id}
                          onClick={() => { setSelectedClient(c); setClientSearch(''); }}
                          style={{ width: '100%', padding: '10px 14px', border: 'none', background: 'var(--bg-surface)', cursor: 'pointer', textAlign: 'left', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '14px' }}
                        >
                          <User size={14} color="var(--text-muted)" />
                          <span>{c.name}</span>
                          {c.phone && <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>— {c.phone}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <input type="text" className="input-field" placeholder="Nouveau client (nom)" value={newClientName} onChange={e => setNewClientName(e.target.value)} />
                    <input type="tel" className="input-field" placeholder="Téléphone" value={newClientPhone} onChange={e => setNewClientPhone(e.target.value)} />
                  </div>
                </div>
              )}
            </div>

            {/* Credit partial */}
            {paymentMethod === 'credit' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Acompte reçu (FCFA)</label>
                <input type="number" className="input-field" placeholder="0" value={amountReceived} onChange={e => setAmountReceived(e.target.value)} />
                {amountReceived > 0 && (
                  <div style={{ marginTop: '8px', fontSize: '13px', color: '#f59e0b', fontWeight: 600 }}>
                    Reste à payer: {(cartTotal - Number(amountReceived)).toLocaleString('fr-FR')} FCFA
                  </div>
                )}
              </div>
            )}

            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '16px', fontSize: '16px', fontWeight: 800, borderRadius: '12px' }}
              onClick={finalizeCheckout}
              disabled={isCheckingOut}
            >
              <Check size={18} style={{ display: 'inline', marginRight: '8px' }} />
              Confirmer la vente
            </button>
          </div>
        </div>
      )}

      {/* ── Invoice Display ── */}
      {invoiceData && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 600, padding: '16px' }}>
          <div style={{ background: 'var(--bg-surface)', borderRadius: '16px', width: '100%', maxWidth: '420px', padding: '28px' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ width: '56px', height: '56px', background: '#D1FAE5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Check size={28} color="#10b981" />
              </div>
              <h2 style={{ margin: '0 0 4px', fontWeight: 800, color: 'var(--text-primary)' }}>Vente enregistrée !</h2>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '13px' }}>
                {invoiceData.pendingSync ? '⏳ Données sauvegardées localement, sync en attente' : '✅ Synchronisé'}
              </p>
            </div>

            <div style={{ background: 'var(--bg-main)', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
              {invoiceData.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                  <span>{item.product.name} x{item.quantity}</span>
                  <span style={{ fontWeight: 600 }}>{(item.product.price * item.quantity).toLocaleString('fr-FR')} FCFA</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '16px' }}>
                <span>Total</span>
                <span color={BRAND}>{invoiceData.total.toLocaleString('fr-FR')} FCFA</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={generatePDF}>
                <FileText size={16} style={{ display: 'inline', marginRight: '6px' }} />
                PDF
              </button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => setInvoiceData(null)}>
                Nouvelle vente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
