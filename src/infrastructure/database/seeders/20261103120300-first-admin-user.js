"use strict";

const path = require("path");

// Creates the first admin (role super_admin) from ADMIN_SEED_USER_NAME and ADMIN_SEED_PASSWORD.
// `npm run db:seed` builds first, so the app's own password hasher is reused.
// Remove ADMIN_SEED_PASSWORD from .env once the admin exists.
const { hashPassword } = require(path.resolve("dist/infrastructure/password"));

module.exports = {
  async up(queryInterface) {
    const userName = (process.env.ADMIN_SEED_USER_NAME || "admin").trim().toLowerCase();
    const password = process.env.ADMIN_SEED_PASSWORD;

    if (!password || password.length < 8) {
      throw new Error("Set ADMIN_SEED_PASSWORD (8+ characters) in .env to seed the first admin.");
    }

    const [existing] = await queryInterface.sequelize.query(
      "SELECT id FROM admin_user WHERE user_name = :userName",
      { replacements: { userName } },
    );
    if (existing.length > 0) return;

    const [[admin]] = await queryInterface.sequelize.query(
      "INSERT INTO admin_user (user_name, login_method, role) VALUES (:userName, 'password', 'super_admin') RETURNING id",
      { replacements: { userName } },
    );

    await queryInterface.bulkInsert("admin_user_password", [
      { admin_user_id: admin.id, password_hash: await hashPassword(password) },
    ]);
  },

  async down(queryInterface) {
    const userName = (process.env.ADMIN_SEED_USER_NAME || "admin").trim().toLowerCase();
    await queryInterface.bulkDelete("admin_user", { user_name: userName });
  },
};
