import database from '../db/watermelondb.js';
import { BACKEND_URL, LOCAL_ONLY } from '../context/backendConfig.js';

export async function checkServerHealth() {
  if (LOCAL_ONLY) return false;
  try {
    const res = await fetch(`${BACKEND_URL}/sync/pull?lastPulledAt=0`, { method: 'GET' });
    return res.ok;
  } catch (error) {
    return false;
  }
}

export async function recordStockMovement({
  shop_id,
  product_id,
  product_name,
  type, // 'IN' | 'OUT' | 'ADJUST'
  quantity,
  reason,
  user_name,
  supplier_name,
  delivery_reference,
  unit_cost,
}) {
  const productsCollection = database.get('products');
  quantity = Number(quantity);
  if (!['IN', 'OUT', 'ADJUST'].includes(type) || !Number.isInteger(quantity) || quantity < 0 || (type !== 'ADJUST' && quantity === 0)) {
    throw new Error('Le mouvement doit avoir une quantité entière valide.');
  }
  
  let newQuantity = 0;

  await database.write(async () => {
    const product = await productsCollection.find(product_id);
    if (!product) {
      throw new Error('Produit introuvable.');
    }

    newQuantity = Number(product.quantity || 0);
    if (type === 'IN') {
      newQuantity += Number(quantity);
    } else if (type === 'OUT') {
      if (newQuantity < quantity) {
        throw new Error(`Stock insuffisant ! Stock disponible: ${newQuantity}`);
      }
      newQuantity -= Number(quantity);
    } else if (type === 'ADJUST') {
      newQuantity = Number(quantity);
    }

    const update = product.prepareUpdate(p => {
      p.quantity = newQuantity;
      if (type === 'IN' && Number(unit_cost) > 0) {
        p.unitCost = Number(unit_cost);
      }
      p.synced = false;
    });

    const movement = database.get('stock_movements').prepareCreate(m => {
      m.shopId = shop_id || product.shopId;
      m.productId = product_id;
      m.type = type;
      m.quantity = quantity;
      m.reason = reason || 'Mouvement manuel';
      m.userName = user_name || 'Opérateur';
      m.date = new Date().toISOString();
      m.supplierName = supplier_name || '';
      m.deliveryReference = delivery_reference || '';
      m.unitCost = unit_cost || 0;
      m.synced = false;
    });
    await database.batch(update, movement);
  });

  return newQuantity;
}
