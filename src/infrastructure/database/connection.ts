import { QueryTypes, Transaction } from "sequelize";
import { ModelCtor, Sequelize } from "sequelize-typescript";

import { databaseConfig } from "../../config/database.config";
import { AdminLoginLogModel } from "./models/admin-login-log.model";
import { AdminSessionModel } from "./models/admin-session.model";
import { AdminUserPasswordModel } from "./models/admin-user-password.model";
import { AdminUserModel } from "./models/admin-user.model";
import { AppUserLoginLogModel } from "./models/app-user-login-log.model";
import { AppUserSettingsModel } from "./models/app-user-settings.model";
import { AppUserSessionModel } from "./models/app-user-session.model";
import { AppUserPasswordModel } from "./models/app-user-password.model";
import { AppUserModel } from "./models/app-user.model";
import { NotificationModel, NotificationSettingModel } from "./models/notification.model";
import { AdminAuditLogModel } from "./models/admin-audit-log.model";
import { ProjectModel, WorkspaceModel } from "./models/workspace.model";
import { LabelModel } from "./models/label.model";
import { TaskModel, TaskTagModel } from "./models/task.model";

// Register every model here when you create a table, e.g.
//   import { Item } from "./models/item.model";
//   const MODELS = [Item];
const MODELS: ModelCtor[] = [
  AdminUserModel,
  AdminUserPasswordModel,
  AdminLoginLogModel,
  AdminSessionModel,
  AppUserModel,
  AppUserPasswordModel,
  AppUserLoginLogModel,
  AppUserSessionModel,
  AppUserSettingsModel,
  NotificationModel,
  NotificationSettingModel,
  AdminAuditLogModel,
  WorkspaceModel,
  ProjectModel,
  LabelModel,
  TaskModel,
  TaskTagModel,
];

const sequelize = new Sequelize(
  databaseConfig.database,
  databaseConfig.username,
  databaseConfig.password,
  {
    host: databaseConfig.host,
    port: databaseConfig.port,
    dialect: "postgres",
    logging: databaseConfig.logging ? console.log : false,
    models: MODELS,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
);

/** Open the connection pool and verify the database is reachable. */
export async function connectDatabase(): Promise<void> {
  await sequelize.authenticate();
}

export async function disconnectDatabase(): Promise<void> {
  await sequelize.close();
}

/** An open transaction; repositories pass it to each query as `{ transaction }`. */
export type DbTransaction = Transaction;

/** Run `work` in one transaction: committed when it resolves, rolled back when it throws. */
export function withTransaction<T>(work: (transaction: DbTransaction) => Promise<T>): Promise<T> {
  return sequelize.transaction(work);
}

/**
 * Run a read-only SQL query with named `:replacements` and return its rows.
 * For aggregates the model API cannot express; repositories only.
 */
export function selectRows<T extends object>(
  sql: string,
  replacements: Record<string, unknown>,
): Promise<T[]> {
  return sequelize.query<T>(sql, { replacements, type: QueryTypes.SELECT });
}
