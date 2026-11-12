"use strict";

// Long-term goals, their milestones, and the projects working toward them.
// A goal sits in a workspace (one with goals cannot be deleted). Its links to
// projects live here, so projects know nothing of goals; deleting a project
// just drops the link.
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
    const ref = (model, onDelete, extra = {}) => ({
      type: Sequelize.UUID,
      allowNull: false,
      references: { model, key: "id" },
      onUpdate: "CASCADE",
      onDelete,
      ...extra,
    });

    await queryInterface.createTable("goal", {
      id,
      app_user_id: ref("app_user", "CASCADE"),
      workspace_id: ref("workspace", "RESTRICT"),
      title: { type: Sequelize.STRING(200), allowNull: false },
      description: { type: Sequelize.STRING(2000), allowNull: true },
      color: { type: Sequelize.CHAR(7), allowNull: true },
      // active | achieved | dropped
      status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "active" },
      target_date: { type: Sequelize.DATEONLY, allowNull: true },
      // When it was marked achieved.
      achieved_at: { type: Sequelize.DATE, allowNull: true },
      ...timestamps,
    });
    await queryInterface.addIndex("goal", ["app_user_id", "status"], {
      name: "goal_user_status_idx",
    });

    await queryInterface.createTable("goal_milestone", {
      id,
      goal_id: ref("goal", "CASCADE"),
      title: { type: Sequelize.STRING(200), allowNull: false },
      due_date: { type: Sequelize.DATEONLY, allowNull: true },
      done_at: { type: Sequelize.DATE, allowNull: true },
      // Order on the goal; new milestones go last.
      position: { type: Sequelize.INTEGER, allowNull: false },
      ...timestamps,
    });
    await queryInterface.addIndex("goal_milestone", ["goal_id", "position"], {
      name: "goal_milestone_goal_position_idx",
    });

    await queryInterface.createTable("goal_project", {
      goal_id: ref("goal", "CASCADE", { primaryKey: true }),
      project_id: ref("project", "CASCADE", { primaryKey: true }),
    });
    await queryInterface.addIndex("goal_project", ["project_id"], {
      name: "goal_project_project_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("goal_project");
    await queryInterface.dropTable("goal_milestone");
    await queryInterface.dropTable("goal");
  },
};
