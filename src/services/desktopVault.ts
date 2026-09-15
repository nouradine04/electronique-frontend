import { invoke } from '@tauri-apps/api/core';

export type DesktopRecord = {
  collection: string;
  id: string;
  tenantId: string;
  shopId?: string | null;
  payload: Record<string, unknown>;
  updatedAt: string;
  deletedAt?: string | null;
  syncStatus?: 'pending' | 'synced' | 'error';
};

export const isTauriDesktop = () => '__TAURI_INTERNALS__' in window;

export const openDesktopVault = (account: string, passphrase: string) =>
  invoke<void>('desktop_vault_open', { account, passphrase });

export const closeDesktopVault = () => invoke<void>('desktop_vault_close');

export const upsertDesktopRecord = (record: DesktopRecord) =>
  invoke<void>('desktop_vault_upsert', { record });

export const queryDesktopRecords = (input: {
  collection: string;
  tenantId: string;
  shopId?: string | null;
  updatedAfter?: string | null;
  limit?: number;
}) => invoke<DesktopRecord[]>('desktop_vault_query', input);

export const getDesktopVaultSnapshot = (offset = 0, limit = 500) =>
  invoke<DesktopRecord[]>('desktop_vault_snapshot', { offset, limit });

export const getDesktopVaultStatus = (tenantId: string) =>
  invoke<{ opened: boolean; pendingChanges: number; lastPulledAt?: string | null }>('desktop_vault_status', { tenantId });
