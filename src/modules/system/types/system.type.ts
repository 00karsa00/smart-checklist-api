export type MonthCount = { /** YYYY-MM */ month: string; count: number };

/** One kind of record and how many there are, e.g. { key: "tasks", count: 120 }. */
export type UsageCount = { key: string; count: number };

/** GET /system/overview: counts across all users (never anyone's content) and server health. */
export type SystemOverview = {
  generatedAt: string;
  users: {
    total: number;
    active: number;
    inactive: number;
    new30Days: number;
    /** Distinct users with a successful sign-in in the period. */
    signedIn7Days: number;
    signedIn30Days: number;
    /** The last 12 months, oldest first, months without sign-ups included. */
    signupsByMonth: MonthCount[];
  };
  admins: { total: number; active: number };
  /** How many records users keep, all users together (see USAGE_TABLES). */
  usage: UsageCount[];
  security: {
    /** The last 24 hours. */
    failedSignIns: { users: number; admins: number };
    successfulSignIns: { users: number; admins: number };
  };
  system: {
    version: string;
    environment: string;
    nodeVersion: string;
    uptimeSeconds: number;
    memoryBytes: number;
    database: {
      status: "ok" | "down";
      latencyMs: number | null;
      sizeBytes: number | null;
      version: string | null;
      migrations: { applied: number; latest: string | null };
    };
  };
};
