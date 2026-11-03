import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface) {
  await queryInterface.createTable("borrow_lend_types", {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },

    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
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
      type: DataTypes.ENUM(
        "Borrowed",
        "Borrow Repaid",
        "Lent",
        "Lent Recovered",
        "UPI Sent",
        "UPI Received",
      ),
      allowNull: false,
      unique: true,
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
  await queryInterface.dropTable("borrow_lend_types");
}
