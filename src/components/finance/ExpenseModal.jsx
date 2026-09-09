import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { CalendarDays, FileText, ReceiptText, UserRound, X } from 'lucide-react';
import { AmountInput } from '../forms/AmountInput';
import { LoadingButton } from '../forms/FormUI';
import { FormField, FormInput, FormSelect } from '../ui/FormControls';
import './expense-modal.css';

const categories = [
  ['LOYER', 'Loyer'], ['SALAIRE', 'Salaire'], ['ELECTRICITE', 'Électricité'],
  ['INTERNET', 'Internet'], ['TRANSPORT', 'Transport'], ['ACHAT_DIVERS', 'Achat divers'], ['AUTRE', 'Autre'],
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
  const [error, setError] = useState('');

  const submit = async event => {
    event.preventDefault();
    if (!description.trim() || !Number(amount) || (category === 'SALAIRE' && !employeeName.trim())) {
      setError('Complétez les informations obligatoires.');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({ category, description: description.trim(), amount: Number(amount), date: new Date(`${date}T12:00:00`).toISOString(), recurrence, employee_name: category === 'SALAIRE' ? employeeName.trim() : '' });
    } finally { setSubmitting(false); }
  };

  return <Dialog.Root open onOpenChange={open => !open && onClose()}>
    <Dialog.Portal>
      <Dialog.Overlay className="expense-overlay" />
      <Dialog.Content className="expense-dialog" aria-describedby="expense-description">
        <header className="expense-header">
          <span className="expense-icon"><ReceiptText size={20} /></span>
          <div><Dialog.Title>Ajouter une dépense</Dialog.Title><Dialog.Description id="expense-description">Elle sera déduite du bénéfice net.</Dialog.Description></div>
          <Dialog.Close className="expense-close" aria-label="Fermer"><X size={18} /></Dialog.Close>
        </header>
        <form onSubmit={submit} noValidate>
          <div className="expense-fields">
            {error && <p className="expense-error" role="alert">{error}</p>}
            <FormField id="expense-category" label="Catégorie">
              <FormSelect id="expense-category" value={category} onChange={event => { setCategory(event.target.value); setError(''); }}>
                {categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </FormSelect>
            </FormField>
            {category === 'SALAIRE' && <FormField id="expense-employee" label="Employé ou gestionnaire" error={error && !employeeName.trim() ? 'Indiquez la personne concernée.' : null}>
              <FormInput id="expense-employee" leadingIcon={<UserRound size={18} />} value={employeeName} onChange={event => { setEmployeeName(event.target.value); setError(''); }} placeholder="Nom de la personne" aria-invalid={Boolean(error && !employeeName.trim())} />
            </FormField>}
            <FormField id="expense-description-input" label="Description" error={error && !description.trim() ? 'Décrivez brièvement la dépense.' : null}>
              <FormInput id="expense-description-input" leadingIcon={<FileText size={18} />} value={description} onChange={event => { setDescription(event.target.value); setError(''); }} placeholder="Ex. Loyer de septembre" aria-invalid={Boolean(error && !description.trim())} />
            </FormField>
            <div className="expense-row">
              <FormField id="expense-amount" label="Montant" error={error && !Number(amount) ? 'Indiquez le montant.' : null}>
                <AmountInput name="amount" value={amount} onChange={event => { setAmount(event.target.value); setError(''); }} label="Montant de la dépense" />
              </FormField>
              <FormField id="expense-date" label="Date">
                <FormInput id="expense-date" leadingIcon={<CalendarDays size={18} />} type="date" value={date} onChange={event => setDate(event.target.value)} required />
              </FormField>
            </div>
            <FormField id="expense-recurrence" label="Fréquence" help={recurrence === 'MONTHLY' ? 'Vous confirmerez chaque paiement afin d’éviter les doublons.' : undefined}>
              <FormSelect id="expense-recurrence" value={recurrence} onChange={event => setRecurrence(event.target.value)}><option value="NONE">Une seule fois</option><option value="MONTHLY">Tous les mois</option></FormSelect>
            </FormField>
          </div>
          <footer className="expense-actions"><Dialog.Close type="button" className="btn btn-secondary">Annuler</Dialog.Close><LoadingButton type="submit" loading={submitting} className="btn btn-primary">Enregistrer</LoadingButton></footer>
        </form>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
