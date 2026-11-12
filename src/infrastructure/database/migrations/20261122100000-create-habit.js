"use strict";

// Habits and the days they were done. A habit sits in a workspace (one with
// habits cannot be deleted). A day is ticked once: (habit_id, date) is unique.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("habit", {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
      },
      app_user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "app_user", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      workspace_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "workspace", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      title: { type: Sequelize.STRING(200), allowNull: false },
      description: { type: Sequelize.STRING(1000), allowNull: true },
      color: { type: Sequelize.CHAR(7), allowNull: true },
      // { kind: "daily" } | { kind: "weekdays", weekdays } | { kind: "weekly", timesPerWeek }
      schedule: { type: Sequelize.JSONB, allowNull: false },
      // HH:MM in the user's time zone.
      reminder_time: { type: Sequelize.STRING(5), allowNull: true },
      start_date: { type: Sequelize.DATEONLY, allowNull: false },
      is_archived: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    });
    await queryInterface.addIndex("habit", ["app_user_id"], { name: "habit_user_idx" });

    await queryInterface.createTable("habit_check", {
      habit_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        references: { model: "habit", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      // The user's local day it was done.
      date: { type: Sequelize.DATEONLY, allowNull: false, primaryKey: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("habit_check");
    await queryInterface.dropTable("habit");
  },
};
