const OFFLINE_HISTORY_DAYS = 30;

export function visibleSaleHistory(localSales, serverSales, online, serverReady, now = Date.now()) {
  const byId = new Map();
  if (online && serverReady) {
    const localById = new Map(localSales.map(sale => [sale.id, sale]));
    for (const sale of serverSales) {
      const local = localById.get(sale.id);
      byId.set(sale.id, local ? { ...sale, localRecord: local, remoteOnly: false } : sale);
    }
    for (const local of localSales) {
      const status = local?._raw?._status;
      if (status === 'deleted') byId.delete(local.id);
      else if (status === 'created' || status === 'updated') byId.set(local.id, local);
    }
  } else {
    for (const sale of localSales) byId.set(sale.id, sale);
  }
  const cutoff = now - OFFLINE_HISTORY_DAYS * 24 * 60 * 60 * 1000;
  return [...byId.values()]
    .filter(sale => online || new Date(sale.date).getTime() >= cutoff)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}
