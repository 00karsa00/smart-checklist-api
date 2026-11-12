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
import { TaskModel } from "./task.model";
import { ProjectModel } from "./workspace.model";

type TimeEntryAttributes = {
  id: string;
  userId: string;
  taskId: string | null;
  projectId: string | null;
  description: string;
  kind: string;
  plannedMinutes: number | null;
  startedAt: Date;
  endedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

@Table({ tableName: "time_entry", timestamps: true, underscored: true })
export class TimeEntryModel extends Model<
  TimeEntryAttributes,
  Optional<
    TimeEntryAttributes,
    | "id"
    | "taskId"
    | "projectId"
    | "kind"
    | "plannedMinutes"
    | "endedAt"
    | "createdAt"
    | "updatedAt"
  >
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @ForeignKey(() => AppUserModel)
  @Column({ type: DataType.UUID, field: "app_user_id" })
  declare userId: string;

  @ForeignKey(() => TaskModel)
  @Column(DataType.UUID)
  declare taskId: string | null;

  @ForeignKey(() => ProjectModel)
  @Column(DataType.UUID)
  declare projectId: string | null;

  @AllowNull(false)
  @Column(DataType.STRING(200))
  declare description: string;

  @AllowNull(false)
  @Default("work")
  @Column(DataType.STRING(10))
  declare kind: string;

  @Column(DataType.SMALLINT)
  declare plannedMinutes: number | null;

  @AllowNull(false)
  @Column(DataType.DATE)
  declare startedAt: Date;

  @Column(DataType.DATE)
  declare endedAt: Date | null;

  declare createdAt: Date;
  declare updatedAt: Date;
}
