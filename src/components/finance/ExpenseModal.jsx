import React, { useState } from 'react';
import { ReceiptText, X } from 'lucide-react';

const inputStyle = {
  width: '100%', minHeight: '44px', padding: '10px 12px', boxSizing: 'border-box',
  border: '1px solid var(--border-color)', borderRadius: '10px', background: 'var(--bg-main)',
  color: 'var(--text-primary)', font: 'inherit', outline: 'none',
};

const categories = [
  ['LOYER', 'Loyer'],
  ['SALAIRE', 'Salaire'],
  ['ELECTRICITE', 'Électricité'],
  ['INTERNET', 'Internet'],
  ['TRANSPORT', 'Transport'],
  ['ACHAT_DIVERS', 'Achat divers'],
  ['AUTRE', 'Autre'],
];

export const EXPENSE_CATEGORY_LABELS = Object.fromEntries(categories);

export function ExpenseModal({ onClose, onSubmit }) {
  const [category, setCategory] = useState('LOYER');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [recurrence, setRecurrence] = useState('NONE');
  const [employeeName, setEmployeeName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async event => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        category,
        description: description.trim(),
        amount: Number(amount),
        date: new Date(`${date}T12:00:00`).toISOString(),
        recurrence,
        employee_name: category === 'SALAIRE' ? employeeName.trim() : '',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div onMouseDown={event => event.target === event.currentTarget && onClose()} style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(15,23,42,.58)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <form role="dialog" aria-modal="true" aria-labelledby="expense-title" onSubmit={submit} style={{ width: '100%', maxWidth: '500px', maxHeight: '92vh', overflowY: 'auto', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '18px', color: 'var(--text-primary)', boxShadow: '0 24px 70px rgba(0,0,0,.28)' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#fef2f2', color: '#dc2626', display: 'grid', placeItems: 'center' }}><ReceiptText size={21} /></div>
            <div>
              <h2 id="expense-title" style={{ margin: 0, fontSize: '18px' }}>Ajouter une dépense</h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>Elle sera intégrée au bénéfice net.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" style={{ width: '34px', height: '34px', border: 0, borderRadius: '50%', background: 'var(--bg-main)', color: 'var(--text-secondary)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        <div style={{ padding: '20px', display: 'grid', gap: '15px' }}>
          <label style={{ display: 'grid', gap: '7px', fontSize: '13px', fontWeight: 700 }}>Catégorie
            <select value={category} onChange={event => setCategory(event.target.value)} style={inputStyle}>
              {categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          {category === 'SALAIRE' && (
            <label style={{ display: 'grid', gap: '7px', fontSize: '13px', fontWeight: 700 }}>Employé ou gestionnaire
              <input value={employeeName} onChange={event => setEmployeeName(event.target.value)} style={inputStyle} placeholder="Nom de la personne" required />
            </label>
          )}
          <label style={{ display: 'grid', gap: '7px', fontSize: '13px', fontWeight: 700 }}>Description
            <input value={description} onChange={event => setDescription(event.target.value)} style={inputStyle} placeholder="Ex. Loyer boutique de septembre" required />
          </label>
          <label style={{ display: 'grid', gap: '7px', fontSize: '13px', fontWeight: 700 }}>Montant (FCFA)
            <input type="number" min="1" value={amount} onChange={event => setAmount(event.target.value)} style={inputStyle} required />
          </label>
          <label style={{ display: 'grid', gap: '7px', fontSize: '13px', fontWeight: 700 }}>Date
            <input type="date" value={date} onChange={event => setDate(event.target.value)} style={inputStyle} required />
          </label>
          <label style={{ display: 'grid', gap: '7px', fontSize: '13px', fontWeight: 700 }}>Récurrence
            <select value={recurrence} onChange={event => setRecurrence(event.target.value)} style={inputStyle}>
              <option value="NONE">Dépense ponctuelle</option>
              <option value="MONTHLY">Mensuelle</option>
            </select>
          </label>
          {recurrence === 'MONTHLY' && <div style={{ padding: '10px 12px', borderRadius: '10px', background: '#fffbeb', color: '#92400e', fontSize: '12px' }}>La récurrence sert de repère. Vous confirmerez chaque paiement mensuel pour éviter les doublons.</div>}
        </div>

        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '10px', position: 'sticky', bottom: 0, background: 'var(--bg-surface)' }}>
          <button type="button" onClick={onClose} style={{ minHeight: '44px', padding: '0 18px', border: '1px solid var(--border-color)', borderRadius: '10px', background: 'var(--bg-main)', color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
          <button type="submit" disabled={submitting} style={{ minHeight: '44px', padding: '0 18px', border: 0, borderRadius: '10px', background: 'var(--accent-primary)', color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: submitting ? .65 : 1 }}>{submitting ? 'Enregistrement…' : 'Enregistrer'}</button>
        </div>
      </form>
    </div>
  );
}
