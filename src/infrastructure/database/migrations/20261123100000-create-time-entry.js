"use strict";

// Time spent: timer runs (ended_at null while running), focus sessions and
// entries logged by hand. One running timer per user (a partial unique
// index). An entry may be about a task; deleting the task keeps the entry,
// with the task's title copied, and its project.
module.exports = {
  async up(queryInterface, Sequelize) {
    const ref = (model, onDelete) => ({
      type: Sequelize.UUID,
      allowNull: true,
      references: { model, key: "id" },
      onUpdate: "CASCADE",
      onDelete,
    });
    await queryInterface.createTable("time_entry", {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
      },
      app_user_id: { ...ref("app_user", "CASCADE"), allowNull: false },
      task_id: ref("task", "SET NULL"),
      project_id: ref("project", "SET NULL"),
      // What was done: the task's title when started from one, or typed.
      description: { type: Sequelize.STRING(200), allowNull: false },
      // work | focus
      kind: { type: Sequelize.STRING(10), allowNull: false, defaultValue: "work" },
      // Focus sessions: how long it was meant to be.
      planned_minutes: { type: Sequelize.SMALLINT, allowNull: true },
      started_at: { type: Sequelize.DATE, allowNull: false },
      ended_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    });
    await queryInterface.addIndex("time_entry", ["app_user_id", "started_at"], {
      name: "time_entry_user_started_idx",
    });
    await queryInterface.addIndex("time_entry", ["app_user_id"], {
      unique: true,
      where: { ended_at: null },
      name: "time_entry_one_running_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("time_entry");
  },
};
