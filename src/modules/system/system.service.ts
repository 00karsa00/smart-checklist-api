import { configuration } from "../../config/configuration";

import { todayIn } from "../../common";
import { lastMonths, fillMonths } from "./system.math";
import { systemRepository, SystemRepository } from "./system.repository";
import { SystemOverview } from "./types/system.type";

/** The app as a whole, for admins: who uses it, how much, failed sign-ins, and server health. */
export class SystemService {
  constructor(private readonly system: SystemRepository = systemRepository) {}

  async overview(): Promise<SystemOverview> {
    const timeZone = configuration.userDefaults.timeZone;
    const months = lastMonths(todayIn(timeZone), 12);
    // The database first: if it is down, the rest cannot load either.
    const database = await this.system.database();
    const [counts, usage, signups] = await Promise.all([
      this.system.counts(),
      this.system.usage(),
      this.system.signupsByMonth(`${months[0]}-01`, timeZone),
    ]);
    return {
      generatedAt: new Date().toISOString(),
      ...counts,
      usage,
      users: { ...counts.users, signupsByMonth: fillMonths(months, signups) },
      system: {
        version: configuration.app.version,
        environment: configuration.app.env,
        nodeVersion: process.version,
        uptimeSeconds: Math.round(process.uptime()),
        memoryBytes: process.memoryUsage().rss,
        database,
      },
    };
  }
}

export const systemService = new SystemService();
