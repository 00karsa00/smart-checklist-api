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
import { AdminUserModel } from "./admin-user.model";

// Insert-only, so there is no updated_at.
@Table({ tableName: "admin_login_log", timestamps: true, updatedAt: false, underscored: true })
export class AdminLoginLogModel extends Model<LoginLogAttributes, LoginLogCreationAttributes> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => AdminUserModel)
  @Column({ type: DataType.UUID, field: "admin_user_id" })
  declare accountId: string | null;

  @AllowNull(false)
  @Column({ type: DataType.STRING(100), field: "user_name" })
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
