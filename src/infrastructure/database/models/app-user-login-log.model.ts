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

import { LoginLogAttributes, LoginLogCreationAttributes } from "./account-tables";
import { AppUserModel } from "./app-user.model";

// Insert-only, so there is no updated_at.
@Table({ tableName: "app_user_login_log", timestamps: true, updatedAt: false, underscored: true })
export class AppUserLoginLogModel extends Model<LoginLogAttributes, LoginLogCreationAttributes> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => AppUserModel)
  @Column({ type: DataType.UUID, field: "app_user_id" })
  declare accountId: string | null;

  @AllowNull(false)
  @Column(DataType.STRING(255))
  declare identifier: string;

  @Column(DataType.STRING(20))
  declare loginMethod: string | null;

  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  declare isSuccess: boolean;

  @Column(DataType.STRING(50))
  declare failureReason: string | null;

  @Column(DataType.STRING(45))
  declare ipAddress: string | null;

  @Column(DataType.STRING(500))
  declare userAgent: string | null;

  declare createdAt: Date;
}
