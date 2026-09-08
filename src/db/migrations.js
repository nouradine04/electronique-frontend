import { schemaMigrations, createTable, addColumns } from '@nozbe/watermelondb/Schema/migrations';
import {
  localUserV3Schema,
  localUserAccountColumns,
  shopSubscriptionColumns,
  shopAccountColumns,
  productCatalogColumns,
  stockMovementDeliveryColumns,
  saleAccountingColumns,
  returnSchema,
  expenseSchema,
} from './schema.js';

export default schemaMigrations({
  migrations: [
    { toVersion: 3, steps: [createTable(localUserV3Schema)] },
    {
      toVersion: 4,
      steps: [
        addColumns({ table: 'local_users', columns: localUserAccountColumns }),
        addColumns({ table: 'shops', columns: shopSubscriptionColumns }),
      ],
    },
    { toVersion: 5, steps: [addColumns({ table: 'shops', columns: shopAccountColumns })] },
    {
      toVersion: 6,
      steps: [
        addColumns({ table: 'products', columns: productCatalogColumns }),
        addColumns({ table: 'stock_movements', columns: stockMovementDeliveryColumns }),
      ],
    },
    {
      toVersion: 7,
      steps: [
        addColumns({ table: 'sales', columns: saleAccountingColumns }),
        createTable(returnSchema),
        createTable(expenseSchema),
      ],
    },
  ],
});
