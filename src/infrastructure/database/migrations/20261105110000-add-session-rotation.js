"use strict";

// A refresh now updates its session row instead of replacing it, so a session
// keeps one id from sign-in to sign-out (needed for the signed-in devices list).
// previous_token_hash keeps the token just replaced, to spot it being reused.
const TABLES = ["admin_session", "app_user_session"];

module.exports = {
  async up(queryInterface, Sequelize) {
    for (const table of TABLES) {
      await queryInterface.addColumn(table, "previous_token_hash", {
        type: Sequelize.CHAR(64),
        allowNull: true,
      });
      await queryInterface.addColumn(table, "rotated_at", {
        type: Sequelize.DATE,
        allowNull: true,
      });
      await queryInterface.addIndex(table, ["previous_token_hash"], {
        name: `${table}_previous_token_hash_idx`,
      });
    }
  },

  async down(queryInterface) {
    for (const table of TABLES) {
      await queryInterface.removeColumn(table, "previous_token_hash");
      await queryInterface.removeColumn(table, "rotated_at");
    }
  },
};
