import { updateProduct } from '../db/queries.js';
import { saveLocalImage, uploadImageFile } from './localMedia.js';

/** Called only after the product write succeeds; cancelling a form never uploads a photo. */
export async function attachProductPhotoAfterSave(product, file, shopId) {
  if (!file) return '';
  let reference;
  if (navigator.onLine && shopId) {
    try { reference = await uploadImageFile(file, shopId); }
    catch { /* Preserve the photo locally when the server is unavailable. */ }
  }
  if (!reference) {
    try { reference = await saveLocalImage(file); }
    catch { return 'Produit enregistré sans photo : impossible de conserver l’image sur cet appareil. Réessayez depuis sa fiche.'; }
  }
  try { await updateProduct(product, { image_url: reference }); }
  catch { return 'Produit enregistré, mais sa photo n’a pas pu être associée. Réessayez depuis sa fiche.'; }
  return reference.startsWith('local-media://') ? 'Produit enregistré. La photo sera envoyée dès que le serveur sera accessible.' : '';
}
