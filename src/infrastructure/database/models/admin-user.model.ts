import { Optional } from "sequelize";
import {
  AllowNull,
  Column,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
  Unique,
} from "sequelize-typescript";

type AdminUserAttributes = {
  id: string;
  userName: string;
  loginMethod: string;
  /** What the admin may do; see src/modules/admin/admin-roles.ts. */
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type AdminUserCreationAttributes = Optional<
  AdminUserAttributes,
  "id" | "loginMethod" | "role" | "isActive" | "createdAt" | "updatedAt"
>;

@Table({ tableName: "admin_user", timestamps: true, underscored: true })
export class AdminUserModel extends Model<AdminUserAttributes, AdminUserCreationAttributes> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Unique
  @Column(DataType.STRING(100))
  declare userName: string;

  @AllowNull(false)
  @Default("password")
  @Column(DataType.STRING(20))
  declare loginMethod: string;

  @AllowNull(false)
  @Default("admin")
  @Column(DataType.STRING(30))
  declare role: string;

  @AllowNull(false)
  @Default(true)
  @Column(DataType.BOOLEAN)
  declare isActive: boolean;

  declare createdAt: Date;
  declare updatedAt: Date;
}
