"use strict";

// Repeating tasks. `repeat` is the rule ({ frequency, interval, weekdays?,
// anchorDay? }); completing such a task adds the next copy and records it in
// `next_id`, so completing it again (after reopening) adds no second copy.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("task", "repeat", { type: Sequelize.JSONB, allowNull: true });
    await queryInterface.addColumn("task", "next_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: "task", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("task", "next_id");
    await queryInterface.removeColumn("task", "repeat");
  },
};
