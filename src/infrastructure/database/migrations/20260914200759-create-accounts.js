import { DataTypes } from "sequelize";

export async function up(queryInterface) {
  await queryInterface.createTable("accounts", {
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
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },

    account_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    bank: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    account_number: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    customer_number: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    ifsc: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    type: {
      type: DataTypes.ENUM("current", "saving"),
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM("active", "inactive", "closed"),
      allowNull: false,
      defaultValue: "active",
    },

    current_balance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },

    opening_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    closing_date: {
      type: DataTypes.DATEONLY,
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

  await queryInterface.addIndex("accounts", ["user_id"]);

  await queryInterface.addIndex("accounts", ["user_id", "status"]);
}

export async function down(queryInterface) {
  await queryInterface.dropTable("accounts");

  // PostgreSQL enum cleanup
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_accounts_type";');

  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_accounts_status";');
}
