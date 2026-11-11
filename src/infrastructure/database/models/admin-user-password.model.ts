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

import { PasswordAttributes, PasswordCreationAttributes } from "./account-tables";
import { AdminUserModel } from "./admin-user.model";

@Table({ tableName: "admin_user_password", timestamps: true, underscored: true })
export class AdminUserPasswordModel extends Model<PasswordAttributes, PasswordCreationAttributes> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Unique
  @ForeignKey(() => AdminUserModel)
  @Column({ type: DataType.UUID, field: "admin_user_id" })
  declare accountId: string;

  @AllowNull(false)
  @Column(DataType.STRING(255))
  declare passwordHash: string;

  declare createdAt: Date;
  declare updatedAt: Date;
}
