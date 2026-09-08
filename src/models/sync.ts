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
}

export interface PushChangesResponse {
  status: 'ok';
  processed: number;
  has_more: boolean;
  next_cursor: string | null;
  timestamp?: number;
}
