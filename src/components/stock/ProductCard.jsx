import React from 'react';
import { Box, MapPin, Tag, ExternalLink, Plus, Minus, AlertTriangle, CheckCircle2 } from 'lucide-react';

export function ProductCard({ product, onStockAction, onEdit }) {
  const isLowStock = product.quantity <= product.min_stock;
  const isOutOfStock = product.quantity === 0;

  return (
    <div className="glass-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '14px' }}>
      <div>
        {/* Top Header: Category & Stock Status */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span className="sku-code">{product.sku}</span>
          
          {isOutOfStock ? (
            <span className="badge badge-danger">
              <AlertTriangle size={12} /> Épuisé (0)
            </span>
          ) : isLowStock ? (
            <span className="badge badge-warning">
              <AlertTriangle size={12} /> Stock Bas ({product.quantity})
            </span>
          ) : (
            <span className="badge badge-success">
              <CheckCircle2 size={12} /> En Stock ({product.quantity})
            </span>
          )}
        </div>

        {/* Product Name */}
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', marginBottom: '6px', lineHeight: 1.3 }}>
          {product.name}
        </h3>

        {/* Location & Description */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '8px' }}>
          <MapPin size={14} color="#818cf8" />
          <span>{product.location || 'Emplacement non défini'}</span>
        </div>

        {product.description && (
          <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {product.description}
          </p>
        )}
      </div>

      <div>
        {/* Pricing & Stock Details */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(15, 23, 42, 0.5)', padding: '10px 12px', borderRadius: '8px', marginBottom: '12px' }}>
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Prix unitaire</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#10b981' }}>
              {Number(product.price).toFixed(2)} FCFA
            </span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Seuil Alerte</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f59e0b' }}>
              &lt; {product.min_stock} pcs
            </span>
          </div>

          {product.datasheet_url && (
            <a
              href={product.datasheet_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{ padding: '6px 10px', fontSize: '0.75rem', gap: '4px' }}
              title="Ouvrir la fiche technique PDF"
            >
              <ExternalLink size={12} /> PDF
            </a>
          )}
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            className="btn btn-danger"
            onClick={() => onStockAction(product, 'OUT')}
            style={{ fontSize: '0.825rem', padding: '8px 10px' }}
          >
            <Minus size={14} /> Sortie (Retrait)
          </button>

          <button
            className="btn btn-success"
            onClick={() => onStockAction(product, 'IN')}
            style={{ fontSize: '0.825rem', padding: '8px 10px' }}
          >
            <Plus size={14} /> Entrée (Ajout)
          </button>
        </div>
      </div>
    </div>
  );
}
