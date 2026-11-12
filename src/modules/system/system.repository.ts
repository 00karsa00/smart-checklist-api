import { selectRows } from "../../infrastructure/database";

import { MonthCount, SystemOverview, UsageCount } from "./types/system.type";

// Counts across every user, for admins. Only how many: never anyone's content.

/**
 * What users keep, all users together: the name shown to admins and its table.
 * A new feature adds one line here. Table names are fixed strings, never input.
 */
export const USAGE_TABLES: Readonly<Record<string, string>> = {
  workspaces: "workspace",
  projects: "project",
  labels: "label",
  tasks: "task",
  notes: "note",
  goals: "goal",
  notifications: "notification",
};

const USAGE_SQL = Object.entries(USAGE_TABLES)
  .map(([key, table]) => `SELECT '${key}' AS key, COUNT(*) AS count FROM ${table}`)
  .join(" UNION ALL ");

const COUNTS_SQL = `
  SELECT
    (SELECT COUNT(*) FROM app_user) AS users,
    (SELECT COUNT(*) FROM app_user WHERE is_active) AS users_active,
    (SELECT COUNT(*) FROM app_user WHERE created_at >= NOW() - INTERVAL '30 days') AS users_new_30,
    (SELECT COUNT(DISTINCT app_user_id) FROM app_user_login_log
      WHERE is_success AND created_at >= NOW() - INTERVAL '7 days') AS signed_in_7,
    (SELECT COUNT(DISTINCT app_user_id) FROM app_user_login_log
      WHERE is_success AND created_at >= NOW() - INTERVAL '30 days') AS signed_in_30,
    (SELECT COUNT(*) FROM admin_user) AS admins,
    (SELECT COUNT(*) FROM admin_user WHERE is_active) AS admins_active,
    (SELECT COUNT(*) FROM app_user_login_log
      WHERE NOT is_success AND created_at >= NOW() - INTERVAL '24 hours') AS user_failed,
    (SELECT COUNT(*) FROM admin_login_log
      WHERE NOT is_success AND created_at >= NOW() - INTERVAL '24 hours') AS admin_failed,
    (SELECT COUNT(*) FROM app_user_login_log
      WHERE is_success AND created_at >= NOW() - INTERVAL '24 hours') AS user_ok,
    (SELECT COUNT(*) FROM admin_login_log
      WHERE is_success AND created_at >= NOW() - INTERVAL '24 hours') AS admin_ok`;

const SIGNUPS_SQL = `
  SELECT to_char(created_at AT TIME ZONE :timeZone, 'YYYY-MM') AS month, COUNT(*) AS count
    FROM app_user
   WHERE created_at >= :since
   GROUP BY 1`;

const DATABASE_SQL = `
  SELECT pg_database_size(current_database()) AS size,
         current_setting('server_version') AS version,
         (SELECT COUNT(*) FROM "SequelizeMeta") AS applied,
         (SELECT MAX(name) FROM "SequelizeMeta") AS latest`;

type Counts = Record<string, string>;

/** Everything in the overview that comes from counting rows (sign-ups by month apart). */
export type SystemCounts = Pick<SystemOverview, "admins" | "security"> & {
  users: Omit<SystemOverview["users"], "signupsByMonth">;
};

/** Reads for the system overview. */
export class SystemRepository {
  async counts(): Promise<SystemCounts> {
    const [row] = await selectRows<Counts>(COUNTS_SQL, {});
    const n = (key: string) => Number(row[key] ?? 0);
    return {
      users: {
        total: n("users"),
        active: n("users_active"),
        inactive: n("users") - n("users_active"),
        new30Days: n("users_new_30"),
        signedIn7Days: n("signed_in_7"),
        signedIn30Days: n("signed_in_30"),
      },
      admins: { total: n("admins"), active: n("admins_active") },
      security: {
        failedSignIns: { users: n("user_failed"), admins: n("admin_failed") },
        successfulSignIns: { users: n("user_ok"), admins: n("admin_ok") },
      },
    };
  }

  /** How many records of each kind, in USAGE_TABLES order. */
  async usage(): Promise<UsageCount[]> {
    const rows = await selectRows<{ key: string; count: string }>(USAGE_SQL, {});
    const counts = new Map(rows.map((row) => [row.key, Number(row.count)]));
    return Object.keys(USAGE_TABLES).map((key) => ({ key, count: counts.get(key) ?? 0 }));
  }

  /** Sign-ups per month (in `timeZone`) since `since`. */
  async signupsByMonth(since: string, timeZone: string): Promise<MonthCount[]> {
    const rows = await selectRows<{ month: string; count: string }>(SIGNUPS_SQL, {
      since,
      timeZone,
    });
    return rows.map((row) => ({ month: row.month, count: Number(row.count) }));
  }

  /** Database size, version and migrations, with how long a query took. */
  async database(): Promise<SystemOverview["system"]["database"]> {
    const started = performance.now();
    try {
      const [row] = await selectRows<{
        size: string;
        version: string;
        applied: string;
        latest: string | null;
      }>(DATABASE_SQL, {});
      return {
        status: "ok",
        latencyMs: Math.round(performance.now() - started),
        sizeBytes: Number(row.size),
        version: row.version,
        migrations: { applied: Number(row.applied), latest: row.latest },
      };
    } catch {
      return {
        status: "down",
        latencyMs: null,
        sizeBytes: null,
        version: null,
        migrations: { applied: 0, latest: null },
      };
    }
  }
}

export const systemRepository = new SystemRepository();
