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
  HasMany,
  Index,
} from "sequelize-typescript";
import { Optional } from "sequelize";

import { User } from "./user.model";
import { TransactionType } from "./transaction-types.model";
import { Subcategory } from "./subcategories.model";

interface CategoryAttributes {
  id: string;
  code: string;
  transactionTypeId: string | null;
  name: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CategoryCreationAttributes
  extends Optional<
    CategoryAttributes,
    "id" | "transactionTypeId" | "createdAt" | "updatedAt"
  > {}

@Table({
  tableName: "categories",
  timestamps: true,
  underscored: true,
})
export class Category extends Model<
  CategoryAttributes,
  CategoryCreationAttributes
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @IsUUID(4)
  @Column(DataType.UUID)
  declare id: string;

  // Human-friendly identifier from the sheet, e.g. CAT001. Unique per user.
  @AllowNull(false)
  @Column(DataType.STRING)
  declare code: string;

  // Which transaction type (Cash Inflow / Cash Outflow) this category rolls up
  // into. Nullable so a category can exist before it is classified.
  @Index
  @AllowNull(true)
  @ForeignKey(() => TransactionType)
  @Column(DataType.UUID)
  declare transactionTypeId: string | null;

  @BelongsTo(() => TransactionType)
  declare transactionType: TransactionType;

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

  @HasMany(() => Subcategory)
  declare subcategories: Subcategory[];

  declare createdAt: Date;
  declare updatedAt: Date;
}
