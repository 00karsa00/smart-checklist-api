import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  IsUUID,
  AllowNull,
  HasMany,
  ForeignKey,
  Index,
  BelongsTo,
} from "sequelize-typescript";
import { Optional } from "sequelize";
import { User } from "./user.model";
import { AllTransaction } from "./all-transactions.model";

export enum AccountType {
  CURRENT = "current",
  SAVING = "saving",
}

export enum AccountStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  CLOSED = "closed",
}

interface AccountAttributes {
  id: string;
  accountName: string;
  bank: string;
  accountNumber: string;
  customerNumber: string | null;
  ifsc: string | null;
  type: AccountType;
  status: AccountStatus;
  currentBalance: string;
  openingDate: string;
  closingDate: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AccountCreationAttributes
  extends Optional<
    AccountAttributes,
    "id" | "customerNumber" | "ifsc" | "status" | "currentBalance" | "closingDate" | "createdAt" | "updatedAt"
  > {}

@Table({
  tableName: "accounts",
  timestamps: true,
  underscored: true,
})
export class Account extends Model<AccountAttributes, AccountCreationAttributes> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @IsUUID(4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare accountName: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare bank: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare accountNumber: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare customerNumber: string | null;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare ifsc: string | null;

  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(AccountType)))
  declare type: AccountType;

  @AllowNull(false)
  @Default(AccountStatus.ACTIVE)
  @Column(DataType.ENUM(...Object.values(AccountStatus)))
  declare status: AccountStatus;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.DECIMAL(15, 2))
  declare currentBalance: string;

  @AllowNull(false)
  @Column(DataType.DATEONLY)
  declare openingDate: string;

  @AllowNull(true)
  @Column(DataType.DATEONLY)
  declare closingDate: string | null;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Index
  @Column(DataType.UUID)
  declare userId: string;

  @BelongsTo(() => User)
  declare user: User;

  @HasMany(() => AllTransaction)
  declare transactions: AllTransaction[];
}
