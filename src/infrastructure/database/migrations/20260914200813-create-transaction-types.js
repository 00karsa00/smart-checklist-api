import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface) {
  await queryInterface.createTable("transaction_types", {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },

    type: {
      type: DataTypes.STRING,
      allowNull: false,
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
}

export async function down(queryInterface) {
  await queryInterface.dropTable("transaction_types");
}
