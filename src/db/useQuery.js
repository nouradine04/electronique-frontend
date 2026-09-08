import { useEffect, useMemo, useState } from 'react';

// Query helpers are called during render, so stabilize equivalent queries.
// Observe columns too: stock/price edits must refresh lists and totals.
export function useQuery(query) {
  const collection = query?.collection;
  const key = query ? JSON.stringify(query.description) : '';
  const stableQuery = useMemo(() => query, [collection, key]);
  const [result, setResult] = useState({ query: null, records: [], error: null });

  useEffect(() => {
    if (!stableQuery) return;
    const columns = Object.keys(stableQuery.collection.schema.columns);
    const subscription = stableQuery.observeWithColumns(columns).subscribe({
      next: records => setResult({ query: stableQuery, records: [...records], error: null }),
      error: error => setResult({ query: stableQuery, records: [], error }),
    });
    return () => subscription.unsubscribe();
  }, [stableQuery]);

  if (result.query !== stableQuery) return [];
  if (result.error) throw result.error;
  return result.records;
}
