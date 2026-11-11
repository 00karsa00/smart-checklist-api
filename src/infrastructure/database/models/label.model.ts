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

import { AppUserModel } from "./app-user.model";

type LabelAttributes = {
  id: string;
  userId: string;
  kind: string;
  name: string;
  color: string | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
};

@Table({ tableName: "label", timestamps: true, underscored: true })
export class LabelModel extends Model<
  LabelAttributes,
  Optional<LabelAttributes, "id" | "color" | "isArchived" | "createdAt" | "updatedAt">
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @ForeignKey(() => AppUserModel)
  @Column({ type: DataType.UUID, field: "app_user_id" })
  declare userId: string;

  @AllowNull(false)
  @Column(DataType.STRING(10))
  declare kind: string;

  @AllowNull(false)
  @Column(DataType.STRING(50))
  declare name: string;

  @Column(DataType.CHAR(7))
  declare color: string | null;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare isArchived: boolean;

  declare createdAt: Date;
  declare updatedAt: Date;
}
