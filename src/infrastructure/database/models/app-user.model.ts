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

type AppUserAttributes = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  loginMethod: string;
  isActive: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type AppUserCreationAttributes = Optional<
  AppUserAttributes,
  | "id"
  | "email"
  | "phone"
  | "loginMethod"
  | "isActive"
  | "isEmailVerified"
  | "isPhoneVerified"
  | "createdAt"
  | "updatedAt"
>;

// "user" is a reserved word in PostgreSQL, hence app_user.
@Table({ tableName: "app_user", timestamps: true, underscored: true })
export class AppUserModel extends Model<AppUserAttributes, AppUserCreationAttributes> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING(150))
  declare name: string;

  @Unique
  @Column(DataType.STRING(255))
  declare email: string | null;

  @Unique
  @Column(DataType.STRING(20))
  declare phone: string | null;

  @AllowNull(false)
  @Default("password")
  @Column(DataType.STRING(20))
  declare loginMethod: string;

  @AllowNull(false)
  @Default(true)
  @Column(DataType.BOOLEAN)
  declare isActive: boolean;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare isEmailVerified: boolean;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare isPhoneVerified: boolean;

  declare createdAt: Date;
  declare updatedAt: Date;
}
