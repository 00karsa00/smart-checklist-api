"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Ensure PostgreSQL can generate UUIDs.
    await queryInterface.sequelize.query(
      'CREATE EXTENSION IF NOT EXISTS "pgcrypto";',
    );

    // Ensure existing rows have valid timestamps.
    await queryInterface.changeColumn("users", "created_at", {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn("NOW"),
    });

    await queryInterface.changeColumn("users", "updated_at", {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn("NOW"),
    });

    // Ensure the UUID column has a database-side default.
    await queryInterface.changeColumn("users", "id", {
      type: Sequelize.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.literal("gen_random_uuid()"),
    });

    // Ensure active flag is always available.
    await queryInterface.changeColumn("users", "is_active", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("users", "id", {
      type: Sequelize.UUID,
      allowNull: false,
      primaryKey: true,
    });

    await queryInterface.changeColumn("users", "is_active", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
    });

    await queryInterface.changeColumn("users", "created_at", {
      type: Sequelize.DATE,
      allowNull: false,
    });

    await queryInterface.changeColumn("users", "updated_at", {
      type: Sequelize.DATE,
      allowNull: false,
    });
  },
};
