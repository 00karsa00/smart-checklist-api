"use strict";

// One row per app user: the basic details only. Other details (profile,
// addresses, …) go in their own tables keyed by app_user.id. "user" is a
// reserved word in PostgreSQL, hence app_user.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("app_user", {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
      },

      name: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },

      // Stored lower-case. Email or phone is the sign-in identifier.
      email: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      // Digits with an optional leading +, no spaces.
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
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

      is_email_verified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      is_phone_verified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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

    // Unique but optional: PostgreSQL allows many NULLs in a unique index.
    await queryInterface.addIndex("app_user", ["email"], {
      unique: true,
      name: "app_user_email_unique_idx",
    });
    await queryInterface.addIndex("app_user", ["phone"], {
      unique: true,
      name: "app_user_phone_unique_idx",
    });

    // A user needs at least one way to be reached and to sign in.
    await queryInterface.sequelize.query(
      "ALTER TABLE app_user ADD CONSTRAINT app_user_email_or_phone_check " +
        "CHECK (email IS NOT NULL OR phone IS NOT NULL)",
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("app_user");
  },
};
