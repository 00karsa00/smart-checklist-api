import {
  assertAtLeastOne,
  assertOptional,
  idParamGuard,
  isCurrencyCode,
  isIntegerBetween,
  isLocaleTag,
  isTimeZone,
  rejectUnknownFields,
} from "../../common";
import { Guard } from "../../infrastructure/http";

const SETTINGS_FIELDS = ["currency", "locale", "timeZone", "weekStartsOn"] as const;

type Body = Record<string, unknown>;

export const validateSessionIdParam = idParamGuard("Session");

/** Any of the settings, each checked; the currency code is upper-cased. */
export const validateUpdateSettings: Guard = (ctx) => {
  const body = (ctx.body ?? {}) as Body;
  rejectUnknownFields(body, SETTINGS_FIELDS, (field) => `Field '${field}' is not a setting.`);
  assertAtLeastOne(body, SETTINGS_FIELDS);

  if (typeof body.currency === "string") body.currency = body.currency.trim().toUpperCase();
  assertOptional(
    body,
    "currency",
    isCurrencyCode,
    "Field 'currency' must be an ISO 4217 code, e.g. INR.",
  );
  assertOptional(body, "locale", isLocaleTag, "Field 'locale' must be a language tag, e.g. en-IN.");
  assertOptional(
    body,
    "timeZone",
    isTimeZone,
    "Field 'timeZone' must be an IANA time zone, e.g. Asia/Kolkata.",
  );
  assertOptional(
    body,
    "weekStartsOn",
    (value) => isIntegerBetween(value, 0, 6),
    "Field 'weekStartsOn' must be 0 (Sunday) to 6 (Saturday).",
  );
  ctx.body = body;
};
