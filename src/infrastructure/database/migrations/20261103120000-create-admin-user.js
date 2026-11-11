"use strict";

// One row per admin. `login_method` names how the admin signs in ("password"
// today, "otp" later); each method keeps its secrets in its own table.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("admin_user", {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
      },

      // Stored trimmed and lower-case.
      user_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },

      login_method: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: "password",
      },

      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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

    await queryInterface.addIndex("admin_user", ["user_name"], {
      unique: true,
      name: "admin_user_user_name_unique_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("admin_user");
  },
};
