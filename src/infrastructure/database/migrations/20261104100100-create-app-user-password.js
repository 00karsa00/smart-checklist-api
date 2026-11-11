"use strict";

// Secrets for users whose login_method is "password". One row per user.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("app_user_password", {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
      },

      app_user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "app_user", key: "id" },
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

    await queryInterface.addIndex("app_user_password", ["app_user_id"], {
      unique: true,
      name: "app_user_password_app_user_id_unique_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("app_user_password");
  },
};
