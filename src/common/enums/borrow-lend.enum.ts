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
