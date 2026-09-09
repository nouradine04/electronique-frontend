import React, { useState, useMemo } from 'react';
import { Pagination } from '../../components/ui/Pagination.jsx';
import { usePagination } from '../../components/ui/usePagination.js';
import { LoadingButton } from '../../components/forms/FormUI';
import { useQuery } from '../../db/useQuery.js';
import { queryProducts, queryCategories, querySales, queryClients, queryPayments, queryStockMovements, queryInvoices, database, createPayment } from '../../db/queries.js';
import { useShop } from '../../context/ShopContext.jsx';
import { Search, UserCheck, CreditCard, History, Plus } from 'lucide-react';

export function CreditsPage() {
  const { currentShop } = useShop();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [notification, setNotification] = useState(null);
  const [saving, setSaving] = useState(false);

  // Queries
  const clients = useQuery(queryClients(currentShop?.id || '')) || [];
  const sales = useQuery(querySales(currentShop?.id || '')) || [];
  const creditSales = sales.filter(s => String(s.paymentMethod || s.payment_method || '').toLowerCase() === 'credit');
  const payments = useQuery(queryPayments(currentShop?.id || '')) || [];

  // Compute Client Debts
  const clientsWithDebt = useMemo(() => {
    return clients.map(client => {
      const clientSales = creditSales.filter(s => (s.clientId || s.client_id) === client.id);
      const clientPayments = payments.filter(p => (p.clientId || p.client_id) === client.id);
      
      const totalPurchased = clientSales.reduce((sum, s) => sum + (s.totalPrice || s.total_price || 0), 0);
      const totalPaid = clientPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const currentDebt = totalPurchased - totalPaid;

      return {
        ...client,
        name: client.name,
        phone: client.phone,
        totalPurchased,
        totalPaid,
        currentDebt
      };
    }).filter(c => c.currentDebt > 0 || c.totalPurchased > 0)
      .sort((a, b) => b.currentDebt - a.currentDebt);
  }, [clients, creditSales, payments]);

  const filteredClients = clientsWithDebt.filter(c => {
    const q = String(searchQuery || '').toLowerCase();
    const nameStr = String(c.name || '').toLowerCase();
    const phoneStr = String(c.phone || '').toLowerCase();
    return nameStr.includes(q) || phoneStr.includes(q);
  });

  const totalOutstandingDebt = clientsWithDebt.reduce((sum, c) => sum + c.currentDebt, 0);
  const clientPage = usePagination(filteredClients, `${currentShop?.id}:${searchQuery}`);

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (saving) return;
    if (!selectedClient || !paymentAmount || isNaN(paymentAmount) || paymentAmount <= 0) return;
    
    if (paymentAmount > selectedClient.currentDebt) {
      alert("Le montant remboursé ne peut pas dépasser la dette totale (" + selectedClient.currentDebt + " FCFA).");
      return;
    }

    setSaving(true);
    try {
      await createPayment({
        shop_id: currentShop.id,
        client_id: selectedClient.id,
        amount: Number(paymentAmount),
        date: new Date().toISOString()
      });

      setPaymentModalOpen(false);
      setSelectedClient(null);
      setPaymentAmount('');
      setNotification({ type: 'success', message: 'Remboursement enregistré avec succès.' });
      setTimeout(() => setNotification(null), 3000);

    } catch (err) {
      alert("Erreur lors de l'enregistrement : " + err.message);
    } finally { setSaving(false); }
  };

  const openPaymentModal = (client) => {
    setSelectedClient(client);
    setPaymentAmount(client.currentDebt); // Default to full repayment
    setPaymentModalOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Ventes à Crédit</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Suivez les dettes de vos clients et enregistrez les remboursements.
          </p>
        </div>
        <div style={{ textAlign: 'right', padding: '12px 24px', backgroundColor: 'var(--danger-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--danger)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 600, textTransform: 'uppercase' }}>Crédits en cours (Total)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--danger)' }}>{totalOutstandingDebt.toFixed(2)} FCFA</div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="surface-panel" style={{ overflow: 'hidden' }}>
        
        {/* Toolbar */}
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="input-field"
              style={{ paddingLeft: '36px' }}
              placeholder="Rechercher un client (Nom, Tel)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Clients Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Téléphone</th>
                <th style={{ textAlign: 'right' }}>Total Acheté à Crédit</th>
                <th style={{ textAlign: 'right' }}>Total Remboursé</th>
                <th style={{ textAlign: 'right' }}>Reste à Payer</th>
                <th style={{ textAlign: 'center' }}>Statut</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Aucun client avec un historique de crédit.
                  </td>
                </tr>
              ) : (
                clientPage.items.map(client => (
                  <tr key={client.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {client.name}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {client.phone || '-'}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                      {client.totalPurchased.toFixed(2)} FCFA
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--success)', fontWeight: 500 }}>
                      {client.totalPaid.toFixed(2)} FCFA
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: client.currentDebt > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
                      {client.currentDebt.toFixed(2)} FCFA
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {client.currentDebt > 0 ? (
                        <span className="badge badge-danger">Impayé</span>
                      ) : (
                        <span className="badge badge-success"><UserCheck size={12} /> Réglé</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {client.currentDebt > 0 && (
                        <button
                          className="btn btn-primary"
                          style={{ padding: '4px 12px', fontSize: '0.75rem', height: 'auto' }}
                          onClick={() => openPaymentModal(client)}
                        >
                          Encaisser
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      <Pagination {...clientPage.props} itemLabel="client" />
      {paymentModalOpen && selectedClient && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
        }}>
          <div className="surface-panel" style={{ width: '100%', maxWidth: '400px', padding: '32px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
              Enregistrer un Remboursement
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Client : <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedClient.name}</span>
            </p>

            <div style={{ padding: '16px', backgroundColor: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-sm)', marginBottom: '24px' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--danger)', marginBottom: '4px' }}>Dette Actuelle</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--danger)' }}>{selectedClient.currentDebt.toFixed(2)} FCFA</div>
            </div>

            <form onSubmit={handleProcessPayment}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
                  Montant remboursé (Espèces)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field"
                    style={{ fontSize: '1.25rem', height: '48px', fontWeight: 600 }}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    max={selectedClient.currentDebt}
                    required
                  />
                  <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 600, color: 'var(--text-muted)' }}>FCFA</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" disabled={saving} className="btn btn-secondary" onClick={() => setPaymentModalOpen(false)}>Annuler</button>
                <LoadingButton type="submit" loading={saving} className="btn btn-primary">Valider le paiement</LoadingButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {notification && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', padding: '16px 24px', borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--success-bg)', border: '1px solid var(--success)', color: 'var(--success)',
          fontWeight: 600, boxShadow: 'var(--shadow-md)', zIndex: 2000
        }}>
          {notification.message}
        </div>
      )}

    </div>
  );
}
