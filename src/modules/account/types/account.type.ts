import { AccountType, AccountStatus } from "../../../infrastructure/database/models/accounts.model";

export interface Account {
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
