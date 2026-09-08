import React, { useState } from 'react';
import { X, Cpu, MapPin, Tag, Euro, FileText } from 'lucide-react';

export function ProductFormModal({ product, categories, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    sku: product?.sku || '',
    category_id: product?.category_id || categories[0]?.id || '',
    quantity: product?.quantity ?? 10,
    min_stock: product?.min_stock ?? 5,
    price: product?.price ?? 1.50,
    unit_cost: product?.unit_cost ?? 0.70,
    location: product?.location || 'Boîte A, Tiroir 01',
    description: product?.description || '',
    datasheet_url: product?.datasheet_url || ''
  });

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...product,
      ...formData,
      sku: formData.sku.toUpperCase().trim()
    });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={20} color="#818cf8" />
            {product ? 'Modifier le Composant' : 'Nouveau Composant Électronique'}
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            
            {/* Name */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Nom du Composant / Matériel *
              </label>
              <input
                type="text"
                name="name"
                className="input-field"
                value={formData.name}
                onChange={handleChange}
                placeholder="ex: Transistor NPN 2N2222A"
                required
              />
            </div>

            {/* SKU */}
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Code Référence / SKU *
              </label>
              <input
                type="text"
                name="sku"
                className="input-field"
                value={formData.sku}
                onChange={handleChange}
                placeholder="ex: TRANS-2N2222-TO92"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Catégorie *
              </label>
              <select
                name="category_id"
                className="input-field"
                value={formData.category_id}
                onChange={handleChange}
                required
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id} style={{ background: '#1e293b' }}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Initial Quantity */}
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Quantité Initiale *
              </label>
              <input
                type="number"
                name="quantity"
                min="0"
                className="input-field"
                value={formData.quantity}
                onChange={handleChange}
                required
              />
            </div>

            {/* Min Stock Alert */}
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Seuil d'Alerte Stock Bas *
              </label>
              <input
                type="number"
                name="min_stock"
                min="1"
                className="input-field"
                value={formData.min_stock}
                onChange={handleChange}
                required
              />
            </div>

            {/* Unit Price */}
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Prix de Vente Unitaire (FCFA) *
              </label>
              <input
                type="number"
                step="0.01"
                name="price"
                min="0"
                className="input-field"
                value={formData.price}
                onChange={handleChange}
                required
              />
            </div>

            {/* Unit Cost */}
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Coût d'Achat Unitaire (FCFA)
              </label>
              <input
                type="number"
                step="0.01"
                name="unit_cost"
                min="0"
                className="input-field"
                value={formData.unit_cost}
                onChange={handleChange}
              />
            </div>

            {/* Drawer Location */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Emplacement physique (Tiroir / Casier / Étagère) *
              </label>
              <input
                type="text"
                name="location"
                className="input-field"
                value={formData.location}
                onChange={handleChange}
                placeholder="ex: Boîte B, Tiroir 04, Casier 12"
                required
              />
            </div>

            {/* Datasheet URL */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Lien Fiche Technique (PDF Datasheet)
              </label>
              <input
                type="url"
                name="datasheet_url"
                className="input-field"
                value={formData.datasheet_url}
                onChange={handleChange}
                placeholder="https://..."
              />
            </div>

            {/* Description */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Notes & Caractéristiques techniques
              </label>
              <textarea
                name="description"
                rows="2"
                className="input-field"
                value={formData.description}
                onChange={handleChange}
                placeholder="Tension max 50V, courant 800mA, boîtier TO-92..."
              />
            </div>

          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-primary">
              {product ? 'Enregistrer les modifications' : 'Ajouter au Stock'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
