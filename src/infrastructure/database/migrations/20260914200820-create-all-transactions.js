import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface) {
  await queryInterface.createTable('all_transactions', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },

    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },

    transaction_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    month: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    account_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'accounts',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },

    payment_method: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    transaction_type_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'transaction_types',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },

    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },

    remarks: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  await queryInterface.addIndex(
    'all_transactions',
    ['user_id'],
  );

  await queryInterface.addIndex(
    'all_transactions',
    ['user_id', 'transaction_date'],
  );

  await queryInterface.addIndex(
    'all_transactions',
    ['user_id', 'account_id'],
  );

  await queryInterface.addIndex(
    'all_transactions',
    ['user_id', 'transaction_type_id'],
  );
}

export async function down(queryInterface) {
  await queryInterface.dropTable('all_transactions');
}