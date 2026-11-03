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
import { BorrowLend } from "./borrow-lend.model";
import { PersonStatus } from "../../../common/enums/person.enum";

interface PersonAttributes {
  id: string;
  code: string;
  name: string;
  phoneNumber: string | null;
  upiId: string | null;
  status: PersonStatus;
  notes: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

type PersonCreationAttributes = Optional<
  PersonAttributes,
  "id" | "phoneNumber" | "upiId" | "status" | "notes" | "createdAt" | "updatedAt"
>;

@Table({
  tableName: "people",
  timestamps: true,
  underscored: true,
})
export class Person extends Model<PersonAttributes, PersonCreationAttributes> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @IsUUID(4)
  @Column(DataType.UUID)
  declare id: string;

  // Human-friendly identifier, e.g. PPL001. Unique per user.
  @AllowNull(false)
  @Column(DataType.STRING)
  declare code: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare name: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare phoneNumber: string | null;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare upiId: string | null;

  @AllowNull(false)
  @Default(PersonStatus.ACTIVE)
  @Column(DataType.ENUM(...Object.values(PersonStatus)))
  declare status: PersonStatus;

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare notes: string | null;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Index
  @Column(DataType.UUID)
  declare userId: string;

  @BelongsTo(() => User)
  declare user: User;

  // Borrow/Lend/UPI amount columns from the sheet's People tab are computed
  // via aggregate queries in the service, never stored on this row.
  @HasMany(() => BorrowLend)
  declare borrowLendEntries: BorrowLend[];

  declare createdAt: Date;
  declare updatedAt: Date;
}
