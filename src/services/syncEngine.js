import { prepareReceivedUnits } from './productUnits';
import { prepareOperation } from './operationQueue';
import database from '../db/watermelondb.js';
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
  identifiers = '',
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

    if (shop_id && product.shopId !== shop_id) throw new Error('Produit d’une autre boutique.');
    const previousQuantity = Number(product.quantity || 0);
    newQuantity = previousQuantity;
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

    if (newQuantity === previousQuantity) return;
    if (product.trackingMode !== 'QUANTITY' && type !== 'IN') throw new Error('Pour un appareil identifié, utilisez la vente ou le retour de l’unité concernée.');
    const units = await prepareReceivedUnits(database, product, identifiers, quantity);
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
      m.type = type === 'ADJUST' ? (newQuantity > previousQuantity ? 'IN' : 'OUT') : type;
      m.quantity = type === 'ADJUST' ? Math.abs(newQuantity - previousQuantity) : quantity;
      m.reason = reason || (type === 'ADJUST' ? 'Correction d’inventaire' : 'Mouvement manuel');
      m.userName = user_name || 'Opérateur';
      m.date = new Date().toISOString();
      m.supplierName = supplier_name || '';
      m.deliveryReference = delivery_reference || '';
      m.unitCost = unit_cost || 0;
      m.synced = false;
    });
    const journal = await prepareOperation(database, product.shopId, [update, movement, ...units], { kind: 'stock', stock_before: previousQuantity });
    await database.batch(update, movement, ...units, ...journal);
  });

  return newQuantity;
}
