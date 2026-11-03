import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  IsUUID,
  AllowNull,
  Unique,
} from "sequelize-typescript";
import { Optional } from "sequelize";

interface UserAttributes {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type UserCreationAttributes = Optional<UserAttributes, "id" | "isActive" | "createdAt" | "updatedAt">;

@Table({
  tableName: "users",
  timestamps: true,
  underscored: true,
})
export class User extends Model<UserAttributes, UserCreationAttributes> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @IsUUID(4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING(100))
  declare name: string;

  @AllowNull(false)
  @Unique
  @Column(DataType.STRING(255))
  declare email: string;

  @AllowNull(false)
  @Default(true)
  @Column({ type: DataType.BOOLEAN, field: "is_active" })
  declare isActive: boolean;

  declare createdAt: Date;
  declare updatedAt: Date;
}
