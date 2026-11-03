import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface) {
  await queryInterface.createTable("categories", {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },

    code: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    transaction_type_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "transaction_types",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },

    name: {
      type: DataTypes.STRING,
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

  await queryInterface.addIndex("categories", ["user_id"]);

  await queryInterface.addIndex("categories", ["transaction_type_id"]);

  await queryInterface.addIndex("categories", ["user_id", "code"], {
    name: "categories_user_id_code_unique",
    unique: true,
  });

  await queryInterface.addIndex("categories", ["user_id", "name"], {
    name: "categories_user_id_name_unique",
    unique: true,
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("categories");
}
