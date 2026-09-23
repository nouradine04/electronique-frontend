import type { Database } from '@nozbe/watermelondb';

export async function acknowledgeVersions(database: Database, versions: Record<string, Record<string, number>>) {
  await database.write(async () => {
    const operations = [];
    for (const [table, entries] of Object.entries(versions)) {
      const collection = database.get(table === 'users' ? 'local_users' : table);
      for (const [id, version] of Object.entries(entries)) {
        const record = await collection.find(id).catch(() => null);
        if (!record || record._raw.version === version) continue;
        const status = record._raw._status;
        const changed = record._raw._changed;
        operations.push(record.prepareUpdate(item => {
          item._raw.version = version;
          item._raw._status = status;
          item._raw._changed = changed;
        }));
      }
    }
    if (operations.length) await database.batch(...operations);
  });
}
