"use strict";

// Notes and their checklist items. A note sits in a project or directly in a
// workspace (exactly one), like a task, and may be linked to a task. Deleting
// a project deletes its notes; a workspace with notes cannot be deleted; a
// deleted task leaves its notes unlinked.
module.exports = {
  async up(queryInterface, Sequelize) {
    const id = {
      type: Sequelize.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.literal("gen_random_uuid()"),
    };
    const timestamps = {
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    };
    const ref = (model, onDelete) => ({
      type: Sequelize.UUID,
      allowNull: true,
      references: { model, key: "id" },
      onUpdate: "CASCADE",
      onDelete,
    });

    await queryInterface.createTable("note", {
      id,
      app_user_id: { ...ref("app_user", "CASCADE"), allowNull: false },
      workspace_id: ref("workspace", "RESTRICT"),
      project_id: ref("project", "CASCADE"),
      task_id: ref("task", "SET NULL"),
      title: { type: Sequelize.STRING(200), allowNull: false },
      body: { type: Sequelize.TEXT, allowNull: true },
      is_pinned: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      is_archived: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      ...timestamps,
    });
    await queryInterface.addIndex("note", ["app_user_id", "updated_at"], {
      name: "note_user_updated_idx",
    });
    await queryInterface.addIndex("note", ["task_id"], { name: "note_task_idx" });

    await queryInterface.createTable("note_item", {
      id,
      note_id: { ...ref("note", "CASCADE"), allowNull: false },
      text: { type: Sequelize.STRING(500), allowNull: false },
      is_done: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      // Order in the checklist; new items go last.
      position: { type: Sequelize.INTEGER, allowNull: false },
      ...timestamps,
    });
    await queryInterface.addIndex("note_item", ["note_id", "position"], {
      name: "note_item_note_position_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("note_item");
    await queryInterface.dropTable("note");
  },
};
