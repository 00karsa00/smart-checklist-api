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
import { ProjectModel, WorkspaceModel } from "./workspace.model";

type NoteAttributes = {
  id: string;
  userId: string;
  workspaceId: string | null;
  projectId: string | null;
  taskId: string | null;
  title: string;
  body: string | null;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
};

@Table({ tableName: "note", timestamps: true, underscored: true })
export class NoteModel extends Model<
  NoteAttributes,
  Optional<
    NoteAttributes,
    | "id"
    | "workspaceId"
    | "projectId"
    | "taskId"
    | "body"
    | "isPinned"
    | "isArchived"
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

  @ForeignKey(() => WorkspaceModel)
  @Column(DataType.UUID)
  declare workspaceId: string | null;

  @ForeignKey(() => ProjectModel)
  @Column(DataType.UUID)
  declare projectId: string | null;

  @ForeignKey(() => TaskModel)
  @Column(DataType.UUID)
  declare taskId: string | null;

  @AllowNull(false)
  @Column(DataType.STRING(200))
  declare title: string;

  @Column(DataType.TEXT)
  declare body: string | null;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare isPinned: boolean;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare isArchived: boolean;

  declare createdAt: Date;
  declare updatedAt: Date;
}

type NoteItemAttributes = {
  id: string;
  noteId: string;
  text: string;
  isDone: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
};

@Table({ tableName: "note_item", timestamps: true, underscored: true })
export class NoteItemModel extends Model<
  NoteItemAttributes,
  Optional<NoteItemAttributes, "id" | "isDone" | "createdAt" | "updatedAt">
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @ForeignKey(() => NoteModel)
  @Column(DataType.UUID)
  declare noteId: string;

  @AllowNull(false)
  @Column(DataType.STRING(500))
  declare text: string;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare isDone: boolean;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare position: number;

  declare createdAt: Date;
  declare updatedAt: Date;
}
