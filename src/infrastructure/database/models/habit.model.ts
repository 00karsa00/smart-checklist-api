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
import { WorkspaceModel } from "./workspace.model";

type HabitAttributes = {
  id: string;
  userId: string;
  workspaceId: string;
  title: string;
  description: string | null;
  color: string | null;
  schedule: object;
  reminderTime: string | null;
  startDate: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
};

@Table({ tableName: "habit", timestamps: true, underscored: true })
export class HabitModel extends Model<
  HabitAttributes,
  Optional<
    HabitAttributes,
    "id" | "description" | "color" | "reminderTime" | "isArchived" | "createdAt" | "updatedAt"
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

  @AllowNull(false)
  @ForeignKey(() => WorkspaceModel)
  @Column(DataType.UUID)
  declare workspaceId: string;

  @AllowNull(false)
  @Column(DataType.STRING(200))
  declare title: string;

  @Column(DataType.STRING(1000))
  declare description: string | null;

  @Column(DataType.CHAR(7))
  declare color: string | null;

  @AllowNull(false)
  @Column(DataType.JSONB)
  declare schedule: object;

  @Column(DataType.STRING(5))
  declare reminderTime: string | null;

  @AllowNull(false)
  @Column(DataType.DATEONLY)
  declare startDate: string;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare isArchived: boolean;

  declare createdAt: Date;
  declare updatedAt: Date;
}

@Table({ tableName: "habit_check", timestamps: true, updatedAt: false, underscored: true })
export class HabitCheckModel extends Model<{ habitId: string; date: string }> {
  @PrimaryKey
  @ForeignKey(() => HabitModel)
  @Column(DataType.UUID)
  declare habitId: string;

  @PrimaryKey
  @Column(DataType.DATEONLY)
  declare date: string;
}
