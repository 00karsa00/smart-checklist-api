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

import { SessionAttributes, SessionCreationAttributes } from "./account-tables";
import { AdminUserModel } from "./admin-user.model";

// One row per signed-in device, from sign-in to sign-out. Each refresh swaps
// its token hash in place, so the session id never changes.
@Table({ tableName: "admin_session", timestamps: true, underscored: true })
export class AdminSessionModel extends Model<SessionAttributes, SessionCreationAttributes> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @ForeignKey(() => AdminUserModel)
  @Column({ type: DataType.UUID, field: "admin_user_id" })
  declare accountId: string;

  @AllowNull(false)
  @Unique
  @Column(DataType.CHAR(64))
  declare tokenHash: string;

  @Column(DataType.CHAR(64))
  declare previousTokenHash: string | null;

  @Column(DataType.DATE)
  declare rotatedAt: Date | null;

  @AllowNull(false)
  @Column(DataType.DATE)
  declare expiresAt: Date;

  @Column(DataType.DATE)
  declare revokedAt: Date | null;

  @Column(DataType.STRING(45))
  declare ipAddress: string | null;

  @Column(DataType.STRING(500))
  declare userAgent: string | null;

  declare createdAt: Date;
  declare updatedAt: Date;
}
