import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface) {
  await queryInterface.createTable("subcategories", {
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

    category_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "categories",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
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

  await queryInterface.addIndex("subcategories", ["user_id"]);

  await queryInterface.addIndex("subcategories", ["category_id"]);

  await queryInterface.addIndex("subcategories", ["user_id", "code"], {
    name: "subcategories_user_id_code_unique",
    unique: true,
  });

  await queryInterface.addIndex("subcategories", ["category_id", "name"], {
    name: "subcategories_category_id_name_unique",
    unique: true,
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("subcategories");
}
