"use strict";

// Secrets for admins whose login_method is "password". One row per admin.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("admin_user_password", {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
      },

      admin_user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "admin_user", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      // Never the plain password; see src/infrastructure/password.ts.
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });

    await queryInterface.addIndex("admin_user_password", ["admin_user_id"], {
      unique: true,
      name: "admin_user_password_admin_user_id_unique_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("admin_user_password");
  },
};
