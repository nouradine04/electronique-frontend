type SyncFailure = {
  status?: number;
  message?: string;
  details?: {
    code?: string;
    table?: string;
    issues?: Array<{ message?: string }>;
  };
};

export function describeSyncFailure(error: unknown, operationId: string) {
  const failure = (error && typeof error === 'object' ? error : {}) as SyncFailure;
  const issue = failure.details?.issues?.[0]?.message || '';
  const field = /^[a-z_]+(?=\s*:)/.exec(issue)?.[0] || '';
  return {
    operationId,
    status: failure.status || 0,
    code: failure.details?.code || 'SYNC_REQUEST_FAILED',
    table: failure.details?.table || '',
    field,
  };
}

export function syncFailureMessage(diagnostic: ReturnType<typeof describeSyncFailure>) {
  if (diagnostic.code === 'SYNC_VALIDATION' && diagnostic.field === 'unit_cost') {
    return 'Coût d’achat manquant dans une opération de stock.';
  }
  if (diagnostic.status === 403) return 'Action non autorisée pour ce compte.';
  if (diagnostic.status === 409) return 'Conflit avec une autre modification.';
  if (diagnostic.status === 400) return 'Certaines informations de cette opération sont invalides.';
  return 'Envoi interrompu. Une nouvelle tentative sera effectuée.';
}
