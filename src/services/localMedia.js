/**
 * Prépare une image compacte avant de l'enregistrer dans une colonne WatermelonDB.
 * Aucun stockage navigateur séparé n'est utilisé ici : la valeur retournée est une
 * data URL WebP qui suit le produit ou la boutique dans les sauvegardes et la sync.
 */

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Ce fichier image ne peut pas être lu.'));
    };
    image.src = url;
  });
}

async function compressImage(file, maxDimension = 1024, quality = 0.78) {
  const image = await loadImage(file);
  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('La compression des images est indisponible sur cet appareil.');
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL('image/webp', quality);
}

export async function saveLocalImage(file, options = {}) {
  if (!file?.type?.startsWith('image/')) throw new Error('Choisissez un fichier image valide.');
  if (file.size > 15 * 1024 * 1024) throw new Error('L’image ne doit pas dépasser 15 Mo.');
  return compressImage(file, options.maxDimension, options.quality);
}

export const isLocalMediaReference = () => false;

export async function resolveLocalImage(value) {
  return value || '';
}
