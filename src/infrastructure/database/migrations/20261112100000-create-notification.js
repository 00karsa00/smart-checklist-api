"use strict";

// In-app notifications, made by the modules that register a source
// (see notification.sources.ts), and which groups each user turned off.
module.exports = {
  async up(queryInterface, Sequelize) {
    const user = {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: "app_user", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    };
    const created = { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") };

    await queryInterface.createTable("notification", {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
      },
      app_user_id: user,
      // Named by the module that made it, e.g. task_due.
      kind: { type: Sequelize.STRING(30), allowNull: false },
      // What it is about, e.g. task, and its id (not a foreign key:
      // the notification outlives a deleted record).
      subject_type: { type: Sequelize.STRING(20), allowNull: false },
      subject_id: { type: Sequelize.UUID, allowNull: false },
      // The record's name when the notification was made.
      title: { type: Sequelize.STRING(150), allowNull: false },
      // Figures for the message, set by the module that made it.
      data: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
      // Each situation is notified once, e.g. "task_due:<id>:2026-11-20".
      dedupe_key: { type: Sequelize.STRING(200), allowNull: false },
      read_at: { type: Sequelize.DATE, allowNull: true },
      // Deleted by the user: hidden, but kept so the same situation is not notified again.
      dismissed_at: { type: Sequelize.DATE, allowNull: true },
      created_at: created,
    });
    await queryInterface.addIndex("notification", ["app_user_id", "dedupe_key"], {
      unique: true,
      name: "notification_user_dedupe_unique_idx",
    });
    await queryInterface.addIndex("notification", ["app_user_id", "created_at"], {
      name: "notification_user_created_idx",
    });

    await queryInterface.createTable("notification_setting", {
      app_user_id: { ...user, primaryKey: true },
      // Groups (sources) the user turned off.
      muted: { type: Sequelize.ARRAY(Sequelize.STRING(20)), allowNull: false, defaultValue: [] },
      updated_at: { ...created },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("notification_setting");
    await queryInterface.dropTable("notification");
  },
};
