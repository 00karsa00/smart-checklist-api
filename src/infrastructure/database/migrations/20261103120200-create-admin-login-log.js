"use strict";

// Every sign-in attempt, successful or not. Rows are only ever inserted.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("admin_login_log", {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
      },

      // Null when the user name did not match an admin.
      admin_user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "admin_user", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      // As typed, so failed attempts on unknown names are visible too.
      user_name: {
        type: Sequelize.STRING(100),
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

    await queryInterface.addIndex("admin_login_log", ["admin_user_id", "created_at"], {
      name: "admin_login_log_admin_user_id_created_at_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("admin_login_log");
  },
};
