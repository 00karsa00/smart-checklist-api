export interface TransactionType {
  id: string;
  type: string;
}

export interface TransactionAccount {
  id: string;
  accountName: string;
  bank: string;
}

export interface Transaction {
  id: string;
  transactionDate: string;
  year: number;
  month: number;
  accountId: string;
  account?: TransactionAccount;
  transactionTypeId: string;
  transactionType?: TransactionType;
  amount: string;
  paymentMethod: string | null;
  remarks: string | null;
  note: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
