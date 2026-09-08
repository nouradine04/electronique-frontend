import { Model } from '@nozbe/watermelondb';

export default class Product extends Model {
  static table = 'products';

  get shopId() { return this._getRaw('shop_id'); }
  set shopId(val) { this._setRaw('shop_id', val); }

  get categoryId() { return this._getRaw('category_id'); }
  set categoryId(val) { this._setRaw('category_id', val); }

  get name() { return this._getRaw('name'); }
  set name(val) { this._setRaw('name', val); }

  get description() { return this._getRaw('description'); }
  set description(val) { this._setRaw('description', val); }

  get sku() { return this._getRaw('sku'); }
  set sku(val) { this._setRaw('sku', val); }

  get price() { return this._getRaw('price'); }
  set price(val) { this._setRaw('price', val); }

  get quantity() { return this._getRaw('quantity'); }
  set quantity(val) { this._setRaw('quantity', val); }

  get minStock() { return this._getRaw('min_stock'); }
  set minStock(val) { this._setRaw('min_stock', val); }

  get status() { return this._getRaw('status'); }
  set status(val) { this._setRaw('status', val); }

  get imageUrl() { return this._getRaw('image_url'); }
  set imageUrl(val) { this._setRaw('image_url', val); }

  get location() { return this._getRaw('location'); }
  set location(val) { this._setRaw('location', val); }

  get unitCost() { return Number(this._getRaw('unit_cost')) || 0; }
  set unitCost(val) { this._setRaw('unit_cost', Number(val) || 0); }

  get catalogId() { return this._getRaw('catalog_id'); }
  set catalogId(val) { this._setRaw('catalog_id', val); }

  get catalogSource() { return this._getRaw('catalog_source'); }
  set catalogSource(val) { this._setRaw('catalog_source', val); }

  get brand() { return this._getRaw('brand'); }
  set brand(val) { this._setRaw('brand', val); }

  get model() { return this._getRaw('model'); }
  set model(val) { this._setRaw('model', val); }

  get ram() { return this._getRaw('ram'); }
  set ram(val) { this._setRaw('ram', val); }

  get storageCapacity() { return this._getRaw('storage_capacity'); }
  set storageCapacity(val) { this._setRaw('storage_capacity', val); }

  get color() { return this._getRaw('color'); }
  set color(val) { this._setRaw('color', val); }

  get simType() { return this._getRaw('sim_type'); }
  set simType(val) { this._setRaw('sim_type', val); }

  get network() { return this._getRaw('network'); }
  set network(val) { this._setRaw('network', val); }

  get battery() { return this._getRaw('battery'); }
  set battery(val) { this._setRaw('battery', val); }

  get screen() { return this._getRaw('screen'); }
  set screen(val) { this._setRaw('screen', val); }

  get operatingSystem() { return this._getRaw('operating_system'); }
  set operatingSystem(val) { this._setRaw('operating_system', val); }

  get releaseDate() { return this._getRaw('release_date'); }
  set releaseDate(val) { this._setRaw('release_date', val); }

  get specsJson() { return this._getRaw('specs_json'); }
  set specsJson(val) { this._setRaw('specs_json', val); }

  get addedBy() { return this._getRaw('added_by'); }
  set addedBy(val) { this._setRaw('added_by', val); }

  get addedAt() { return this._getRaw('added_at'); }
  set addedAt(val) { this._setRaw('added_at', val); }

  get synced() { return this._getRaw('synced'); }
  set synced(val) { this._setRaw('synced', val); }

  // Compatibilité des vues utilisant les noms de colonnes.
  get shop_id() { return this.shopId; }
  get category_id() { return this.categoryId; }
  get min_stock() { return this.minStock; }
  get image_url() { return this.imageUrl; }
  get unit_cost() { return this.unitCost; }
  get catalog_id() { return this.catalogId; }
  get catalog_source() { return this.catalogSource; }
  get storage_capacity() { return this.storageCapacity; }
  get sim_type() { return this.simType; }
  get operating_system() { return this.operatingSystem; }
  get release_date() { return this.releaseDate; }
  get specs_json() { return this.specsJson; }
  get added_by() { return this.addedBy; }
  get added_at() { return this.addedAt; }
}
