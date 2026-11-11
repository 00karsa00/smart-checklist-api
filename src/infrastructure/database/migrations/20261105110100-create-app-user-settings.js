"use strict";

// Each user's preferences: one row, created on their first change. Until then
// the API answers with the defaults in configuration.userDefaults.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("app_user_settings", {
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

      // ISO 4217, e.g. INR. The user's default; each account may have its own.
      currency: {
        type: Sequelize.CHAR(3),
        allowNull: false,
      },

      // BCP 47, e.g. en-IN: number, date and currency formatting.
      locale: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },

      // IANA, e.g. Asia/Kolkata: which calendar day something falls on.
      time_zone: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },

      // 0 = Sunday … 6 = Saturday.
      week_starts_on: {
        type: Sequelize.SMALLINT,
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

    await queryInterface.addIndex("app_user_settings", ["app_user_id"], {
      unique: true,
      name: "app_user_settings_app_user_id_unique_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("app_user_settings");
  },
};
