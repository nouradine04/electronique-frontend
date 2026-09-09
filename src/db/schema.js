import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const localUserV3Schema = {
  name: 'local_users',
  columns: [
    { name: 'shop_id', type: 'string', isIndexed: true },
    { name: 'name', type: 'string' },
    { name: 'email', type: 'string', isIndexed: true },
    { name: 'role', type: 'string' },
    { name: 'password_hash', type: 'string' },
    { name: 'password_salt', type: 'string' },
  ],
};

export const localUserAccountColumns = [
  { name: 'is_active', type: 'boolean', isOptional: true },
  { name: 'account_created_at', type: 'string', isOptional: true },
];
export const localUserPhoneColumns = [
  { name: 'phone', type: 'string', isIndexed: true, isOptional: true },
];

export const shopSubscriptionColumns = [
  { name: 'subscription_plan', type: 'string', isOptional: true },
];

export const shopAccountColumns = [
  { name: 'account_id', type: 'string', isIndexed: true, isOptional: true },
];

export const productCatalogColumns = [
  { name: 'unit_cost', type: 'number', isOptional: true },
  { name: 'catalog_id', type: 'string', isOptional: true },
  { name: 'catalog_source', type: 'string', isOptional: true },
  { name: 'brand', type: 'string', isOptional: true },
  { name: 'model', type: 'string', isOptional: true },
  { name: 'ram', type: 'string', isOptional: true },
  { name: 'storage_capacity', type: 'string', isOptional: true },
  { name: 'color', type: 'string', isOptional: true },
  { name: 'sim_type', type: 'string', isOptional: true },
  { name: 'network', type: 'string', isOptional: true },
  { name: 'battery', type: 'string', isOptional: true },
  { name: 'screen', type: 'string', isOptional: true },
  { name: 'operating_system', type: 'string', isOptional: true },
  { name: 'release_date', type: 'string', isOptional: true },
  { name: 'specs_json', type: 'string', isOptional: true },
  { name: 'added_by', type: 'string', isOptional: true },
  { name: 'added_at', type: 'string', isOptional: true },
];

export const stockMovementDeliveryColumns = [
  { name: 'supplier_name', type: 'string', isOptional: true },
  { name: 'delivery_reference', type: 'string', isOptional: true },
  { name: 'unit_cost', type: 'number', isOptional: true },
];

export const saleAccountingColumns = [
  { name: 'unit_cost', type: 'number', isOptional: true },
  { name: 'returned_quantity', type: 'number', isOptional: true },
  { name: 'refunded_amount', type: 'number', isOptional: true },
];

export const returnSchema = {
  name: 'returns',
  columns: [
    { name: 'shop_id', type: 'string', isIndexed: true },
    { name: 'sale_id', type: 'string', isIndexed: true },
    { name: 'product_id', type: 'string', isIndexed: true },
    { name: 'client_id', type: 'string', isIndexed: true, isOptional: true },
    { name: 'quantity', type: 'number' },
    { name: 'reason', type: 'string' },
    { name: 'resolution', type: 'string' },
    { name: 'restock', type: 'boolean' },
    { name: 'refund_amount', type: 'number' },
    { name: 'processed_by', type: 'string', isOptional: true },
    { name: 'date', type: 'string' },
    { name: 'synced', type: 'boolean' },
  ],
};

export const expenseSchema = {
  name: 'expenses',
  columns: [
    { name: 'shop_id', type: 'string', isIndexed: true },
    { name: 'category', type: 'string' },
    { name: 'description', type: 'string' },
    { name: 'amount', type: 'number' },
    { name: 'date', type: 'string' },
    { name: 'recurrence', type: 'string', isOptional: true },
    { name: 'employee_name', type: 'string', isOptional: true },
    { name: 'created_by', type: 'string', isOptional: true },
    { name: 'synced', type: 'boolean' },
  ],
};

export const localUserSchema = {
  ...localUserV3Schema,
  columns: [...localUserV3Schema.columns, ...localUserAccountColumns, ...localUserPhoneColumns],
};

export default appSchema({
  version: 8,
  tables: [
    tableSchema(localUserSchema),
    tableSchema({
      name: 'shops',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'address', type: 'string', isOptional: true },
        { name: 'phone', type: 'string', isOptional: true },
        { name: 'nif', type: 'string', isOptional: true },
        { name: 'email', type: 'string', isOptional: true },
        { name: 'logo_url', type: 'string', isOptional: true },
        { name: 'code', type: 'string', isOptional: true },
        { name: 'subscription_plan', type: 'string', isOptional: true },
        { name: 'account_id', type: 'string', isIndexed: true, isOptional: true },
        { name: 'synced', type: 'boolean' }
      ]
    }),
    tableSchema({
      name: 'categories',
      columns: [
        { name: 'shop_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'synced', type: 'boolean' }
      ]
    }),
    tableSchema({
      name: 'products',
      columns: [
        { name: 'shop_id', type: 'string', isIndexed: true },
        { name: 'category_id', type: 'string', isIndexed: true, isOptional: true },
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'sku', type: 'string', isOptional: true },
        { name: 'price', type: 'number' },
        { name: 'quantity', type: 'number' },
        { name: 'min_stock', type: 'number' },
        { name: 'status', type: 'string' },
        { name: 'image_url', type: 'string', isOptional: true },
        { name: 'location', type: 'string', isOptional: true },
        ...productCatalogColumns,
        { name: 'synced', type: 'boolean' }
      ]
    }),
    tableSchema({
      name: 'sales',
      columns: [
        { name: 'shop_id', type: 'string', isIndexed: true },
        { name: 'product_id', type: 'string', isIndexed: true },
        { name: 'client_id', type: 'string', isIndexed: true, isOptional: true },
        { name: 'quantity', type: 'number' },
        { name: 'total_price', type: 'number' },
        { name: 'payment_method', type: 'string' },
        { name: 'date', type: 'string' },
        { name: 'seller_name', type: 'string', isOptional: true },
        { name: 'seller_role', type: 'string', isOptional: true },
        ...saleAccountingColumns,
        { name: 'synced', type: 'boolean' }
      ]
    }),
    tableSchema(returnSchema),
    tableSchema(expenseSchema),
    tableSchema({
      name: 'payments',
      columns: [
        { name: 'shop_id', type: 'string', isIndexed: true },
        { name: 'client_id', type: 'string', isIndexed: true },
        { name: 'amount', type: 'number' },
        { name: 'date', type: 'string' },
        { name: 'synced', type: 'boolean' }
      ]
    }),
    tableSchema({
      name: 'clients',
      columns: [
        { name: 'shop_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'phone', type: 'string', isOptional: true },
        { name: 'email', type: 'string', isOptional: true },
        { name: 'synced', type: 'boolean' }
      ]
    }),
    tableSchema({
      name: 'stock_movements',
      columns: [
        { name: 'product_id', type: 'string', isIndexed: true },
        { name: 'shop_id', type: 'string', isIndexed: true },
        { name: 'type', type: 'string' },
        { name: 'quantity', type: 'number' },
        { name: 'reason', type: 'string', isOptional: true },
        { name: 'user_name', type: 'string', isOptional: true },
        { name: 'date', type: 'string' },
        ...stockMovementDeliveryColumns,
        { name: 'synced', type: 'boolean' }
      ]
    }),
    tableSchema({
      name: 'invoices',
      columns: [
        { name: 'shop_id', type: 'string', isIndexed: true },
        { name: 'client_id', type: 'string', isIndexed: true, isOptional: true },
        { name: 'client_name', type: 'string', isOptional: true },
        { name: 'amount', type: 'number' },
        { name: 'status', type: 'string' },
        { name: 'date_emission', type: 'string' },
        { name: 'date_echeance', type: 'string', isOptional: true },
        { name: 'items_json', type: 'string', isOptional: true },
        { name: 'synced', type: 'boolean' }
      ]
    })
  ]
});
