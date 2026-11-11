"use strict";

// What each admin may do. The roles and their permissions are defined in
// src/modules/admin/admin-roles.ts. Admins that exist before roles keep full
// access (super_admin), so nobody is locked out; new admins default to "admin".
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("admin_user", "role", {
      type: Sequelize.STRING(30),
      allowNull: false,
      defaultValue: "admin",
    });
    await queryInterface.sequelize.query("UPDATE admin_user SET role = 'super_admin'");
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("admin_user", "role");
  },
};
