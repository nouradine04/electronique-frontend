import { exportLocalBackup, restoreLocalBackup, encodeLocalBackup, decodeLocalBackup } from '../../../db/backup.js';

import { ShieldAlert, Download, Upload } from 'lucide-react';

export function LocalBackupPanel({  }) {
  return (
<div style={{ 
        marginTop: '32px', 
        backgroundColor: 'var(--bg-surface)', 
        borderRadius: 'var(--radius-lg)', 
        border: '1px solid var(--border-color)', 
        padding: '20px' 
      }}>
        <h2 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={18} color="#b30638" />
          Sécurité & Sauvegarde d'urgence
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 16px 0', lineHeight: 1.4 }}>
          Pour éviter de perdre vos ventes ou remboursements saisis hors-ligne avant d'avoir pu vous connecter au serveur, vous pouvez exporter un fichier de sauvegarde hautement chiffré de cet appareil. Vous pourrez le restaurer sur ce support ou un autre appareil (téléphone, tablette, PC) à tout moment.
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={async () => {
              try {
                const backupObj = await exportLocalBackup();
                
                const encryptedData = await encodeLocalBackup(backupObj);
                
                const blob = new Blob([encryptedData], { type: 'application/octet-stream' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `nstock_sauvegarde_${new Date().toISOString().split('T')[0]}.data`;
                a.click();
                URL.revokeObjectURL(url);
              } catch (e) {
                alert('Erreur lors de la création de la sauvegarde : ' + e.message);
              }
            }}
            style={{
              backgroundColor: 'var(--bg-main)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              padding: '10px 16px',
              borderRadius: 'var(--radius-md)',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--border-color)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--bg-main)'}
          >
            <Download size={14} /> Exporter sauvegarde chiffrée
          </button>
          
          <label
            style={{
              backgroundColor: 'var(--bg-main)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              padding: '10px 16px',
              borderRadius: 'var(--radius-md)',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--border-color)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--bg-main)'}
          >
            <Upload size={14} /> Restaurer un fichier
            <input
              type="file"
              accept=".data"
              onChange={(event) => {
                const file = event.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = async (e) => {
                  try {
                    const encryptedData = e.target.result;
                    const backupObj = await decodeLocalBackup(encryptedData);
                    
                    await restoreLocalBackup(backupObj);
                    
                    alert('Sauvegarde restaurée avec succès ! L\'application va s\'actualiser.');
                    window.location.reload();
                  } catch (err) {
                    alert('Fichier de sauvegarde invalide ou mot de passe incorrect : ' + err.message);
                  }
                };
                reader.readAsText(file);
              }}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>
  );
}
