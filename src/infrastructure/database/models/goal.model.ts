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
import { ProjectModel, WorkspaceModel } from "./workspace.model";

type GoalAttributes = {
  id: string;
  userId: string;
  workspaceId: string;
  title: string;
  description: string | null;
  color: string | null;
  status: string;
  targetDate: string | null;
  achievedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

@Table({ tableName: "goal", timestamps: true, underscored: true })
export class GoalModel extends Model<
  GoalAttributes,
  Optional<
    GoalAttributes,
    | "id"
    | "description"
    | "color"
    | "status"
    | "targetDate"
    | "achievedAt"
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

  @AllowNull(false)
  @ForeignKey(() => WorkspaceModel)
  @Column(DataType.UUID)
  declare workspaceId: string;

  @AllowNull(false)
  @Column(DataType.STRING(200))
  declare title: string;

  @Column(DataType.STRING(2000))
  declare description: string | null;

  @Column(DataType.CHAR(7))
  declare color: string | null;

  @AllowNull(false)
  @Default("active")
  @Column(DataType.STRING(20))
  declare status: string;

  @Column(DataType.DATEONLY)
  declare targetDate: string | null;

  @Column(DataType.DATE)
  declare achievedAt: Date | null;

  declare createdAt: Date;
  declare updatedAt: Date;
}

type MilestoneAttributes = {
  id: string;
  goalId: string;
  title: string;
  dueDate: string | null;
  doneAt: Date | null;
  position: number;
  createdAt: Date;
  updatedAt: Date;
};

@Table({ tableName: "goal_milestone", timestamps: true, underscored: true })
export class GoalMilestoneModel extends Model<
  MilestoneAttributes,
  Optional<MilestoneAttributes, "id" | "dueDate" | "doneAt" | "createdAt" | "updatedAt">
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @ForeignKey(() => GoalModel)
  @Column(DataType.UUID)
  declare goalId: string;

  @AllowNull(false)
  @Column(DataType.STRING(200))
  declare title: string;

  @Column(DataType.DATEONLY)
  declare dueDate: string | null;

  @Column(DataType.DATE)
  declare doneAt: Date | null;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare position: number;

  declare createdAt: Date;
  declare updatedAt: Date;
}

@Table({ tableName: "goal_project", timestamps: false, underscored: true })
export class GoalProjectModel extends Model<{ goalId: string; projectId: string }> {
  @PrimaryKey
  @ForeignKey(() => GoalModel)
  @Column(DataType.UUID)
  declare goalId: string;

  @PrimaryKey
  @ForeignKey(() => ProjectModel)
  @Column(DataType.UUID)
  declare projectId: string;
}
