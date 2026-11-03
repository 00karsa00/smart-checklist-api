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
} from "sequelize-typescript";
import { AllTransaction } from "./all-transactions.model";

@Table({
  tableName: "transaction_types",
  timestamps: true,
  underscored: true,
})
export class TransactionType extends Model<TransactionType> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @IsUUID(4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column({
    type: DataType.STRING,
    unique: true,
  })
  declare type: string;

  @HasMany(() => AllTransaction)
  declare transactions: AllTransaction[];
}
