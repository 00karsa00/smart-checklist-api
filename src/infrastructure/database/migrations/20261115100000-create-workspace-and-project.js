"use strict";

// Workspaces (Personal, Work, Freelance…) and the projects inside them.
// Names are unique per user (workspaces) and per workspace (projects).
// Every row has its owner (app_user_id), so sharing later only needs a
// members table and one access check.
module.exports = {
  async up(queryInterface, Sequelize) {
    const id = {
      type: Sequelize.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.literal("gen_random_uuid()"),
    };
    const owner = {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: "app_user", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    };
    const timestamps = {
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    };

    await queryInterface.createTable("workspace", {
      id,
      app_user_id: owner,
      name: { type: Sequelize.STRING(60), allowNull: false },
      // #RRGGBB.
      color: { type: Sequelize.CHAR(7), allowNull: true },
      ...timestamps,
    });
    await queryInterface.addIndex("workspace", ["app_user_id", "name"], {
      unique: true,
      name: "workspace_user_name_unique_idx",
    });

    await queryInterface.createTable("project", {
      id,
      app_user_id: owner,
      // A workspace with projects cannot be deleted.
      workspace_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "workspace", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      name: { type: Sequelize.STRING(100), allowNull: false },
      description: { type: Sequelize.STRING(1000), allowNull: true },
      color: { type: Sequelize.CHAR(7), allowNull: true },
      // active | on_hold | completed
      status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "active" },
      due_date: { type: Sequelize.DATEONLY, allowNull: true },
      is_archived: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      ...timestamps,
    });
    await queryInterface.addIndex("project", ["workspace_id", "name"], {
      unique: true,
      name: "project_workspace_name_unique_idx",
    });
    await queryInterface.addIndex("project", ["app_user_id"], { name: "project_user_idx" });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("project");
    await queryInterface.dropTable("workspace");
  },
};
