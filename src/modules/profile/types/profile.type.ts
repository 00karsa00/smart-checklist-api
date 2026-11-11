/** A user's preferences (GET /profile/user/settings). */
export type UserSettings = {
  /** ISO 4217, e.g. "INR": how amounts are shown when an item has none of its own. */
  currency: string;
  /** BCP 47, e.g. "en-IN": how numbers, dates and money are shown. */
  locale: string;
  /** IANA, e.g. "Asia/Kolkata": which calendar day something happened on. */
  timeZone: string;
  /** 0 = Sunday … 6 = Saturday. */
  weekStartsOn: number;
};
