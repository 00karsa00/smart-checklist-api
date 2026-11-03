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
import { Account } from "./accounts.model";
import { Person } from "./people.model";
import { BorrowLendType } from "./borrow-lend-types.model";
import { PaymentMethod } from "./payment-methods.model";

interface BorrowLendAttributes {
  id: string;
  referenceCode: string | null;
  transactionDate: string;
  personId: string;
  borrowLendTypeId: string;
  paymentMethodId: string | null;
  accountId: string;
  amount: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

type BorrowLendCreationAttributes = Optional<
    BorrowLendAttributes,
    "id" | "referenceCode" | "paymentMethodId" | "createdAt" | "updatedAt"
  >;

@Table({
  tableName: "borrow_lend",
  timestamps: true,
  underscored: true,
})
export class BorrowLend extends Model<
  BorrowLendAttributes,
  BorrowLendCreationAttributes
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @IsUUID(4)
  @Column(DataType.UUID)
  declare id: string;

  // Human-friendly transaction id from the sheet's BorrowLend tab.
  @AllowNull(true)
  @Column(DataType.STRING)
  declare referenceCode: string | null;

  @AllowNull(false)
  @Column(DataType.DATEONLY)
  declare transactionDate: string;

  @Index
  @AllowNull(false)
  @ForeignKey(() => Person)
  @Column(DataType.UUID)
  declare personId: string;

  @BelongsTo(() => Person)
  declare person: Person;

  @Index
  @AllowNull(false)
  @ForeignKey(() => BorrowLendType)
  @Column(DataType.UUID)
  declare borrowLendTypeId: string;

  @BelongsTo(() => BorrowLendType)
  declare borrowLendType: BorrowLendType;

  @AllowNull(true)
  @ForeignKey(() => PaymentMethod)
  @Column(DataType.UUID)
  declare paymentMethodId: string | null;

  @BelongsTo(() => PaymentMethod)
  declare paymentMethod: PaymentMethod;

  @Index
  @AllowNull(false)
  @ForeignKey(() => Account)
  @Column(DataType.UUID)
  declare accountId: string;

  @BelongsTo(() => Account)
  declare account: Account;

  @AllowNull(false)
  @Column(DataType.DECIMAL(15, 2))
  declare amount: string;

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
