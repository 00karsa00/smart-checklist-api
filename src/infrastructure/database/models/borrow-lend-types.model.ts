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

import { TransactionType } from "./transaction-types.model";
import { BorrowLend } from "./borrow-lend.model";

// Fixed set of borrow/lend movement kinds, mirrored from the sheet's
// BorrowLendTransactionType tab.
export enum BorrowLendKind {
  BORROWED = "Borrowed",
  BORROW_REPAID = "Borrow Repaid",
  LENT = "Lent",
  LENT_RECOVERED = "Lent Recovered",
  UPI_SENT = "UPI Sent",
  UPI_RECEIVED = "UPI Received",
}

interface BorrowLendTypeAttributes {
  id: string;
  code: string;
  transactionTypeId: string | null;
  name: BorrowLendKind;
  createdAt: Date;
  updatedAt: Date;
}

interface BorrowLendTypeCreationAttributes
  extends Optional<
    BorrowLendTypeAttributes,
    "id" | "transactionTypeId" | "createdAt" | "updatedAt"
  > {}

@Table({
  tableName: "borrow_lend_types",
  timestamps: true,
  underscored: true,
})
export class BorrowLendType extends Model<
  BorrowLendTypeAttributes,
  BorrowLendTypeCreationAttributes
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @IsUUID(4)
  @Column(DataType.UUID)
  declare id: string;

  // Human-friendly identifier from the sheet, e.g. CAT001 (its own numbering).
  @AllowNull(false)
  @Column({ type: DataType.STRING, unique: true })
  declare code: string;

  // Cash Inflow / Cash Outflow classification for this movement.
  @Index
  @AllowNull(true)
  @ForeignKey(() => TransactionType)
  @Column(DataType.UUID)
  declare transactionTypeId: string | null;

  @BelongsTo(() => TransactionType)
  declare transactionType: TransactionType;

  @AllowNull(false)
  @Column({
    type: DataType.ENUM(...Object.values(BorrowLendKind)),
    unique: true,
  })
  declare name: BorrowLendKind;

  @HasMany(() => BorrowLend)
  declare borrowLendEntries: BorrowLend[];

  declare createdAt: Date;
  declare updatedAt: Date;
}
