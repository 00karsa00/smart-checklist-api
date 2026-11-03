import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface) {
  await queryInterface.createTable("borrow_lend", {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },

    reference_code: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    transaction_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    person_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "people",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },

    borrow_lend_type_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "borrow_lend_types",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },

    payment_method_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "payment_methods",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },

    account_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "accounts",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },

    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
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

  await queryInterface.addIndex("borrow_lend", ["user_id"]);

  await queryInterface.addIndex("borrow_lend", ["user_id", "transaction_date"]);

  await queryInterface.addIndex("borrow_lend", ["person_id"]);

  await queryInterface.addIndex("borrow_lend", ["borrow_lend_type_id"]);

  await queryInterface.addIndex("borrow_lend", ["account_id"]);
}

export async function down(queryInterface) {
  await queryInterface.dropTable("borrow_lend");
}
