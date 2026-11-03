import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Extends `all_transactions` for the Option A single-ledger model:
 *   - category_id       FK -> categories      (nullable)
 *   - subcategory_id    FK -> subcategories   (nullable)
 *   - source_id         FK -> sources         (nullable; income rows only)
 *   - payment_method_id FK -> payment_methods (nullable; replaces the legacy
 *                       free-text `payment_method` column, which is kept for
 *                       backward compatibility until a later backfill/drop)
 */
export async function up(queryInterface) {
  await queryInterface.addColumn('all_transactions', 'category_id', {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'categories',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });

  await queryInterface.addColumn('all_transactions', 'subcategory_id', {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'subcategories',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });

  await queryInterface.addColumn('all_transactions', 'source_id', {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'sources',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });

  await queryInterface.addColumn('all_transactions', 'payment_method_id', {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'payment_methods',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });

  await queryInterface.addIndex('all_transactions', ['category_id']);
  await queryInterface.addIndex('all_transactions', ['subcategory_id']);
  await queryInterface.addIndex('all_transactions', ['source_id']);
  await queryInterface.addIndex('all_transactions', ['payment_method_id']);
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('all_transactions', 'payment_method_id');
  await queryInterface.removeColumn('all_transactions', 'source_id');
  await queryInterface.removeColumn('all_transactions', 'subcategory_id');
  await queryInterface.removeColumn('all_transactions', 'category_id');
}
