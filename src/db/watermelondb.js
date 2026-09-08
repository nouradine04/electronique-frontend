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

const LokiJSAdapter = RawLokiJSAdapter.default || RawLokiJSAdapter;

const adapter = new LokiJSAdapter({
  schema,
  migrations,
  useWebWorker: false,
  useIncrementalIndexedDB: true,
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
