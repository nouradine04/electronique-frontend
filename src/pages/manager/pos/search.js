export function parsePosSearch(value) {
  const text = String(value || '').trim().replace(/\s+/g, ' ');
  const parts = text.split(' ');
  const last = parts.at(-1) || '';
  if (/^\d{4}$/.test(last)) return { productText: parts.slice(0, -1).join(' ').toLocaleLowerCase('fr'), imeiSuffix: last };
  return { productText: text.toLocaleLowerCase('fr'), imeiSuffix: '' };
}

export function matchesPosProduct(product, text) {
  if (!text) return true;
  return [product.name, product.sku, product.storageCapacity, product.color, product.simType]
    .filter(Boolean).join(' ').toLocaleLowerCase('fr').includes(text);
}

export function shortIdentifier(identifier, length = 4) {
  const value = String(identifier || '');
  return value.length > length ? `…${value.slice(-length)}` : value;
}
