import { ChevronLeft, ChevronRight } from 'lucide-react';

export function CatalogPagination({ page, totalPages, pageSize, onPageChange, onPageSizeChange }) {
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, index) => start + index);

  return <nav className="catalog-pagination" aria-label="Pagination des produits">
    <label className="catalog-page-size">Afficher
      <select value={pageSize} onChange={event => onPageSizeChange(Number(event.target.value))}>
        <option value={8}>8</option>
        <option value={12}>12</option>
        <option value={24}>24</option>
      </select>
      par page
    </label>
    <div className="catalog-pagination-pages">
      <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Page précédente"><ChevronLeft size={15} /> Précédent</button>
      {pages.map(number => <button
        key={number}
        type="button"
        aria-label={`Page ${number}`}
        aria-current={number === page ? 'page' : undefined}
        onClick={() => onPageChange(number)}
      >{number}</button>)}
      <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} aria-label="Page suivante">Suivant <ChevronRight size={15} /></button>
    </div>
  </nav>;
}
