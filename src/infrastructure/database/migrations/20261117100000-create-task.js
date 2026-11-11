"use strict";

// Tasks, their subtasks (one level, parent_id) and tags.
// A top-level task sits in a project, or directly in a workspace (exactly one
// of project_id / workspace_id); a subtask has neither and goes with its parent.
// Deleting a project deletes its tasks; a workspace with tasks cannot be
// deleted; a deleted category leaves its tasks without one.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("task", {
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
        allowNull: true,
        references: { model: "workspace", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      project_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "project", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      parent_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "task", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      // A label of kind "category".
      category_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "label", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      title: { type: Sequelize.STRING(200), allowNull: false },
      notes: { type: Sequelize.STRING(5000), allowNull: true },
      // todo | in_progress | done
      status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "todo" },
      // 0 none, 1 low, 2 medium, 3 high: a number, so lists sort by it.
      priority: { type: Sequelize.SMALLINT, allowNull: false, defaultValue: 0 },
      due_date: { type: Sequelize.DATEONLY, allowNull: true },
      // HH:MM in the user's time zone; only with a due date.
      due_time: { type: Sequelize.STRING(5), allowNull: true },
      completed_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    });
    await queryInterface.addIndex("task", ["app_user_id", "completed_at", "due_date"], {
      name: "task_user_open_due_idx",
    });
    await queryInterface.addIndex("task", ["parent_id"], { name: "task_parent_idx" });
    await queryInterface.addIndex("task", ["project_id"], { name: "task_project_idx" });

    await queryInterface.createTable("task_tag", {
      task_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        references: { model: "task", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      // A label of kind "tag".
      label_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        references: { model: "label", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
    });
    await queryInterface.addIndex("task_tag", ["label_id"], { name: "task_tag_label_idx" });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("task_tag");
    await queryInterface.dropTable("task");
  },
};
