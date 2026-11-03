import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  IsUUID,
  AllowNull,
  ForeignKey,
  BelongsTo,
  Index,
} from "sequelize-typescript";
import { Optional } from "sequelize";

import { User } from "./user.model";

export enum SourceStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

interface SourceAttributes {
  id: string;
  code: string;
  sourceType: string | null;
  name: string;
  status: SourceStatus;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SourceCreationAttributes
  extends Optional<
    SourceAttributes,
    "id" | "sourceType" | "status" | "createdAt" | "updatedAt"
  > {}

@Table({
  tableName: "sources",
  timestamps: true,
  underscored: true,
})
export class Source extends Model<SourceAttributes, SourceCreationAttributes> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @IsUUID(4)
  @Column(DataType.UUID)
  declare id: string;

  // Human-friendly identifier from the sheet, e.g. SRC001. Unique per user.
  @AllowNull(false)
  @Column(DataType.STRING)
  declare code: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare sourceType: string | null;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare name: string;

  @AllowNull(false)
  @Default(SourceStatus.ACTIVE)
  @Column(DataType.ENUM(...Object.values(SourceStatus)))
  declare status: SourceStatus;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Index
  @Column(DataType.UUID)
  declare userId: string;

  @BelongsTo(() => User)
  declare user: User;

  declare createdAt: Date;
  declare updatedAt: Date;
}
