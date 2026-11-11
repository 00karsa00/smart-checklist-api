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
import { AppUserModel } from "./app-user.model";

@Table({ tableName: "app_user_password", timestamps: true, underscored: true })
export class AppUserPasswordModel extends Model<PasswordAttributes, PasswordCreationAttributes> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Unique
  @ForeignKey(() => AppUserModel)
  @Column({ type: DataType.UUID, field: "app_user_id" })
  declare accountId: string;

  @AllowNull(false)
  @Column(DataType.STRING(255))
  declare passwordHash: string;

  declare createdAt: Date;
  declare updatedAt: Date;
}
