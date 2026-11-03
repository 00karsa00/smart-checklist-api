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
import { Category } from "./categories.model";

interface SubcategoryAttributes {
  id: string;
  code: string;
  categoryId: string;
  name: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

type SubcategoryCreationAttributes = Optional<
  SubcategoryAttributes,
  "id" | "createdAt" | "updatedAt"
>;

@Table({
  tableName: "subcategories",
  timestamps: true,
  underscored: true,
})
export class Subcategory extends Model<SubcategoryAttributes, SubcategoryCreationAttributes> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @IsUUID(4)
  @Column(DataType.UUID)
  declare id: string;

  // Human-friendly identifier from the sheet, e.g. SUB001. Unique per user.
  @AllowNull(false)
  @Column(DataType.STRING)
  declare code: string;

  @Index
  @AllowNull(false)
  @ForeignKey(() => Category)
  @Column(DataType.UUID)
  declare categoryId: string;

  @BelongsTo(() => Category)
  declare category: Category;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare name: string;

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
