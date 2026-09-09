import { useEffect, useState } from 'react';

// Presentation pagination. The caller retains the full dataset for totals.
export function usePagination(items, resetKey, pageSize = 12) {
  const [requestedPage, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(requestedPage, totalPages);
  useEffect(() => setPage(1), [resetKey]);
  useEffect(() => { if (requestedPage > totalPages) setPage(totalPages); }, [requestedPage, totalPages]);
  return { items: items.slice((page - 1) * pageSize, page * pageSize), props: { page, totalPages, totalItems: items.length, onPageChange: setPage } };
}
