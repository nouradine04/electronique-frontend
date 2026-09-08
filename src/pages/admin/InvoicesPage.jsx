import React, { useState } from 'react';
import { useQuery } from '../../db/useQuery.js';
import { queryProducts, queryCategories, querySales, queryClients, queryPayments, queryStockMovements, queryInvoices, database } from '../../db/queries.js';
import { useShop } from '../../context/ShopContext.jsx';
import { 
  Search, FileText, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Calendar, CircleDollarSign, Building2, MapPin
} from 'lucide-react';

export function InvoicesPage() {
  const { currentShop, userRole } = useShop();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  
  // Modal state
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const invoices = useQuery(queryInvoices(currentShop?.id || '')) || [];

  // Seed mock invoices if empty
  React.useEffect(() => {
    const seedMockInvoices = async () => {
      if (!currentShop?.id) return;
      if (invoices.length === 0) {
        const mockData = [
          { shop_id: currentShop.id, client_name: 'Electro Corp', client_id: 'ICE : 002345678000013', date_emission: '2024-06-15T10:00:00Z', date_echeance: '2024-06-30T10:00:00Z', amount: 72969.60, status: 'Payée', items_json: JSON.stringify([{name: 'TV Samsung', price: 72969.6, quantity: 1}]) },
          { shop_id: currentShop.id, client_name: 'TechLog Maroc', client_id: 'ICE : 001234567000012', date_emission: '2024-06-14T10:00:00Z', date_echeance: '2024-06-29T10:00:00Z', amount: 53780.00, status: 'En attente', items_json: JSON.stringify([{name: 'Laptop Dell', price: 53780, quantity: 1}]) },
          { shop_id: currentShop.id, client_name: 'Nordic Distribution', client_id: 'ICE : 001876543000018', date_emission: '2024-06-13T10:00:00Z', date_echeance: '2024-06-28T10:00:00Z', amount: 38400.00, status: 'En retard', items_json: JSON.stringify([{name: 'Routeur Cisco', price: 38400, quantity: 1}]) },
          { shop_id: currentShop.id, client_name: 'Atlas Supply Chain', client_id: 'ICE : 002987654000015', date_emission: '2024-06-12T10:00:00Z', date_echeance: '2024-06-27T10:00:00Z', amount: 46120.00, status: 'Payée', items_json: JSON.stringify([{name: 'Cables RJ45', price: 46120, quantity: 1}]) },
        ];
        for (const item of mockData) {
          await createInvoice(item);
        }
      }
    };
    if (currentShop) seedMockInvoices();
  }, [currentShop?.id]);

  const filteredInvoices = invoices.filter(inv => {
    const q = String(searchQuery || '').toLowerCase();
    const idStr = String(inv.id || '').toLowerCase();
    const clientStr = String(inv.client_name || '').toLowerCase();
    const matchesSearch = idStr.includes(q) || clientStr.includes(q);
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredInvoices.length / rowsPerPage) || 1;
  const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const getBadgeStyle = (status) => {
    switch (status) {
      case 'Payée': return { bg: '#e0e7ff', text: '#4338ca' }; // Soft Indigo (matching image "Planifié")
      case 'En attente': return { bg: '#fef3c7', text: '#b45309' };
      case 'En retard': return { bg: '#fee2e2', text: '#b91c1c' };
      default: return { bg: '#f1f5f9', text: '#475569' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '32px', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#111827', margin: '0 0 4px 0' }}>Transactions</h2>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
          Supervisez l'historique de vos factures de vente.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="input-field"
            style={{ paddingLeft: '40px', height: '44px', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.875rem', width: '100%' }}
            placeholder="Rechercher une facture..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          />
        </div>

        <div>
          <select
            className="input-field"
            style={{ height: '44px', width: '160px', cursor: 'pointer', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.875rem', color: '#374151' }}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="ALL">Tous les statuts</option>
            <option value="Payée">Payée</option>
            <option value="En attente">En attente</option>
            <option value="En retard">En retard</option>
          </select>
        </div>
      </div>

      {/* Transactions List (Minimalist Cards) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {paginatedInvoices.length === 0 ? (
          <div style={{ padding: '64px 24px', textAlign: 'center', color: '#9ca3af', border: '1px solid #e5e7eb', borderRadius: '12px', backgroundColor: '#fff' }}>
            <FileText size={32} style={{ opacity: 0.5, margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '1rem', color: '#4b5563', fontWeight: 500, margin: '0 0 4px 0' }}>Aucune transaction</h3>
            <p style={{ fontSize: '0.875rem', margin: 0 }}>Vérifiez vos filtres de recherche.</p>
          </div>
        ) : (
          paginatedInvoices.map(inv => {
            const badge = getBadgeStyle(inv.status);
            return (
              <div 
                key={inv.id} 
                onClick={() => setSelectedInvoice(inv)}
                style={{ 
                  display: 'flex', 
                  gap: '16px', 
                  padding: '16px', 
                  borderRadius: '12px', 
                  backgroundColor: '#ffffff',
                  border: '1px solid #f3f4f6', 
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                  alignItems: 'flex-start'
                }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = '#f3f4f6'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)'; }}
              >
                {/* Left Icon Box (Flat Grey) */}
                <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileText size={20} color="#4b5563" />
                </div>

                {/* Right Content */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
                  
                  {/* Top Row: Title and Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {inv.client_name}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>
                        {inv.id}
                      </div>
                    </div>
                    <div style={{ 
                      padding: '4px 8px', 
                      borderRadius: '6px', 
                      backgroundColor: badge.bg, 
                      color: badge.text, 
                      fontSize: '0.75rem', 
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}>
                      {inv.status}
                    </div>
                  </div>
                  
                  {/* Bottom Rows: Info with minimal icons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#4b5563' }}>
                      <Calendar size={14} color="#9ca3af" /> 
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Émis le {new Date(inv.date_emission).toLocaleDateString('fr-FR')} • Éch. le {new Date(inv.date_echeance).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#4b5563' }}>
                      <CircleDollarSign size={14} color="#9ca3af" /> 
                      <span style={{ fontWeight: 500 }}>{Number(inv.amount).toLocaleString('fr-FR')} FCFA</span>
                    </div>
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>
      
      {/* Pagination Footer */}
      {filteredInvoices.length > 0 && totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', backgroundColor: '#fff', border: '1px solid #e5e7eb', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: currentPage === 1 ? '#d1d5db' : '#4b5563' }}
          >
            <ChevronLeft size={18} />
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              style={{
                width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px',
                border: currentPage === page ? 'none' : '1px solid #e5e7eb',
                cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem',
                backgroundColor: currentPage === page ? '#f3f4f6' : '#ffffff',
                color: currentPage === page ? '#111827' : '#4b5563'
              }}
            >
              {page}
            </button>
          ))}

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', backgroundColor: '#fff', border: '1px solid #e5e7eb', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: currentPage === totalPages ? '#d1d5db' : '#4b5563' }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Invoice Detail Modal (Minimalist adaptation) */}
      {selectedInvoice && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(17, 24, 39, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
          <div style={{ width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px', backgroundColor: '#ffffff', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f3f4f6' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#111827', margin: 0 }}>Détails de la Facture</h3>
              <button onClick={() => setSelectedInvoice(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500, textTransform: 'uppercase' }}>Numéro</div>
                  <div style={{ fontWeight: 600, color: '#111827', fontSize: '1rem', marginTop: '4px' }}>{selectedInvoice.id}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500, textTransform: 'uppercase' }}>Date</div>
                  <div style={{ fontWeight: 500, color: '#111827', marginTop: '4px' }}>{new Date(selectedInvoice.date_emission).toLocaleDateString('fr-FR')}</div>
                </div>
              </div>
              
              <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', marginBottom: '24px', border: '1px solid #f3f4f6' }}>
                <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', margin: '0 0 8px 0', textTransform: 'uppercase' }}>
                  Client
                </h4>
                <div style={{ fontWeight: 600, fontSize: '1rem', color: '#111827' }}>{selectedInvoice.client_name}</div>
                <div style={{ fontSize: '0.875rem', color: '#4b5563', marginTop: '2px' }}>{selectedInvoice.client_id}</div>
              </div>

              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>Articles</h4>
              <div style={{ border: '1px solid #f3f4f6', borderRadius: '8px', overflow: 'hidden', marginBottom: '24px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                    <tr style={{ textAlign: 'left', fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase' }}>
                      <th style={{ padding: '10px 12px', fontWeight: 500 }}>Description</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 500 }}>Qté</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 500 }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                      selectedInvoice.items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: idx !== selectedInvoice.items.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                          <td style={{ padding: '12px', fontWeight: 500, color: '#111827', fontSize: '0.875rem' }}>{item.name}</td>
                          <td style={{ padding: '12px', textAlign: 'center', color: '#4b5563', fontSize: '0.875rem' }}>{item.quantity}</td>
                          <td style={{ padding: '12px', textAlign: 'right', fontWeight: 500, color: '#111827', fontSize: '0.875rem' }}>{Number(item.price * item.quantity).toLocaleString('fr-FR')} FCFA</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" style={{ padding: '16px', textAlign: 'center', color: '#9ca3af', fontStyle: 'italic', fontSize: '0.875rem' }}>Aucun article</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #f3f4f6' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500, textTransform: 'uppercase', marginBottom: '4px' }}>Total TTC</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827' }}>
                    {Number(selectedInvoice.amount).toLocaleString('fr-FR')} FCFA
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#f9fafb', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px', borderTop: '1px solid #f3f4f6' }}>
              <button 
                onClick={() => setSelectedInvoice(null)}
                style={{ padding: '8px 24px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#fff', color: '#374151', fontWeight: 500, cursor: 'pointer', fontSize: '0.875rem' }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
