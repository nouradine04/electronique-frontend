function remoteRecord(row) {
  const record = { ...row };
  for (const [name, value] of Object.entries(row)) {
    if (name.includes('_')) record[name.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())] = value;
  }
  return record;
}

export function combineHybridRows(localRows, remoteRows, useRemote) {
  if (!useRemote) return localRows;
  const byId = new Map(remoteRows.map(row => [row.id, remoteRecord(row)]));
  for (const local of localRows) {
    const status = local?._raw?._status;
    if (status === 'deleted') byId.delete(local.id);
    else if (status === 'created' || status === 'updated') byId.set(local.id, local);
  }
  return [...byId.values()];
}

export function hybridFailureMode(error) {
  if (error?.name === 'NetworkError' || error?.status >= 500) return 'fallback';
  return 'error';
}
