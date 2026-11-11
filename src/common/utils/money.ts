/** Decimal places of a currency's minor unit: INR 2, JPY 0, KWD 3. */
export function currencyDigits(currency: string): number {
  return (
    new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions()
      .maximumFractionDigits ?? 2
  );
}

/** 1234.5 INR → 123450; rounds to the nearest minor unit. */
export const toMinorUnits = (amount: number, currency: string) =>
  Math.round(amount * 10 ** currencyDigits(currency));

/** 123450 INR → "1234.50": plain, no grouping, for files. */
export const minorToPlain = (minor: number, currency: string) =>
  (minor / 10 ** currencyDigits(currency)).toFixed(currencyDigits(currency));
