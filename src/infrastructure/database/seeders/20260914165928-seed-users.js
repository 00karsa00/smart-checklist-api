"use strict";

const { randomUUID } = require("crypto");

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert("users", [
      {
        id: randomUUID(),
        name: "Karthick",
        email: "karthick@example.com",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: randomUUID(),
        name: "John Doe",
        email: "john@example.com",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: randomUUID(),
        name: "Jane Smith",
        email: "jane@example.com",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("users", {
      email: ["karthick@example.com", "john@example.com", "jane@example.com"],
    });
  },
};
