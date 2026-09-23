export const variantLabel = product => [product.storageCapacity || product.storage_capacity, product.ram && `${product.ram} RAM`, product.color, product.simType || product.sim_type].filter(Boolean).join(' · ');

export const BRAND = '#0e6ba8';
