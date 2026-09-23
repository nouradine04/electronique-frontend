import { ProductUnit, UnitEvent } from './models/ProductUnit';
/**
 * WatermelonDB — Base de données locale offline-first
 *
 * LokiJS adapter pour le web/PWA :
 * - Les données sont stockées en mémoire + persistées dans IndexedDB automatiquement
 * - Offline : toutes les écritures sont locales (synced = false)
 * - Online : synchronize() pousse les données vers NestJS et tire les mises à jour
 */
import { Database } from '@nozbe/watermelondb';
import RawLokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';

import schema from './schema';
import migrations from './migrations.js';
import { SyncOperation, SyncOperationLink } from './models/SyncOperation';
import LocalUser from './models/LocalUser.js';
import Shop from './models/Shop';
import Category from './models/Category';
import Product from './models/Product';
import Sale from './models/Sale';
import Payment from './models/Payment';
import Client from './models/Client';
import StockMovement from './models/StockMovement';
import Invoice from './models/Invoice';
import ReturnRecord from './models/ReturnRecord';
import Expense from './models/Expense';
import { installLocalIdGenerator } from './localId';
import { assertSessionWritable } from '../services/session';

installLocalIdGenerator();

const LokiJSAdapter = RawLokiJSAdapter.default || RawLokiJSAdapter;
const isTauriRuntime = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

class VolatileLokiAdapter {
  constructor() { this.store = new Map(); }
  loadDatabase(name, callback) { callback(this.store.get(name) || null); }
  saveDatabase(name, value, callback) { this.store.set(name, value); callback(); }
  deleteDatabase(name, callback) { this.store.delete(name); callback?.(); }
}

const memoryAdapter = isTauriRuntime ? new VolatileLokiAdapter() : undefined;

const adapter = new LokiJSAdapter({
  schema,
  migrations,
  useWebWorker: false,
  useIncrementalIndexedDB: true,
  // Dans Tauri, SQLCipher est l'unique stockage durable. Loki reste en mémoire
  // comme modèle réactif pour l'interface et est restauré depuis le coffre.
  ...(memoryAdapter ? { _testLokiAdapter: memoryAdapter } : {}),
  dbName: 'nstock_v2',
  onQuotaExceededError: (error) => {
    console.error('Storage quota exceeded:', error);
  },
  onSetUpError: (error) => {
    console.error('WatermelonDB setup error:', error);
  }
});

export const database = new Database({
  adapter,
  modelClasses: [
    SyncOperation, SyncOperationLink, ProductUnit, UnitEvent,
    LocalUser,
    Shop,
    Category,
    Product,
    Sale,
    Payment,
    Client,
    StockMovement,
    Invoice,
    ReturnRecord,
    Expense,
  ],
});

let mutationRevision = 0;
database.experimentalSubscribe(Object.keys(schema.tables), () => { mutationRevision += 1; });
const write = database.write.bind(database);
database.write = (work, description) => write(async writer => {
  if (description !== 'session-restore') assertSessionWritable();
  const revision = mutationRevision;
  const result = await work(writer);
  // Do not report a successful write while it exists only in Loki memory.
  if (mutationRevision !== revision) {
    if (!isTauriRuntime) await flushLocalDatabase();
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('nstock:local-write'));
  }
  return result;
}, description);

/** Force l'écriture IndexedDB après une opération critique comme l'inscription. */
let saveQueue = Promise.resolve();

export function flushLocalDatabase() {
  const save = () => new Promise((resolve, reject) => {
    database.adapter.unsafeExecute({
      loki: loki => {
        loki.saveDatabase(error => error ? reject(error) : resolve());
      },
    }).catch(reject);
  });
  saveQueue = saveQueue.catch(() => undefined).then(save);
  return saveQueue;
}

// L'adaptateur IndexedDB incrémental charge les collections à la demande. Après
// une migration de schéma, son premier autosave peut sinon tenter de relire un
// chunk déjà libéré de la mémoire. Hydrater les collections une seule fois au
// démarrage conserve les données existantes et stabilise les sauvegardes.
if (typeof window !== 'undefined') {
  database.adapter.unsafeExecute({
    loki: (loki) => {
      loki.collections.forEach(collection => {
        void collection.data;
      });
    },
  }).catch(error => {
    console.error('WatermelonDB hydration error:', error);
  });
}

export default database;
