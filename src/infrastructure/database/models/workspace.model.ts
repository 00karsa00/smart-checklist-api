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

type WorkspaceAttributes = {
  id: string;
  userId: string;
  name: string;
  color: string | null;
  createdAt: Date;
  updatedAt: Date;
};

@Table({ tableName: "workspace", timestamps: true, underscored: true })
export class WorkspaceModel extends Model<
  WorkspaceAttributes,
  Optional<WorkspaceAttributes, "id" | "color" | "createdAt" | "updatedAt">
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
  @Column(DataType.STRING(60))
  declare name: string;

  @Column(DataType.CHAR(7))
  declare color: string | null;

  declare createdAt: Date;
  declare updatedAt: Date;
}

type ProjectAttributes = {
  id: string;
  userId: string;
  workspaceId: string;
  name: string;
  description: string | null;
  color: string | null;
  status: string;
  dueDate: string | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
};

@Table({ tableName: "project", timestamps: true, underscored: true })
export class ProjectModel extends Model<
  ProjectAttributes,
  Optional<
    ProjectAttributes,
    "id" | "description" | "color" | "status" | "dueDate" | "isArchived" | "createdAt" | "updatedAt"
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
  @Column(DataType.STRING(100))
  declare name: string;

  @Column(DataType.STRING(1000))
  declare description: string | null;

  @Column(DataType.CHAR(7))
  declare color: string | null;

  @AllowNull(false)
  @Default("active")
  @Column(DataType.STRING(20))
  declare status: string;

  @Column(DataType.DATEONLY)
  declare dueDate: string | null;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare isArchived: boolean;

  declare createdAt: Date;
  declare updatedAt: Date;
}
