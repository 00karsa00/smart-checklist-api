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
  Unique,
} from "sequelize-typescript";

import { AppUserModel } from "./app-user.model";

type AppUserSettingsAttributes = {
  id: string;
  userId: string;
  currency: string;
  locale: string;
  timeZone: string;
  weekStartsOn: number;
  createdAt: Date;
  updatedAt: Date;
};

type AppUserSettingsCreationAttributes = Optional<
  AppUserSettingsAttributes,
  "id" | "createdAt" | "updatedAt"
>;

// One row per user, created on their first change.
@Table({ tableName: "app_user_settings", timestamps: true, underscored: true })
export class AppUserSettingsModel extends Model<
  AppUserSettingsAttributes,
  AppUserSettingsCreationAttributes
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Unique
  @ForeignKey(() => AppUserModel)
  @Column({ type: DataType.UUID, field: "app_user_id" })
  declare userId: string;

  @AllowNull(false)
  @Column(DataType.CHAR(3))
  declare currency: string;

  @AllowNull(false)
  @Column(DataType.STRING(20))
  declare locale: string;

  @AllowNull(false)
  @Column(DataType.STRING(64))
  declare timeZone: string;

  @AllowNull(false)
  @Column(DataType.SMALLINT)
  declare weekStartsOn: number;

  declare createdAt: Date;
  declare updatedAt: Date;
}
