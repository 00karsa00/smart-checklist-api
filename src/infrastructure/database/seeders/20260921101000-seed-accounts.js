"use strict";

const { randomUUID } = require("crypto");

// Owner is resolved from the existing seeded users, never hardcoded. Falls back
// to the first user if the primary demo user isn't present.
const OWNER_EMAIL = "karthick@example.com";

async function resolveOwnerId(queryInterface) {
  const [byEmail] = await queryInterface.sequelize.query(
    "SELECT id FROM users WHERE email = :email LIMIT 1;",
    { replacements: { email: OWNER_EMAIL } },
  );

  if (byEmail.length > 0) return byEmail[0].id;

  const [anyUser] = await queryInterface.sequelize.query(
    "SELECT id FROM users ORDER BY created_at ASC LIMIT 1;",
  );

  return anyUser.length > 0 ? anyUser[0].id : null;
}

module.exports = {
  async up(queryInterface) {
    const userId = await resolveOwnerId(queryInterface);

    if (!userId) {
      // No users to attach accounts to — skip rather than fail the seed run.
      // Run the user seeder first (npm run db:seed seeds users then accounts).
      return;
    }

    const now = new Date();

    const accounts = [
      {
        account_id: "ACC000001",
        account_name: "HDFC Salary Account - Chennai",
        bank: "HDFC",
        account_number: "50100475309311",
        customer_number: "181378668",
        ifsc: "HDFC0000260",
        type: "saving",
        status: "active",
        current_balance: 32941.0,
      },
      {
        account_id: "ACC000002",
        account_name: "BOI Saving Account - Namakkal",
        bank: "BANK OF INDIA",
        account_number: null,
        customer_number: null,
        ifsc: null,
        type: "current",
        status: "active",
        current_balance: 0.0,
      },
      {
        account_id: "ACC000003",
        account_name: "KVB Current Account - Namakkal",
        bank: "KARUR VYSYA BANK",
        account_number: null,
        customer_number: null,
        ifsc: null,
        type: "current",
        status: "active",
        current_balance: 0.0,
      },
      {
        account_id: "ACC000004",
        account_name: "Cash",
        bank: "Cash",
        account_number: "Cash",
        customer_number: "Cash",
        ifsc: "Cash",
        type: "current",
        status: "active",
        current_balance: 0.0,
      },
    ];

    await queryInterface.bulkInsert(
      "accounts",
      accounts.map((a) => ({
        id: randomUUID(),
        user_id: userId,
        account_id: a.account_id,
        account_name: a.account_name,
        bank: a.bank,
        account_number: a.account_number,
        customer_number: a.customer_number,
        ifsc: a.ifsc,
        type: a.type,
        status: a.status,
        current_balance: a.current_balance,
        opening_date: null,
        closing_date: null,
        created_at: now,
        updated_at: now,
      })),
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("accounts", {
      account_id: ["ACC000001", "ACC000002", "ACC000003", "ACC000004"],
    });
  },
};
