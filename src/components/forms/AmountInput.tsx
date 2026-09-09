import React, { useLayoutEffect, useRef } from 'react';

export function AmountInput({ name, value, onChange, label }: { name: string; value: string | number; onChange: (event: { target: { name: string; value: string; type: string } }) => void; label: string }) {
  const input = useRef<HTMLInputElement>(null);
  const caret = useRef<number | null>(null);
  const formatted = String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  useLayoutEffect(() => {
    if (caret.current === null || !input.current) return;
    let digits = 0, position = 0;
    while (position < formatted.length && digits < caret.current) {
      if (/\d/.test(formatted[position])) digits++;
      position++;
    }
    input.current.setSelectionRange(position, position);
    caret.current = null;
  });
  return <div className="amount-input"><input ref={input} id={`product-${name}`} aria-label={label} name={name} type="text" inputMode="numeric" autoComplete="off" placeholder="0" value={formatted} onChange={event => {
    const raw = event.target.value;
    if (!/^[\d\s.,]*$/.test(raw)) return;
    const normalized = raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
    if (normalized.length > 12) return;
    const before = raw.slice(0, event.target.selectionStart ?? raw.length).replace(/\D/g, '');
    caret.current = Math.max(0, before.length - (raw.replace(/\D/g, '').length - normalized.length));
    onChange({ target: { name, value: normalized, type: 'text' } });
  }} /><span>FCFA</span></div>;
}
