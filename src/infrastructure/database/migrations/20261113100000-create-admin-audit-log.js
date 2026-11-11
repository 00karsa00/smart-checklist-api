"use strict";

// What admins changed: accounts created, edited (with before and after values)
// and passwords reset. Never holds a password.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("admin_audit_log", {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
      },
      // Who did it; their user name is kept too, as it was then.
      admin_user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "admin_user", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      admin_user_name: { type: Sequelize.STRING(100), allowNull: false },
      // e.g. admin.create, admin.update, admin.reset_password, user.create, user.update, user.reset_password
      action: { type: Sequelize.STRING(40), allowNull: false },
      // admin | user, its id, and its name or email as it was then.
      target_type: { type: Sequelize.STRING(20), allowNull: false },
      target_id: { type: Sequelize.UUID, allowNull: false },
      target_label: { type: Sequelize.STRING(255), allowNull: false },
      // { changes: { field: { from, to } } } and the like.
      details: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
      ip_address: { type: Sequelize.STRING(45), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    });
    await queryInterface.addIndex("admin_audit_log", ["created_at"], {
      name: "admin_audit_log_created_idx",
    });
    await queryInterface.addIndex("admin_audit_log", ["target_id"], {
      name: "admin_audit_log_target_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("admin_audit_log");
  },
};
