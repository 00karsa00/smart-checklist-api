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

interface AllTransactionAttributes {
  id: string;
  transactionDate: string;
  year: number;
  month: number;
  accountId: string;
  paymentMethod: string | null;
  transactionTypeId: string;
  amount: string;
  remarks: string | null;
  note: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AllTransactionCreationAttributes
  extends Optional<AllTransactionAttributes, "id" | "paymentMethod" | "remarks" | "note" | "createdAt" | "updatedAt"> {}

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

  @AllowNull(true)
  @Column(DataType.STRING)
  declare paymentMethod: string | null;

  @Index
  @AllowNull(false)
  @ForeignKey(() => TransactionType)
  @Column(DataType.UUID)
  declare transactionTypeId: string;

  @BelongsTo(() => TransactionType)
  declare transactionType: TransactionType;

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
