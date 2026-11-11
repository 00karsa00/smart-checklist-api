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

type NotificationAttributes = {
  id: string;
  userId: string;
  kind: string;
  subjectType: string;
  subjectId: string;
  title: string;
  data: Record<string, unknown>;
  dedupeKey: string;
  readAt: Date | null;
  dismissedAt: Date | null;
  createdAt: Date;
};

@Table({ tableName: "notification", timestamps: true, updatedAt: false, underscored: true })
export class NotificationModel extends Model<
  NotificationAttributes,
  Optional<NotificationAttributes, "id" | "data" | "readAt" | "dismissedAt" | "createdAt">
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
  @Column(DataType.STRING(30))
  declare kind: string;

  @AllowNull(false)
  @Column(DataType.STRING(20))
  declare subjectType: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  declare subjectId: string;

  @AllowNull(false)
  @Column(DataType.STRING(150))
  declare title: string;

  @AllowNull(false)
  @Column(DataType.JSONB)
  declare data: Record<string, unknown>;

  @AllowNull(false)
  @Column(DataType.STRING(200))
  declare dedupeKey: string;

  @Column(DataType.DATE)
  declare readAt: Date | null;

  @Column(DataType.DATE)
  declare dismissedAt: Date | null;

  declare createdAt: Date;
}

type NotificationSettingAttributes = { userId: string; muted: string[]; updatedAt: Date };

/** One row per user, created on their first change. */
@Table({
  tableName: "notification_setting",
  timestamps: true,
  createdAt: false,
  underscored: true,
})
export class NotificationSettingModel extends Model<
  NotificationSettingAttributes,
  Optional<NotificationSettingAttributes, "updatedAt">
> {
  @PrimaryKey
  @ForeignKey(() => AppUserModel)
  @Column({ type: DataType.UUID, field: "app_user_id" })
  declare userId: string;

  @AllowNull(false)
  @Column(DataType.ARRAY(DataType.STRING(20)))
  declare muted: string[];

  declare updatedAt: Date;
}
