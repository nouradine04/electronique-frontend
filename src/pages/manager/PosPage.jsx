import { usePos } from './pos/usePos';
import { ProductGrid } from './pos/ProductGrid';
import { CartPanel } from './pos/CartPanel';
import { PaymentModal } from './pos/PaymentModal';
import { SaleReceipt } from './pos/SaleReceipt';
import { variantLabel, BRAND } from './pos/constants';

import { Plus, Minus, ShoppingCart, X, Package } from 'lucide-react';

import { LocalImage } from '../../components/common/LocalImage.jsx';

import './pos-products.css';

export function PosPage({ setActiveTab }) {
  const {
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
  } = usePos({ setActiveTab });

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
      <ProductGrid
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filteredProducts={filteredProducts}
        productPage={productPage}
        addToCart={addToCart}
        cart={cart}
      />

      {/* ── Cart Panel (desktop) ── */}
      {!isMobile && (
        <CartPanel
          cart={cart}
          cartItems={cartItems}
          updateQty={updateQty}
          removeFromCart={removeFromCart}
          cartTotal={cartTotal}
          setShowPaymentModal={setShowPaymentModal}
        />
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

      {isMobile && showCartSheet && (
        <div className="pos-mobile-cart-overlay" onClick={event => event.target === event.currentTarget && setShowCartSheet(false)}>
          <section className="pos-mobile-cart" aria-label="Panier">
            <header>
              <div><ShoppingCart size={19} /><strong>Panier</strong></div>
              <button type="button" onClick={() => setShowCartSheet(false)} aria-label="Fermer"><X size={20} /></button>
            </header>
            <div className="pos-mobile-cart-items">
              {cartItems.map(item => <article key={item.productId}>
                <span className="pos-cart-photo"><LocalImage src={item.product.imageUrl || item.product.image_url} alt="" fallback={<Package size={18} />} /></span>
                <div><strong>{item.product.name}</strong><small>{variantLabel(item.product)}</small><b>{(item.product.price * item.quantity).toLocaleString('fr-FR')} FCFA</b></div>
                <div className="pos-mobile-quantity">
                  <button type="button" onClick={() => updateQty(item.productId, -1)}><Minus size={14} /></button>
                  <span>{item.quantity}</span>
                  <button type="button" onClick={() => updateQty(item.productId, 1)} disabled={item.quantity >= item.product.quantity}><Plus size={14} /></button>
                </div>
              </article>)}
            </div>
            <footer>
              <div><span>Total</span><strong>{cartTotal.toLocaleString('fr-FR')} FCFA</strong></div>
              <button type="button" className="btn btn-primary" onClick={() => { setShowCartSheet(false); setShowPaymentModal(true); }}>Encaisser</button>
            </footer>
          </section>
        </div>
      )}

      {/* ── Payment Modal ── */}
      {showPaymentModal && (
        <PaymentModal
          setShowPaymentModal={setShowPaymentModal}
          cartTotal={cartTotal}
          cartItems={cartItems}
          setCart={setCart}
          paymentMethods={paymentMethods}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          selectedClient={selectedClient}
          setSelectedClient={setSelectedClient}
          clientSearch={clientSearch}
          setClientSearch={setClientSearch}
          filteredClients={filteredClients}
          newClientName={newClientName}
          setNewClientName={setNewClientName}
          newClientPhone={newClientPhone}
          setNewClientPhone={setNewClientPhone}
          amountReceived={amountReceived}
          setAmountReceived={setAmountReceived}
          finalizeCheckout={finalizeCheckout}
          isCheckingOut={isCheckingOut}
        />
      )}

      {/* ── Invoice Display ── */}
      {invoiceData && (
        <SaleReceipt invoiceData={invoiceData} generatePDF={generatePDF} setInvoiceData={setInvoiceData} />
      )}
    </div>
  );
}
