import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  IsUUID,
  AllowNull,
} from "sequelize-typescript";
import { Optional } from "sequelize";

export enum PaymentMethodStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

interface PaymentMethodAttributes {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: PaymentMethodStatus;
  createdAt: Date;
  updatedAt: Date;
}

interface PaymentMethodCreationAttributes
  extends Optional<
    PaymentMethodAttributes,
    "id" | "description" | "status" | "createdAt" | "updatedAt"
  > {}

@Table({
  tableName: "payment_methods",
  timestamps: true,
  underscored: true,
})
export class PaymentMethod extends Model<
  PaymentMethodAttributes,
  PaymentMethodCreationAttributes
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @IsUUID(4)
  @Column(DataType.UUID)
  declare id: string;

  // Human-friendly identifier from the sheet, e.g. PM001. Unique.
  @AllowNull(false)
  @Column({ type: DataType.STRING, unique: true })
  declare code: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare name: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare description: string | null;

  @AllowNull(false)
  @Default(PaymentMethodStatus.ACTIVE)
  @Column(DataType.ENUM(...Object.values(PaymentMethodStatus)))
  declare status: PaymentMethodStatus;

  declare createdAt: Date;
  declare updatedAt: Date;
}
