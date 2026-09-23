export type SyncEntityChange<T> = {
  created: T[];
  updated: T[];
  deleted: string[];
};

export type SyncChanges = Record<string, SyncEntityChange<unknown>>;

export interface PullChangesResponse {
  changes: SyncChanges;
  timestamp: number;
  has_more: boolean;
  next_cursor: string | null;
  limit: number;
  initial_history_days: number;
}

export interface PushChangesResponse {
  status: 'ok';
  processed: number;
  has_more: boolean;
  next_cursor: string | null;
  timestamp?: number;
  rejected_ids?: Record<string, string[]>;
  conflicts?: { table: string; id: string; reason: 'version_conflict' | 'pending_dependency' | 'validation_error'; message?: string }[];
  versions?: Record<string, Record<string, number>>;
}
