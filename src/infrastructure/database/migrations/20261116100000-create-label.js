"use strict";

// Categories and tags: named, coloured labels a user keeps. A task has one
// category and any number of tags. Names are unique per user and kind.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("label", {
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
      // category | tag. Fixed once created.
      kind: { type: Sequelize.STRING(10), allowNull: false },
      name: { type: Sequelize.STRING(50), allowNull: false },
      // #RRGGBB.
      color: { type: Sequelize.CHAR(7), allowNull: true },
      // Hidden from pickers; kept on what already uses it.
      is_archived: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    });
    await queryInterface.addIndex("label", ["app_user_id", "kind", "name"], {
      unique: true,
      name: "label_user_kind_name_unique_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("label");
  },
};
