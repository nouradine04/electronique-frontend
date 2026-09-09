import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { LoaderCircle, Tags, X } from 'lucide-react';
import { FormField, FormInput } from '../ui/FormControls';
import { createCategory } from '../../db/queries.js';
import './add-category.css';

type Props = {
  shopId: string;
  categories: { name: string }[];
  onClose: () => void;
  onCreated: () => void;
};

export function AddCategoryModal({ shopId, categories, onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    const cleanName = name.trim().replace(/\s+/g, ' ');
    if (!cleanName) { setError('Indiquez le nom de la catégorie.'); return; }
    if (categories.some(category => category.name.trim().toLocaleLowerCase('fr') === cleanName.toLocaleLowerCase('fr'))) {
      setError('Cette catégorie existe déjà.'); return;
    }
    if (!shopId) { setError('Sélectionnez une boutique.'); return; }
    setSaving(true);
    try {
      await createCategory(shopId, cleanName);
      onCreated();
      onClose();
    } catch {
      setError('Impossible d’enregistrer la catégorie. Réessayez.');
    } finally { setSaving(false); }
  }

  return <Dialog.Root open onOpenChange={open => { if (!open && !saving) onClose(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className="category-overlay" />
      <Dialog.Content className="category-dialog" aria-busy={saving}>
        <div className="category-heading"><Tags size={21} /><Dialog.Title>Nouvelle catégorie</Dialog.Title><Dialog.Close disabled={saving} aria-label="Fermer"><X size={19} /></Dialog.Close></div>
        <Dialog.Description>Classez vos produits pour les retrouver facilement.</Dialog.Description>
        <form onSubmit={submit}>
          <FormField id="category-name" label="Nom de la catégorie" error={error}>
            <FormInput id="category-name" value={name} maxLength={80} placeholder="Ex. Consoles de jeux" disabled={saving} aria-invalid={Boolean(error)} onChange={event => { setName(event.target.value); setError(''); }} />
          </FormField>
          <div className="category-actions"><Dialog.Close className="btn btn-secondary" disabled={saving}>Annuler</Dialog.Close><button className="btn btn-primary" type="submit" disabled={saving}>{saving && <LoaderCircle className="spin" size={16} />}{saving ? 'Enregistrement…' : 'Ajouter'}</button></div>
        </form>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
