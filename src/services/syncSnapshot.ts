// Models remain live for media updates and acknowledgement. Serialization must
// read the captured raw values, never a later checkout's stock from a live model.
export function snapshotBatch(batch: any) {
  const view = { ...batch, changeStates: { ...batch.changeStates } };
  for (const [key, state] of Object.entries(batch.changeStates) as [string, any][]) {
    const table = key === 'users' ? 'local_users' : key === 'stockMovements' ? 'stock_movements' : key;
    const snapshot = batch.syncSnapshot.changes[table];
    const raws = new Map([...snapshot.created, ...snapshot.updated].map(row => [row.id, row]));
    const capture = (record: any) => new Proxy(record, { get(target, property, receiver) {
      return property === '_raw' ? raws.get(record.id) : Reflect.get(target, property, receiver);
    } });
    view[key] = batch[key].map(capture);
    view.changeStates[key] = { ...state, created: state.created.map(capture), updated: state.updated.map(capture) };
  }
  return view;
}
