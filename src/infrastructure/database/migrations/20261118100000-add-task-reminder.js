"use strict";

// A reminder per task: a local date and time ("YYYY-MM-DDTHH:MM" in the
// user's time zone), so it stays at 9:00 even if the user moves time zone.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("task", "remind_at", {
      type: Sequelize.STRING(16),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("task", "remind_at");
  },
};
