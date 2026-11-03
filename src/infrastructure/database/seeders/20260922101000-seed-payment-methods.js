"use strict";

const { randomUUID } = require("crypto");

// Static payment-method master list, mirrored from the sheet's PaymentMethod tab.
// Global (not per-user); referenced by all_transactions.payment_method_id and
// borrow_lend.payment_method_id.
const PAYMENT_METHODS = [
  { code: "PM001", name: "Cash", description: "Physical cash payment" },
  { code: "PM002", name: "UPI", description: "Google Pay, PhonePe, Paytm, BHIM" },
  { code: "PM003", name: "Debit Card", description: "Bank debit card" },
  { code: "PM004", name: "Credit Card", description: "Credit card payment" },
  { code: "PM005", name: "Net Banking", description: "Internet banking" },
  { code: "PM006", name: "Bank Transfer", description: "NEFT, RTGS, IMPS" },
  { code: "PM007", name: "Cheque", description: "Cheque payment" },
  { code: "PM008", name: "Auto Debit", description: "Automatic bank deduction" },
  { code: "PM009", name: "Wallet", description: "Paytm Wallet, Amazon Pay Wallet" },
  { code: "PM010", name: "EMI", description: "EMI payment" },
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert(
      "payment_methods",
      PAYMENT_METHODS.map((pm) => ({
        id: randomUUID(),
        code: pm.code,
        name: pm.name,
        description: pm.description,
        status: "active",
        created_at: now,
        updated_at: now,
      })),
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("payment_methods", {
      code: PAYMENT_METHODS.map((pm) => pm.code),
    });
  },
};
