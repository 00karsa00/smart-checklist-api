"use strict";

// Sessions: one row per sign-in, holding the hash of its refresh token.
// A refresh replaces the row; logout, password change and deactivation revoke it.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("admin_session", {
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

      // SHA-256 (hex) of the refresh token. The token itself is never stored.
      token_hash: {
        type: Sequelize.CHAR(64),
        allowNull: false,
      },

      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      revoked_at: {
        type: Sequelize.DATE,
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

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });

    await queryInterface.addIndex("admin_session", ["token_hash"], {
      unique: true,
      name: "admin_session_token_hash_unique_idx",
    });
    await queryInterface.addIndex("admin_session", ["admin_user_id"], {
      name: "admin_session_admin_user_id_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("admin_session");
  },
};
