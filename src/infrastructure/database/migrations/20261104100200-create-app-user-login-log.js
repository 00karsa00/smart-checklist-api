"use strict";

// Every sign-in attempt, successful or not. Rows are only ever inserted.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("app_user_login_log", {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
      },

      // Null when the email or phone did not match a user.
      app_user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "app_user", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      // Email or phone as typed, so failed attempts on unknown accounts are visible too.
      identifier: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      login_method: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },

      is_success: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },

      // The error code of a failed attempt, e.g. INVALID_CREDENTIALS.
      failure_reason: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },

      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true,
      },

      user_agent: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });

    await queryInterface.addIndex("app_user_login_log", ["app_user_id", "created_at"], {
      name: "app_user_login_log_app_user_id_created_at_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("app_user_login_log");
  },
};
