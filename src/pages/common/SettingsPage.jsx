import { exportLocalBackup, restoreLocalBackup, encodeLocalBackup, decodeLocalBackup } from '../../db/backup.js';
import React, { useEffect, useState, useRef } from 'react';
import { Q } from '@nozbe/watermelondb';
import { queryProducts, queryCategories, querySales, queryClients, queryPayments, queryStockMovements, queryInvoices, database } from '../../db/queries.js';
import { useShop } from '../../context/ShopContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Upload, Save, Image as ImageIcon, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LocalImage } from '../../components/common/LocalImage.jsx';
import { saveLocalImage } from '../../services/localMedia.js';
import { updateLocalUserProfile } from '../../services/localAuth.js';
import { FormField, FormInput } from '../../components/ui/FormControls';
import './settings.css';

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { currentShop, switchShop, userRole, userName, currentUserId, switchRole } = useShop();
  const { showToast } = useToast();
  const [logoUrl, setLogoUrl] = useState(currentShop?.logo_url || null);
  const backupFileInputRef = useRef(null);
  const [settingsError, setSettingsError] = useState('');

  const handleExportBackup = async () => {
    try {
      const backupData = await exportLocalBackup();

      const encrypted = await encodeLocalBackup(backupData);
      
      const blob = new Blob([encrypted], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `nstock_sauvegarde_${currentShop?.name?.toLowerCase() || 'shop'}_${new Date().toISOString().slice(0, 10)}.backup`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast('Sauvegarde exportée avec succès ! Gardez ce fichier en lieu sûr.', 'success');
    } catch (err) {
      showToast('Erreur lors de l\'export de la sauvegarde : ' + err.message, 'danger');
    }
  };

  const handleImportBackup = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const encrypted = evt.target.result;
          const backup = await decodeLocalBackup(encrypted);

          if (!backup.data || !backup.version) {
            throw new Error('Format de fichier de sauvegarde invalide.');
          }

          await restoreLocalBackup(backup);

          showToast('Sauvegarde restaurée avec succès ! Actualisation en cours...', 'success');
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } catch (error) {
          showToast('Échec de la restauration : Le fichier est invalide ou corrompu.', 'danger');
        }
      };
      reader.readAsText(file);
    } catch (err) {
      showToast('Erreur lors de la lecture du fichier : ' + err.message, 'danger');
    }
  };

  const [name, setName] = useState(currentShop?.name || '');
  const [address, setAddress] = useState(currentShop?.address || '');
  const [phone, setPhone] = useState(currentShop?.phone || '');
  const [nif, setNif] = useState(currentShop?.nif || '');
  const [email, setEmail] = useState(currentShop?.email || '');
  const [profileUserId, setProfileUserId] = useState(currentUserId);
  const [profileName, setProfileName] = useState(userName);
  const [profilePhone, setProfilePhone] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let active = true;
    database.get('local_users').query(Q.where('shop_id', currentShop.id), Q.where('role', userRole)).fetch().then(accounts => {
      if (!active) return;
      const account = accounts.find(item => item.id === currentUserId) || accounts.find(item => item.name === userName) || accounts[0];
      if (account) { setProfileUserId(account.id); setProfileName(account.name); setProfilePhone(account.phone || ''); }
    }).catch(() => {});
    return () => { active = false; };
  }, [currentShop.id, currentUserId, userName, userRole]);

  const handleProfileSave = async () => {
    if (!profileName.trim()) { setSettingsError('Indiquez votre nom.'); return; }
    setSettingsError('');
    setProfileSaving(true);
    try {
      const account = await updateLocalUserProfile(profileUserId, { name: profileName, phone: profilePhone });
      switchRole(userRole, account.name, account.id);
      showToast('Profil mis à jour.', 'success');
    } catch (error) { showToast(error.message || 'Impossible de modifier le profil.', 'danger'); }
    finally { setProfileSaving(false); }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        setLogoUrl(await saveLocalImage(file, { maxDimension: 640, quality: 0.85 }));
      } catch (error) {
        showToast(error.message || 'Impossible d’enregistrer cette image.', 'danger');
      }
    }
  };

  const handleSave = async () => {
    if (userRole !== 'owner') return;
    if (!name.trim()) { setSettingsError('Indiquez le nom de la boutique.'); return; }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setSettingsError('Indiquez une adresse email valide.'); return; }
    setSettingsError('');
    try {
      await database.write(() => currentShop.update(shop => {
        shop.name = name.trim();
        shop.address = address;
        shop.phone = phone;
        shop.nif = nif;
        shop.email = email;
        shop.logoUrl = logoUrl || '';
        shop.synced = false;
      }));

      showToast(t('settings_page.success_msg', 'Paramètres mis à jour avec succès'), 'success');
    } catch (err) {
      showToast(t('settings_page.error_msg', 'Erreur lors de la mise à jour: ') + err.message, 'danger');
    }
  };

  return (
    <div className="settings-page" style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px' }}>
      {settingsError && <p role="alert" style={{ color: 'var(--danger)' }}>{settingsError}</p>}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{t('settings_page.title', 'Paramètres de la Boutique')}</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{t('settings_page.subtitle', "Gérez les informations et l'apparence de votre boutique pour vos clients.")}</p>
      </div>

      <div style={{ backgroundColor: 'var(--bg-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}><span style={{ width: 38, height: 38, borderRadius: '50%', display: 'grid', placeItems: 'center', background: '#e8f3fb', color: '#0e6ba8' }}><UserRound size={19} /></span><div><h3 style={{ margin: 0, fontSize: '16px' }}>Mon profil</h3><small style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{userRole === 'owner' ? 'Administrateur' : 'Gestionnaire'}</small></div></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: '14px' }}>
          <FormField id="profile-name" label={<>Nom affiché <span className="required-star">*</span></>}><FormInput id="profile-name" required maxLength={120} value={profileName} onChange={event => setProfileName(event.target.value)} /></FormField>
          <FormField id="profile-phone" label="Téléphone"><FormInput id="profile-phone" type="tel" inputMode="tel" value={profilePhone} onChange={event => setProfilePhone(event.target.value)} placeholder="+221 77 000 00 00" /></FormField>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}><button type="button" className="btn btn-primary" disabled={profileSaving} onClick={handleProfileSave}>{profileSaving ? 'Enregistrement…' : 'Enregistrer mon profil'}</button></div>
      </div>

      <div style={{ backgroundColor: 'var(--bg-surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '20px' }}>{t('settings_page.shop_info', 'Informations de la Boutique')}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <div>
            <label htmlFor="settings-shop-name" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>{t('settings_page.shop_name', 'Nom de la boutique')} <span className="required-star">*</span></label>
            <input id="settings-shop-name" required maxLength={120} type="text" value={name} onChange={e => setName(e.target.value)} disabled={userRole !== 'owner'} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '1rem', backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>{t('settings_page.address', 'Adresse')}</label>
            <input type="text" value={address} onChange={e => setAddress(e.target.value)} disabled={userRole !== 'owner'} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '1rem', backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>{t('settings_page.phone', 'Téléphone')}</label>
            <input type="text" value={phone} onChange={e => setPhone(e.target.value)} disabled={userRole !== 'owner'} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '1rem', backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>{t('settings_page.nif', 'NIF / ICE')}</label>
            <input type="text" value={nif} onChange={e => setNif(e.target.value)} disabled={userRole !== 'owner'} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '1rem', backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>{t('settings_page.email', 'Email')}</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={userRole !== 'owner'} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '1rem', backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)' }} />
          </div>
        </div>

        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>{t('settings_page.language', 'Langue')}</h3>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
          <button 
            type="button"
            onClick={() => i18n.changeLanguage('fr')}
            style={{
              backgroundColor: i18n.language === 'fr' ? '#0e6ba8' : 'var(--bg-main)',
              color: i18n.language === 'fr' ? '#ffffff' : 'var(--text-primary)',
              border: i18n.language === 'fr' ? '1px solid #0e6ba8' : '1px solid var(--border-color)',
              padding: '12px 24px',
              borderRadius: '10px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Français
          </button>
          <button 
            type="button"
            onClick={() => i18n.changeLanguage('ar')}
            style={{
              backgroundColor: i18n.language === 'ar' ? '#0e6ba8' : 'var(--bg-main)',
              color: i18n.language === 'ar' ? '#ffffff' : 'var(--text-primary)',
              border: i18n.language === 'ar' ? '1px solid #0e6ba8' : '1px solid var(--border-color)',
              padding: '12px 24px',
              borderRadius: '10px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            العربية
          </button>
        </div>

        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>{t('settings_page.invoice_customization', 'Personnalisation de la Facture')}</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '12px' }}>{t('settings_page.company_logo', "Logo de l'entreprise")}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{ width: '120px', height: '120px', borderRadius: '12px', border: '2px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-main)', overflow: 'hidden' }}>
                {logoUrl ? (
                  <LocalImage src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <ImageIcon size={32} color="var(--text-muted)" />
                )}
              </div>
              {userRole === 'owner' ? (
                <div>
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} />
                  <button type="button" onClick={() => fileInputRef.current.click()} style={{ padding: '10px 20px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Upload size={16} /> {t('settings_page.browse', 'Parcourir...')}
                  </button>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>{t('settings_page.logo_help', 'Format JPG ou PNG. Le logo apparaîtra sur toutes les factures.')}</p>
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Géré par le propriétaire</div>
              )}
            </div>
          </div>
          
          {userRole === 'owner' && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <button className="btn btn-primary" onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Save size={18} /> {t('settings_page.save', 'Sauvegarder')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Backup and Restore Panel */}
      <div style={{ backgroundColor: 'var(--bg-surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>
          Sécurité & Sauvegarde d'urgence
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '18px', lineHeight: '1.5' }}>
          Pour éviter de perdre vos ventes ou remboursements saisis hors-ligne avant d'avoir pu vous connecter au serveur, vous pouvez exporter un fichier de sauvegarde hautement chiffré de cet appareil. Vous pourrez le restaurer sur ce support ou un autre appareil (téléphone, tablette, PC) à tout moment.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <button 
            type="button" 
            onClick={handleExportBackup} 
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', fontWeight: 600 }}
          >
            Exporter sauvegarde chiffrée
          </button>
          
          <button 
            type="button" 
            onClick={() => backupFileInputRef.current.click()} 
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', fontWeight: 600 }}
          >
            Restaurer une sauvegarde
          </button>
          <input 
            type="file" 
            accept=".backup" 
            ref={backupFileInputRef} 
            onChange={handleImportBackup} 
            style={{ display: 'none' }} 
          />
        </div>
      </div>
    </div>
  );
}
