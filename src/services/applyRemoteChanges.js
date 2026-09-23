import database, { flushLocalDatabase } from '../db/watermelondb.js';
import { createRemoteChangesApplier } from './remoteChanges.js';

export const applyRemoteChanges = createRemoteChangesApplier(database, flushLocalDatabase);
