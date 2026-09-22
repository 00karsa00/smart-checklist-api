"use strict";

/**
 * Reconciles the `accounts` table with the Accounts module spec:
 *   - adds a per-user human-friendly `account_id` (e.g. ACC000001)
 *   - relaxes `account_number` and `opening_date` to be nullable
 *   - adds the ownership / lookup indexes the module relies on:
 *       (user_id, account_id) UNIQUE   — account_id is unique per user
 *       (user_id, type)                — filter by type
 *
 * The base table is created in 20260914200759-create-accounts.js; this only
 * alters it, so existing environments migrate forward cleanly.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add account_id as nullable first so existing rows can be backfilled.
    await queryInterface.addColumn("accounts", "account_id", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // 2. Backfill any existing rows with a deterministic per-user sequence.
    //    ROW_NUMBER() per user_id -> ACC000001, ACC000002, ... (ordered by
    //    creation time so the numbering is stable).
    await queryInterface.sequelize.query(`
      WITH numbered AS (
        SELECT
          id,
          'ACC' || LPAD(
            ROW_NUMBER() OVER (
              PARTITION BY user_id ORDER BY created_at, id
            )::text,
            6,
            '0'
          ) AS generated_account_id
        FROM accounts
      )
      UPDATE accounts a
      SET account_id = n.generated_account_id
      FROM numbered n
      WHERE a.id = n.id;
    `);

    // 3. Enforce NOT NULL now that every row has a value.
    await queryInterface.changeColumn("accounts", "account_id", {
      type: Sequelize.STRING,
      allowNull: false,
    });

    // 4. account_number becomes nullable (spec: nullable).
    await queryInterface.changeColumn("accounts", "account_number", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // 5. opening_date becomes nullable (spec: nullable).
    await queryInterface.changeColumn("accounts", "opening_date", {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });

    // 6. Indexes required by the spec.
    await queryInterface.addIndex("accounts", ["user_id", "account_id"], {
      name: "accounts_user_id_account_id_unique",
      unique: true,
    });

    await queryInterface.addIndex("accounts", ["user_id", "type"], {
      name: "accounts_user_id_type",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex(
      "accounts",
      "accounts_user_id_type",
    );

    await queryInterface.removeIndex(
      "accounts",
      "accounts_user_id_account_id_unique",
    );

    await queryInterface.changeColumn("accounts", "opening_date", {
      type: Sequelize.DATEONLY,
      allowNull: false,
    });

    await queryInterface.changeColumn("accounts", "account_number", {
      type: Sequelize.STRING,
      allowNull: false,
    });

    await queryInterface.removeColumn("accounts", "account_id");
  },
};
