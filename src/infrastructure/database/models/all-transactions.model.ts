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

import { Account } from "./accounts.model";
import { TransactionType } from "./transaction-types.model";
import { User } from "./user.model";
import { Category } from "./categories.model";
import { Subcategory } from "./subcategories.model";
import { Source } from "./sources.model";
import { PaymentMethod } from "./payment-methods.model";

interface AllTransactionAttributes {
  id: string;
  transactionDate: string;
  year: number;
  month: number;
  accountId: string;
  paymentMethod: string | null;
  paymentMethodId: string | null;
  transactionTypeId: string;
  categoryId: string | null;
  subcategoryId: string | null;
  sourceId: string | null;
  amount: string;
  remarks: string | null;
  note: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

type AllTransactionCreationAttributes = Optional<
    AllTransactionAttributes,
    | "id"
    | "paymentMethod"
    | "paymentMethodId"
    | "categoryId"
    | "subcategoryId"
    | "sourceId"
    | "remarks"
    | "note"
    | "createdAt"
    | "updatedAt"
  >;

@Table({
  tableName: "all_transactions",
  timestamps: true,
  underscored: true,
})
export class AllTransaction extends Model<AllTransactionAttributes, AllTransactionCreationAttributes> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @IsUUID(4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.DATEONLY)
  declare transactionDate: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare year: number;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare month: number;

  @Index
  @AllowNull(false)
  @ForeignKey(() => Account)
  @Column(DataType.UUID)
  declare accountId: string;

  @BelongsTo(() => Account)
  declare account: Account;

  // Legacy free-text payment method. Kept nullable for backward compatibility;
  // new writes should populate payment_method_id instead.
  @AllowNull(true)
  @Column(DataType.STRING)
  declare paymentMethod: string | null;

  @Index
  @AllowNull(true)
  @ForeignKey(() => PaymentMethod)
  @Column(DataType.UUID)
  declare paymentMethodId: string | null;

  @BelongsTo(() => PaymentMethod)
  declare paymentMethodRef: PaymentMethod;

  @Index
  @AllowNull(false)
  @ForeignKey(() => TransactionType)
  @Column(DataType.UUID)
  declare transactionTypeId: string;

  @BelongsTo(() => TransactionType)
  declare transactionType: TransactionType;

  @Index
  @AllowNull(true)
  @ForeignKey(() => Category)
  @Column(DataType.UUID)
  declare categoryId: string | null;

  @BelongsTo(() => Category)
  declare category: Category;

  @Index
  @AllowNull(true)
  @ForeignKey(() => Subcategory)
  @Column(DataType.UUID)
  declare subcategoryId: string | null;

  @BelongsTo(() => Subcategory)
  declare subcategory: Subcategory;

  // Income rows reference a source; expense/other rows leave it null.
  @Index
  @AllowNull(true)
  @ForeignKey(() => Source)
  @Column(DataType.UUID)
  declare sourceId: string | null;

  @BelongsTo(() => Source)
  declare source: Source;

  @AllowNull(false)
  @Column(DataType.DECIMAL(15, 2))
  declare amount: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare remarks: string | null;

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare note: string | null;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Index
  @Column(DataType.UUID)
  declare userId: string;

  @BelongsTo(() => User)
  declare user: User;
}
