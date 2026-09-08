import React, { useState } from 'react';
import { Plus, Minus, ArrowRightLeft, X, Package } from 'lucide-react';
import { useShop } from '../../context/ShopContext.jsx';

export function StockMovementModal({ product, defaultType, onClose, onSubmit }) {
  const { userRole } = useShop();
  const [type, setType] = useState(defaultType || 'OUT'); // 'IN' | 'OUT'
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [deliveryReference, setDeliveryReference] = useState('');
  const [unitCost, setUnitCost] = useState(product.unit_cost || 0);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (quantity <= 0) {
      setError('La quantité doit être supérieure à 0.');
      return;
    }

    if (type === 'OUT' && quantity > product.quantity) {
      setError(`Stock disponible insuffisant (${product.quantity} disponibles en stock).`);
      return;
    }

    onSubmit({
      product_id: product.id,
      product_name: product.name,
      type,
      quantity: Number(quantity),
      reason: reason.trim() || (type === 'IN' ? 'Entrée de stock' : 'Sortie de stock'),
      supplier_name: type === 'IN' ? supplierName.trim() : '',
      delivery_reference: type === 'IN' ? deliveryReference.trim() : '',
      unit_cost: type === 'IN' && userRole === 'owner' ? Number(unitCost) : 0,
    });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
    }}>
      <div style={{ width: '100%', maxWidth: '460px', padding: '24px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              padding: '10px',
              borderRadius: '10px',
              background: type === 'IN' ? 'var(--success-bg)' : 'var(--danger-bg)',
              color: type === 'IN' ? 'var(--success)' : 'var(--danger)'
            }}>
              {type === 'IN' ? <Plus size={20} /> : <Minus size={20} />}
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {type === 'IN' ? 'Entrée en Stock' : 'Sortie de Stock'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                {product.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Current Stock info banner */}
        <div style={{
          background: 'var(--bg-main)', padding: '12px', borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px',
          border: '1px solid var(--border-color)'
        }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Stock actuel disponible :</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
            {product.quantity} pièces
          </span>
        </div>

        {error && (
          <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Movement Type Toggle */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
            <button
              type="button"
              className={`btn ${type === 'OUT' ? 'btn-danger' : 'btn-secondary'}`}
              onClick={() => setType('OUT')}
            >
              <Minus size={16} /> Sortie (Retrait)
            </button>
            <button
              type="button"
              className={`btn ${type === 'IN' ? 'btn-success' : 'btn-secondary'}`}
              onClick={() => setType('IN')}
            >
              <Plus size={16} /> Entrée (Réception)
            </button>
          </div>

          {/* Quantity Input */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Quantité à {type === 'IN' ? 'ajouter' : 'retirer'} :
            </label>
            <input
              type="number"
              min="1"
              max={type === 'OUT' ? product.quantity : 9999}
              className="input-field"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              required
              autoFocus
            />
          </div>

          {/* Reason Input */}
          {type === 'IN' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Fournisseur
                </label>
                <input type="text" className="input-field" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="Nom du fournisseur" />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Référence livraison
                </label>
                <input type="text" className="input-field" value={deliveryReference} onChange={(e) => setDeliveryReference(e.target.value)} placeholder="Ex : BL-2026-0042" />
              </div>
              {userRole === 'owner' && (
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Coût unitaire (FCFA)
                  </label>
                  <input type="number" min="0" className="input-field" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} />
                </div>
              )}
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Motif / Remarque (ex: Vente client, Projet, Réception AliExpress) :
            </label>
            <input
              type="text"
              className="input-field"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={type === 'IN' ? 'Arrivage commande #4821' : 'Vente comptoir boutique'}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className={type === 'IN' ? 'btn btn-success' : 'btn btn-danger'}>
              Valider le mouvement
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
