import { between, containsText, LoginLogTable, Where } from "../../infrastructure/database";

import { LoginLogFilter } from "./dto/account.dto";
import { LoginLog, LoginLogEntry } from "./types/account.type";

// Database column limits; longer values are cut rather than rejected.
const MAX_USER_AGENT = 500;

export type PaginatedLoginLogs = {
  rows: LoginLog[];
  count: number;
};

/** One account kind's login log (admin_login_log, app_user_login_log, …). Insert-only. */
export class LoginLogRepository {
  /** `maxIdentifier` is the identifier column's length. */
  constructor(
    private readonly table: LoginLogTable,
    private readonly maxIdentifier: number,
  ) {}

  async create(entry: LoginLogEntry): Promise<void> {
    await this.table.create({
      ...entry,
      identifier: entry.identifier.slice(0, this.maxIdentifier),
      userAgent: entry.userAgent?.slice(0, MAX_USER_AGENT) ?? null,
    });
  }

  /** Newest first. */
  async findAll(
    offset: number,
    limit: number,
    filter: LoginLogFilter,
  ): Promise<PaginatedLoginLogs> {
    const where: Where = {};
    if (filter.search) where.identifier = containsText(filter.search);
    if (filter.accountId) where.accountId = filter.accountId;
    if (filter.status) where.isSuccess = filter.status === "success";

    const createdAt = between(
      filter.from ? new Date(`${filter.from}T00:00:00`) : undefined,
      filter.to ? new Date(`${filter.to}T23:59:59.999`) : undefined,
    );
    if (createdAt) where.createdAt = createdAt;

    const { rows, count } = await this.table.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      offset,
      limit,
    });
    return { rows: rows.map((row) => row.get({ plain: true }) as LoginLog), count };
  }
}
