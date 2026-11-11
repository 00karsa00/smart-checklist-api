import { Optional } from "sequelize";
import {
  AllowNull,
  Column,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";

import { AppUserModel } from "./app-user.model";
import { LabelModel } from "./label.model";
import { ProjectModel, WorkspaceModel } from "./workspace.model";

type TaskAttributes = {
  id: string;
  userId: string;
  workspaceId: string | null;
  projectId: string | null;
  parentId: string | null;
  categoryId: string | null;
  title: string;
  notes: string | null;
  status: string;
  priority: number;
  dueDate: string | null;
  dueTime: string | null;
  remindAt: string | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type TaskOptional =
  | "id"
  | "workspaceId"
  | "projectId"
  | "parentId"
  | "categoryId"
  | "notes"
  | "status"
  | "priority"
  | "dueDate"
  | "dueTime"
  | "remindAt"
  | "completedAt"
  | "createdAt"
  | "updatedAt";

@Table({ tableName: "task", timestamps: true, underscored: true })
export class TaskModel extends Model<TaskAttributes, Optional<TaskAttributes, TaskOptional>> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @ForeignKey(() => AppUserModel)
  @Column({ type: DataType.UUID, field: "app_user_id" })
  declare userId: string;

  @ForeignKey(() => WorkspaceModel)
  @Column(DataType.UUID)
  declare workspaceId: string | null;

  @ForeignKey(() => ProjectModel)
  @Column(DataType.UUID)
  declare projectId: string | null;

  @ForeignKey(() => TaskModel)
  @Column(DataType.UUID)
  declare parentId: string | null;

  @ForeignKey(() => LabelModel)
  @Column(DataType.UUID)
  declare categoryId: string | null;

  @AllowNull(false)
  @Column(DataType.STRING(200))
  declare title: string;

  @Column(DataType.STRING(5000))
  declare notes: string | null;

  @AllowNull(false)
  @Default("todo")
  @Column(DataType.STRING(20))
  declare status: string;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.SMALLINT)
  declare priority: number;

  @Column(DataType.DATEONLY)
  declare dueDate: string | null;

  @Column(DataType.STRING(5))
  declare dueTime: string | null;

  /** "YYYY-MM-DDTHH:MM", local to the user. */
  @Column(DataType.STRING(16))
  declare remindAt: string | null;

  @Column(DataType.DATE)
  declare completedAt: Date | null;

  declare createdAt: Date;
  declare updatedAt: Date;
}

type TaskTagAttributes = { taskId: string; labelId: string };

@Table({ tableName: "task_tag", timestamps: false, underscored: true })
export class TaskTagModel extends Model<TaskTagAttributes> {
  @PrimaryKey
  @ForeignKey(() => TaskModel)
  @Column(DataType.UUID)
  declare taskId: string;

  @PrimaryKey
  @ForeignKey(() => LabelModel)
  @Column(DataType.UUID)
  declare labelId: string;
}
