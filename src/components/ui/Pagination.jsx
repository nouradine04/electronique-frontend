import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './pagination.css';

export function Pagination({ page, totalPages, totalItems, itemLabel = 'élément', onPageChange }) {
  if (totalPages <= 1) return null;
  const plural = totalItems > 1 ? `${itemLabel}s` : itemLabel;
  return <nav className="ui-pagination" aria-label="Pagination">
    <span>{totalItems} {plural}</span>
    <div>
      <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Page précédente"><ChevronLeft size={17} /></button>
      <strong><span className="ui-page-long">Page </span>{page} / {totalPages}</strong>
      <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} aria-label="Page suivante"><ChevronRight size={17} /></button>
    </div>
  </nav>;
}
