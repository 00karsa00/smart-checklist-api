"use strict";

const { randomUUID } = require("crypto");

// Static borrow/lend movement kinds, mirrored from the sheet's
// BorrowLendTransactionType tab. Each links to a transaction type
// (Cash Inflow / Cash Outflow), resolved by name at seed time.
const BORROW_LEND_TYPES = [
  { code: "BLT001", name: "Borrowed", flow: "Cash Outflow" },
  { code: "BLT002", name: "Borrow Repaid", flow: "Cash Inflow" },
  { code: "BLT003", name: "Lent", flow: "Cash Outflow" },
  { code: "BLT004", name: "Lent Recovered", flow: "Cash Inflow" },
  { code: "BLT005", name: "UPI Sent", flow: "Cash Outflow" },
  { code: "BLT006", name: "UPI Received", flow: "Cash Inflow" },
];

async function resolveTransactionTypeIds(queryInterface) {
  const [rows] = await queryInterface.sequelize.query("SELECT id, type FROM transaction_types;");
  const byName = {};
  for (const row of rows) byName[row.type] = row.id;
  return byName;
}

module.exports = {
  async up(queryInterface) {
    const typeIdByName = await resolveTransactionTypeIds(queryInterface);
    const now = new Date();

    await queryInterface.bulkInsert(
      "borrow_lend_types",
      BORROW_LEND_TYPES.map((blt) => ({
        id: randomUUID(),
        code: blt.code,
        transaction_type_id: typeIdByName[blt.flow] ?? null,
        name: blt.name,
        created_at: now,
        updated_at: now,
      })),
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("borrow_lend_types", {
      code: BORROW_LEND_TYPES.map((blt) => blt.code),
    });
  },
};
