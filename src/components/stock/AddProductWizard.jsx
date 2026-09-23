import { IdentifierPhotoReader } from './IdentifierPhotoReader';
import { parseIdentifiers } from '../../services/productUnits';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CameraCapture } from './CameraCapture';
import { Camera, LoaderCircle, Plus, Search, Smartphone, Trash2, Upload, X, Package, Wallet, ClipboardCheck, Pencil } from 'lucide-react';
import { useShop } from '../../context/ShopContext.jsx';
import { LocalImage } from '../common/LocalImage.jsx';
import { cacheCatalogImage, saveLocalImage } from '../../services/localMedia.js';
import { searchPhoneCatalog } from '../../services/phoneCatalog.js';
import { FormStep, LoadingButton, StepProgress } from '../forms/FormUI';
import { AmountInput } from '../forms/AmountInput';
import './product-wizard.css';

function readInitial(data, snakeName, camelName = snakeName) {
  return data?.[snakeName] ?? data?.[camelName] ?? '';
}

function findPhoneCategory(categories) {
  return categories.find(category => /t[ée]l[ée]phone|smartphone|phone/i.test(category.name || ''));
}

function splitCatalogOptions(value) {
  if (Array.isArray(value)) return value.map(String).map(item => item.trim()).filter(Boolean);
  return String(value || '').split(/\s*\/\s*|\s*,\s*/).map(item => item.trim()).filter(Boolean);
}

const DEFAULT_PHONE_COLORS = ['Noir', 'Blanc', 'Gris', 'Argent', 'Or', 'Bleu', 'Vert', 'Rouge', 'Rose', 'Violet'];

function readCustomSpecs(data) {
  try {
    const parsed = JSON.parse(readInitial(data, 'specs_json', 'specsJson') || '{}');
    return Array.isArray(parsed.custom_fields) ? parsed.custom_fields : [];
  } catch {
    return [];
  }
}

function buildVariantSku(data) {
  const base = [data.brand, data.model, data.storage_capacity, data.color]
    .filter(Boolean)
    .join('-')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .toUpperCase()
    .slice(0, 28);
  return `${base || 'PRODUIT'}-${Date.now().toString().slice(-5)}`;
}

export function AddProductWizard({ categories, onClose, onSubmit, initialData = null, catalogOnly = false }) {
  const { userRole, userName } = useShop();
  const isOwner = userRole === 'owner';
  const phoneCategory = findPhoneCategory(categories);
  const initialCategoryId = readInitial(initialData, 'category_id', 'categoryId') || categories[0]?.id || '';
  const [formData, setFormData] = useState({
    id: initialData?.id,
    tracking_mode: initialData?.trackingMode || 'QUANTITY',
    identifiers: '',
    name: initialData?.name || '',
    category_id: initialCategoryId,
    description: initialData?.description || '',
    quantity: initialData ? Number(initialData.quantity || 0) : '',
    min_stock: Number(readInitial(initialData, 'min_stock', 'minStock') || 5),
    unit_cost: readInitial(initialData, 'unit_cost', 'unitCost'),
    price: initialData?.price ?? '',
    location: initialData?.location || '',
    image_url: readInitial(initialData, 'image_url', 'imageUrl') || null,
    catalog_id: readInitial(initialData, 'catalog_id', 'catalogId'),
    catalog_source: readInitial(initialData, 'catalog_source', 'catalogSource') || 'manual',
    brand: initialData?.brand || '',
    model: initialData?.model || '',
    ram: initialData?.ram || '',
    storage_capacity: readInitial(initialData, 'storage_capacity', 'storageCapacity'),
    color: initialData?.color || '',
    sim_type: readInitial(initialData, 'sim_type', 'simType'),
    network: initialData?.network || '',
    battery: initialData?.battery || '',
    screen: initialData?.screen || '',
    operating_system: readInitial(initialData, 'operating_system', 'operatingSystem'),
    release_date: readInitial(initialData, 'release_date', 'releaseDate'),
    specs_json: readInitial(initialData, 'specs_json', 'specsJson'),
    added_by: readInitial(initialData, 'added_by', 'addedBy') || userName,
    added_at: readInitial(initialData, 'added_at', 'addedAt') || new Date().toISOString(),
  });
  const [catalogQuery, setCatalogQuery] = useState('');
  const [catalogExpanded, setCatalogExpanded] = useState(false);
  const [catalogResults, setCatalogResults] = useState([]);
  const [catalogStatus, setCatalogStatus] = useState('idle');
  const [catalogOptions, setCatalogOptions] = useState(() => {
    try {
      const source = JSON.parse(readInitial(initialData, 'specs_json', 'specsJson') || '{}');
      return {
        ram: splitCatalogOptions(source.ram),
        storage: splitCatalogOptions(source.storage),
        colors: splitCatalogOptions(source.colors),
      };
    } catch {
      return { ram: [], storage: [], colors: [] };
    }
  });
  const [imageError, setImageError] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const closeCamera = useCallback(() => setCameraOpen(false), []);
  const [step, setStep] = useState(1);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  const [customSpecs, setCustomSpecs] = useState(() => readCustomSpecs(initialData));

  useEffect(() => {
    const query = catalogQuery.trim();
    if (query.length < 2) {
      setCatalogResults([]);
      setCatalogStatus('idle');
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setCatalogStatus('loading');
      try {
        const results = await searchPhoneCatalog(query, { signal: controller.signal });
        setCatalogResults(results);
        setCatalogStatus(results.length ? 'ready' : 'empty');
      } catch (error) {
        if (error.name !== 'AbortError') {
          setCatalogResults([]);
          setCatalogStatus('offline');
        }
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [catalogQuery]);

  const handleChange = (event) => {
    const { name, value, type } = event.target;
    setFormError('');
    setFormData(previous => ({
      ...previous,
      [name]: value,
      ...(['brand', 'model'].includes(name) ? { catalog_id: '', catalog_source: 'manual' } : {}),
    }));
  };

  const selectCatalogPhone = (phone) => {
    setFormError('');
    const brand = String(phone.brand || '').trim();
    const model = String(phone.model || '').trim();
    const options = {
      ram: splitCatalogOptions(phone.ram),
      storage: splitCatalogOptions(phone.storage),
      colors: splitCatalogOptions(phone.colors),
    };
    setCatalogOptions(options);
    const catalogImage = phone.imageUrl || phone.image_url || '';
    setFormData(previous => ({
      ...previous,
      name: [brand, model].filter(Boolean).join(' '),
      category_id: phoneCategory?.id || previous.category_id,
      catalog_id: String(phone.id || ''),
      catalog_source: phone.source || 'catalog',
      brand,
      model,
      ram: options.ram[0] || '',
      storage_capacity: options.storage[0] || '',
      color: options.colors[0] || '',
      sim_type: phone.simType || '',
      network: phone.network || '',
      battery: phone.battery || '',
      screen: phone.screen || '',
      operating_system: phone.os || '',
      release_date: phone.releaseDate || '',
      image_url: catalogImage || previous.image_url,
      specs_json: JSON.stringify(phone),
    }));
    setCatalogQuery([brand, model].filter(Boolean).join(' '));
    setCatalogResults([]);
    setCatalogStatus('selected');
    if (catalogImage) void cacheCatalogImage(catalogImage).catch(() => undefined);
  };

  const useManualEntry = () => {
    setCatalogExpanded(false);
    setCatalogResults([]);
    setCatalogStatus('manual');
    setCatalogOptions({ ram: [], storage: [], colors: [] });
    setFormData(previous => ({ ...previous, catalog_id: '', catalog_source: 'manual' }));
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageError('');
    try {
      const reference = await saveLocalImage(file);
      setFormData(previous => ({ ...previous, image_url: reference }));
    } catch (error) {
      setImageError(error.message || 'Impossible d’enregistrer cette image.');
    }
  };

  const totalSteps = 2;
  const selectedCategory = categories.find(category => category.id === formData.category_id);
  const needsVariant = /t[ée]l[ée]phone|smartphone|phone|tablette/i.test(selectedCategory?.name || '');

  useEffect(() => {
    if (!initialData && /t[ée]l[ée]phone|smartphone/i.test(selectedCategory?.name || '') && formData.tracking_mode === 'QUANTITY') setFormData(previous => ({ ...previous, tracking_mode: 'IMEI' }));
  }, [selectedCategory?.name, initialData, formData.tracking_mode]);

  const validateStep = current => {
    if (current === 1 && (!formData.name.trim() || !formData.category_id)) return 'Indiquez le nom et la catégorie du produit.';
    if (current === 1 && needsVariant && (!formData.storage_capacity || !formData.color)) return 'Choisissez la capacité et la couleur.';
    if (!catalogOnly && current === 2 && (formData.quantity === '' || !Number.isInteger(Number(formData.quantity)) || Number(formData.quantity) < 0 || formData.min_stock === '' || !Number.isInteger(Number(formData.min_stock)) || Number(formData.min_stock) < 1)) return 'Indiquez une quantité entière positive ou nulle et un seuil d’au moins 1.';
    if (!catalogOnly && current === 2 && isOwner && ([formData.unit_cost, formData.price].some(value => value === '' || !Number.isFinite(Number(value)) || Number(value) < 0))) return 'Indiquez le coût d’achat et le prix de vente. Vous pouvez saisir 0 si nécessaire.';
    return '';
  };

  const nextStep = () => {
    const message = validateStep(step);
    if (message) { setFormError(message); return; }
    setFormError('');
    setStep(current => Math.min(totalSteps, current + 1));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;
    if (step < totalSteps) { nextStep(); return; }
    for (const page of catalogOnly ? [1] : [1, 2]) {
      const message = validateStep(page);
      if (message) { setStep(page); setFormError(message); return; }
    }

    const catalogBaseName = [formData.brand, formData.model].filter(Boolean).join(' ').trim();
    const exactVariantName = formData.catalog_id && formData.name.trim() === catalogBaseName
      ? [catalogBaseName, formData.storage_capacity, formData.color].filter(Boolean).join(' · ')
      : formData.name.trim();
    let catalogSpecs = {};
    try {
      catalogSpecs = JSON.parse(formData.specs_json || '{}');
    } catch {
      catalogSpecs = {};
    }
    const finalData = {
      ...formData,
      quantity: Number(formData.quantity),
      min_stock: Number(formData.min_stock),
      unit_cost: Number(formData.unit_cost),
      price: Number(formData.price),
      name: exactVariantName,
      sku: initialData?.sku || buildVariantSku(formData),
      status: initialData?.status || (isOwner ? 'ACTIVE' : 'PENDING_PRICE'),
      created_at: initialData?.created_at || new Date().toISOString(),
      specs_json: JSON.stringify({
        ...catalogSpecs,
        custom_fields: customSpecs
          .map(field => ({ label: field.label.trim(), value: field.value.trim() }))
          .filter(field => field.label && field.value),
      }),
    };
    if (!isOwner && !initialData) {
      finalData.unit_cost = 0;
      finalData.price = 0;
    }
    setSaving(true);
    try {
      if (!initialData && finalData.tracking_mode !== 'QUANTITY' && parseIdentifiers(finalData.identifiers, finalData.tracking_mode).length !== finalData.quantity) throw new Error('Indiquez un identifiant par appareil reçu.');
      await Promise.resolve(onSubmit(finalData));
    } catch (error) {
      setFormError(error.message || 'Impossible d’enregistrer le produit. Réessayez.');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', backgroundColor: 'var(--bg-main)',
    border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)', fontSize: '1rem', boxSizing: 'border-box',
  };
  const labelStyle = {
    fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)',
    display: 'block', marginBottom: '6px',
  };
  const responsiveGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' };

  const variantField = (label, name, options, placeholder, required = false) => (
    <div>
      <label style={labelStyle}>{label}{required ? ' *' : ''}</label>
      {options.length > 1 ? (
        <select name={name} value={formData[name]} onChange={handleChange} style={inputStyle} required={required}>
          {options.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
      ) : (
        <input name={name} value={formData[name]} onChange={handleChange} placeholder={placeholder} style={inputStyle} required={required} />
      )}
    </div>
  );

  const colorOptions = Array.from(new Set([formData.color, ...catalogOptions.colors, ...DEFAULT_PHONE_COLORS].filter(Boolean)));
  const hasCatalogSelection = Boolean(formData.catalog_id) && catalogStatus !== 'manual';
  const showManualFields = catalogStatus === 'manual' || Boolean(initialData && !formData.catalog_id);

  const updateCustomSpec = (index, key, value) => {
    setCustomSpecs(previous => previous.map((field, position) => position === index ? { ...field, [key]: value } : field));
  };

  return (
    <div className="wizard-overlay" onMouseDown={event => event.target === event.currentTarget && onClose()} style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px',
    }}>
      <div className="wizard-card" style={{
        width: '100%', maxWidth: '620px', maxHeight: '88dvh', backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)', overflow: 'hidden', display: 'flex', flexDirection: 'column',
      }}>
        <div className="wizard-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {initialData ? 'Modifier le produit' : 'Ajouter un produit'}
            </h3>
            {catalogOnly && <div style={{ marginTop: '3px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Informations du produit</div>}
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X size={18} />
          </button>
        </div>

        <form className="wizard-form" onSubmit={handleSubmit} noValidate style={{ overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <StepProgress step={step} total={totalSteps} items={catalogOnly ? [{ label: 'Produit', icon: Package }, { label: 'Vérifier', icon: ClipboardCheck }] : [{ label: 'Produit', icon: Package }, { label: 'Stock', icon: Wallet }]} onSelect={saving ? undefined : page => { setFormError(''); setStep(page); }} />
          {formError && <div className="wizard-error" role="alert">{formError}</div>}
          {step === 1 && <FormStep stepKey={step}>
          {showManualFields && !catalogExpanded ? <button type="button" className="catalog-manual-link" onClick={() => setCatalogExpanded(true)}><Search size={15} /> Rechercher dans le catalogue</button> : <section className="catalog-picker">
            {!hasCatalogSelection && <>
            <label style={labelStyle}>Rechercher un téléphone</label>
            <div style={{ position: 'relative' }}>
              <Search size={17} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="search"
                value={catalogQuery}
                onChange={event => setCatalogQuery(event.target.value)}
                placeholder="Marque ou modèle"
                style={{ ...inputStyle, paddingLeft: '40px', background: 'var(--bg-surface)' }}
                autoFocus={!initialData}
              />
              {catalogStatus === 'loading' && <LoaderCircle size={17} className="spin" style={{ position: 'absolute', right: '13px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-primary)' }} />}
            </div>

            {catalogResults.length > 0 && (
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '220px', overflowY: 'auto' }}>
                {catalogResults.map(phone => (
                  <button key={phone.id} type="button" onClick={() => selectCatalogPhone(phone)} style={{
                    display: 'flex', alignItems: 'center', gap: '10px', width: '100%', textAlign: 'left',
                    padding: '10px 12px', background: 'var(--bg-surface)', color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)', borderRadius: '9px', cursor: 'pointer',
                  }}>
                    {phone.imageUrl || phone.image_url ? (
                      <LocalImage src={phone.imageUrl || phone.image_url} alt="" style={{ width: '38px', height: '46px', objectFit: 'contain', borderRadius: '5px', background: '#fff', flexShrink: 0 }} />
                    ) : (
                      <Smartphone size={18} color="var(--accent-primary)" />
                    )}
                    <span style={{ flex: 1 }}>
                      <strong>{phone.brand} {phone.model}</strong>
                      <span style={{ display: 'block', marginTop: '2px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {[phone.ram, phone.storage].filter(Boolean).join(' · ') || 'Caractéristiques à compléter'}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}

            {['empty', 'offline'].includes(catalogStatus) && (
              <div style={{ marginTop: '9px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {catalogStatus === 'offline' ? 'Catalogue indisponible hors connexion. ' : 'Aucun modèle trouvé. '}
                <button type="button" onClick={useManualEntry} style={{ padding: 0, border: 0, background: 'transparent', color: 'var(--accent-primary)', fontWeight: 700, cursor: 'pointer' }}>
                  Saisir manuellement
                </button>
              </div>
            )}
            {catalogStatus === 'idle' && <button type="button" className="catalog-manual-link" onClick={useManualEntry}>Saisir un autre produit</button>}
            </>}

            {hasCatalogSelection && <div className="catalog-selected-product">
              <span className="catalog-selected-image">{formData.image_url ? <LocalImage src={formData.image_url} alt="" /> : <Smartphone size={24} />}</span>
              <span><strong>{formData.name}</strong><small>{formData.image_url ? 'Image chargée' : 'Photo facultative'}</small></span>
              <button type="button" onClick={() => { setCatalogStatus('idle'); setCatalogQuery(''); }}>Changer</button>
            </div>}
          </section>}

          {showManualFields && <div className="manual-product-fields"><div>
            <label htmlFor="product-name" style={labelStyle}>Nom du produit *</label>
            <input id="product-name" type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Nom du produit" style={inputStyle} required />
          </div>

          <div className="wizard-field-grid" style={responsiveGrid}>
            <div>
              <label htmlFor="product-category" style={labelStyle}>Catégorie *</label>
              <select id="product-category" name="category_id" value={formData.category_id} onChange={handleChange} style={inputStyle} required>
                {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </div>
          </div>
          </div>}
          </FormStep>}

          {step === 1 && needsVariant && (hasCatalogSelection || showManualFields) && <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Smartphone size={18} color="var(--accent-primary)" />
              <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Quelle variante ?</strong>
            </div>
            <div className="wizard-field-grid wizard-variant-grid" style={responsiveGrid}>
              {variantField('Capacité', 'storage_capacity', catalogOptions.storage, '256 GB', needsVariant)}
              <div>
                <label style={labelStyle}>Couleur{needsVariant ? ' *' : ''}</label>
                <select name="color" value={formData.color} onChange={handleChange} style={inputStyle}>
                  <option value="">Choisir une couleur</option>
                  {colorOptions.map(option => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
            </div>
            <details className="wizard-optional" style={{ marginTop: '14px' }}>
              <summary>Plus de caractéristiques · facultatif</summary>
              <div className="wizard-field-grid" style={{ marginTop: '14px', ...responsiveGrid }}>
                <div><label style={labelStyle}>Marque</label><input name="brand" value={formData.brand} onChange={handleChange} placeholder="Samsung" style={inputStyle} /></div>
                <div><label style={labelStyle}>Modèle</label><input name="model" value={formData.model} onChange={handleChange} placeholder="Galaxy S24" style={inputStyle} /></div>
                {variantField('RAM', 'ram', catalogOptions.ram, '8 GB')}
                <div><label style={labelStyle}>SIM</label><select name="sim_type" value={formData.sim_type} onChange={handleChange} style={inputStyle}><option value="">À préciser</option><option value="SIM simple">SIM simple</option><option value="Double SIM">Double SIM</option><option value="Nano-SIM + eSIM">Nano-SIM + eSIM</option><option value="eSIM">eSIM</option></select></div>
              </div>
            <div style={{ marginTop: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: customSpecs.length ? '10px' : 0 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Autres caractéristiques</span>
                <button type="button" onClick={() => setCustomSpecs(previous => [...previous, { label: '', value: '' }])} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <Plus size={14} /> Ajouter un champ
                </button>
              </div>
              {customSpecs.map((field, index) => (
                <div key={index} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) 36px', gap: '8px', marginTop: '8px' }}>
                  <input value={field.label} onChange={event => updateCustomSpec(index, 'label', event.target.value)} placeholder="Ex : Garantie" style={inputStyle} />
                  <input value={field.value} onChange={event => updateCustomSpec(index, 'value', event.target.value)} placeholder="Ex : 12 mois" style={inputStyle} />
                  <button type="button" aria-label="Supprimer la caractéristique" onClick={() => setCustomSpecs(previous => previous.filter((_, position) => position !== index))} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-main)', color: 'var(--danger)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
            </details>
          </section>}

          {step === 1 && <details className="wizard-optional"><summary><Camera size={16} /> Photo, emplacement et description</summary><div className="product-presentation">
          <div>
            <label style={labelStyle}>Emplacement</label>
            <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="Ex : Rayon A-4" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Image du produit</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button type="button" onClick={() => fileInputRef.current?.click()} style={{ width: '64px', height: '64px', padding: 0, borderRadius: 'var(--radius-md)', border: '2px dashed var(--border-color)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', flexShrink: 0 }}>
                {formData.image_url ? <LocalImage src={formData.image_url} alt="Aperçu" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Upload size={20} color="var(--text-muted)" />}
              </button>
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />
              <button type="button" className="btn btn-secondary" onClick={() => setCameraOpen(true)} style={{ padding: '7px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Camera size={15} /> Prendre une photo</button>
              <button type="button" className="btn btn-secondary" onClick={() => fileInputRef.current?.click()} style={{ padding: '7px 12px', fontSize: '0.8rem' }}>Choisir une image</button>
              {formData.image_url && <button type="button" onClick={() => setFormData(previous => ({ ...previous, image_url: null }))} style={{ padding: '7px 8px', fontSize: '0.8rem', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}>Supprimer</button>}
            </div>
            {imageError && <div style={{ marginTop: '7px', color: 'var(--danger)', fontSize: '0.75rem', fontWeight: 600 }}>{imageError}</div>}
            {formData.image_url && formData.catalog_id && <div style={{ marginTop: '7px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>Image du catalogue disponible hors connexion après son chargement.</div>}
          </div>
          <details className="wizard-optional"><summary>Ajouter une description</summary><textarea name="description" value={formData.description} onChange={handleChange} placeholder="État, garantie ou détail utile…" style={{ ...inputStyle, minHeight: '72px', resize: 'vertical', marginTop: '10px' }} /></details>
          </div></details>}

          {!catalogOnly && step === 2 && <FormStep stepKey={step}><section>
            <button type="button" className="product-step-summary" onClick={() => setStep(1)}>
              {formData.image_url ? <LocalImage src={formData.image_url} alt="" /> : <Package size={20} />}
              <span><strong>{formData.name || 'Produit sans nom'}</strong><small>{selectedCategory?.name || 'Catégorie à préciser'}</small></span><Pencil size={16} />
            </button>
            <div className="wizard-step-heading"><strong>Combien d’articles reçus ?</strong></div>
            <label style={labelStyle}>Suivi des appareils
              <select name="tracking_mode" value={formData.tracking_mode} onChange={handleChange} disabled={!!initialData} style={inputStyle}>
                <option value="QUANTITY">En quantité · accessoires</option><option value="IMEI">Par IMEI · téléphones</option><option value="SERIAL">Par numéro de série</option>
              </select>
            </label>
            {!initialData && formData.tracking_mode !== 'QUANTITY' && <><IdentifierPhotoReader mode={formData.tracking_mode} value={formData.identifiers} onChange={identifiers => setFormData(previous => ({ ...previous, identifiers }))} /><label style={labelStyle}>{formData.tracking_mode === 'IMEI' ? 'IMEI principal' : 'Numéro de série'} · un par ligne *
              <textarea name="identifiers" value={formData.identifiers} onChange={handleChange} rows={3} style={{ ...inputStyle, height: 'auto', resize: 'vertical' }} placeholder="Un identifiant par appareil" />
              <small>Les identifiants sont vérifiés avant l’enregistrement.</small>
            </label></>}
            <div className="wizard-field-grid" style={responsiveGrid}>
              <div><label htmlFor="product-quantity" style={labelStyle}>Quantité initiale *</label><input id="product-quantity" disabled={!!initialData && formData.tracking_mode !== 'QUANTITY'} type="number" name="quantity" min="0" value={formData.quantity} onChange={handleChange} style={inputStyle} required /></div>
              <details className="wizard-optional"><summary>Alerte de stock · {formData.min_stock || 5} articles</summary><label htmlFor="product-min-stock" style={labelStyle}>Me prévenir en dessous de</label><input id="product-min-stock" type="number" name="min_stock" min="1" value={formData.min_stock} onChange={handleChange} style={inputStyle} /></details>
            </div>

            {!isOwner && (
              <div style={{ marginTop: '12px', padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-main)', borderLeft: '4px solid var(--accent-primary)', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Le produit sera envoyé à l’administrateur, qui renseignera le coût d’achat et le prix de vente avant sa mise en vente.
              </div>
            )}
          </section></FormStep>}

          {!catalogOnly && step === 2 && isOwner && <section>
            <div className="wizard-step-heading"><strong>Fixer les prix</strong><span>Ces informations servent au calcul de la rentabilité.</span></div>
            <div className="wizard-field-grid" style={responsiveGrid}>
              <div><label htmlFor="product-unit_cost" style={labelStyle}>Coût d’achat *</label><AmountInput label="Coût d’achat" name="unit_cost" value={formData.unit_cost} onChange={handleChange} /></div>
              <div><label htmlFor="product-price" style={labelStyle}>Prix de vente *</label><AmountInput label="Prix de vente" name="price" value={formData.price} onChange={handleChange} /></div>
            </div>
          </section>}

          {catalogOnly && step === totalSteps && <FormStep stepKey={step}>
            <div className="wizard-step-heading"><strong>Tout est correct ?</strong><span>Vérifiez votre fiche avant de l’enregistrer.</span></div>
            <div className="product-review">
              <div className="product-review-title">{formData.image_url && <LocalImage src={formData.image_url} alt="Produit" />}<div><strong>{formData.name}</strong><p>{selectedCategory?.name}</p></div><button type="button" onClick={() => setStep(1)} aria-label="Modifier le produit"><Pencil size={18} /></button></div>
              <dl>{[['Marque / modèle', [formData.brand, formData.model].filter(Boolean).join(' ')], ['Variante', [formData.storage_capacity, formData.ram, formData.color, formData.sim_type].filter(Boolean).join(' · ')], ['Emplacement', formData.location], ['Description', formData.description], ['Batterie', formData.battery], ['Écran', formData.screen], ['Système', formData.operating_system], ['Date de sortie', formData.release_date], ...customSpecs.map(field => [field.label, field.value])].filter(([,value]) => value).map(([label,value],i) => <div key={i}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
              {!catalogOnly && <><div className="product-review-title"><strong>Stock {isOwner ? 'et prix' : ''}</strong><button type="button" onClick={() => setStep(2)} aria-label="Modifier le stock et les prix"><Pencil size={18} /></button></div>
              <dl>{[['Quantité', formData.quantity], ['Seuil d’alerte', formData.min_stock], ...(isOwner ? [['Coût d’achat', `${Number(formData.unit_cost).toLocaleString('fr-FR')} FCFA`], ['Prix de vente', `${Number(formData.price).toLocaleString('fr-FR')} FCFA`]] : [])].map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
              {!isOwner && <p>L’administrateur validera le produit et ses prix avant sa mise en vente.</p>}</>}
              {catalogOnly && <p>Le stock et les prix restent inchangés. Seul l’administrateur peut définir les prix.</p>}
            </div>
          </FormStep>}

          <div className="wizard-footer">
            {step === 1 ? <button type="button" disabled={saving} className="btn btn-secondary" onClick={onClose}>Annuler</button> : <button type="button" disabled={saving} className="btn btn-secondary" onClick={() => { setFormError(''); setStep(current => current - 1); }}>Retour</button>}
            {step < totalSteps ? <button type="button" className="btn btn-primary" onClick={nextStep}>Continuer</button> : <LoadingButton type="submit" loading={saving} className="btn btn-primary">{initialData ? 'Enregistrer' : 'Ajouter le produit'}</LoadingButton>}
          </div>
        </form>
      </div>
      {cameraOpen && <CameraCapture onClose={closeCamera} onCapture={async file => {
        const reference = await saveLocalImage(file);
        setFormData(previous => ({ ...previous, image_url: reference }));
        setImageError('');
      }} />}
    </div>
  );
}
