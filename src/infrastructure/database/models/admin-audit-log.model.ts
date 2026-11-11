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

import { AdminUserModel } from "./admin-user.model";

type AdminAuditLogAttributes = {
  id: string;
  adminId: string | null;
  adminUserName: string;
  action: string;
  targetType: string;
  targetId: string;
  targetLabel: string;
  details: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: Date;
};

@Table({ tableName: "admin_audit_log", timestamps: true, updatedAt: false, underscored: true })
export class AdminAuditLogModel extends Model<
  AdminAuditLogAttributes,
  Optional<AdminAuditLogAttributes, "id" | "details" | "ipAddress" | "createdAt">
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => AdminUserModel)
  @Column({ type: DataType.UUID, field: "admin_user_id" })
  declare adminId: string | null;

  @AllowNull(false)
  @Column(DataType.STRING(100))
  declare adminUserName: string;

  @AllowNull(false)
  @Column(DataType.STRING(40))
  declare action: string;

  @AllowNull(false)
  @Column(DataType.STRING(20))
  declare targetType: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  declare targetId: string;

  @AllowNull(false)
  @Column(DataType.STRING(255))
  declare targetLabel: string;

  @AllowNull(false)
  @Column(DataType.JSONB)
  declare details: Record<string, unknown>;

  @Column(DataType.STRING(45))
  declare ipAddress: string | null;

  declare createdAt: Date;
}
