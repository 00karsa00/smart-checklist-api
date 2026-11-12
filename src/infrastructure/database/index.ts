export { connectDatabase, disconnectDatabase, selectRows, withTransaction } from "./connection";
export type { DbTransaction } from "./connection";
export {
  between,
  containsText,
  isForeignKeyViolation,
  isUniqueViolation,
  matchAny,
  notEqual,
  oneOf,
  requireAny,
} from "./query";
export type { Where } from "./query";

// Export each model from ./models here so repositories import it from this folder.
export { AdminAuditLogModel } from "./models/admin-audit-log.model";
export { AdminLoginLogModel } from "./models/admin-login-log.model";
export { AdminSessionModel } from "./models/admin-session.model";
export { AdminUserPasswordModel } from "./models/admin-user-password.model";
export { AdminUserModel } from "./models/admin-user.model";
export { AppUserLoginLogModel } from "./models/app-user-login-log.model";
export { AppUserSettingsModel } from "./models/app-user-settings.model";
export { AppUserSessionModel } from "./models/app-user-session.model";
export { AppUserPasswordModel } from "./models/app-user-password.model";
export { AppUserModel } from "./models/app-user.model";
export { NotificationModel, NotificationSettingModel } from "./models/notification.model";
export { ProjectModel, WorkspaceModel } from "./models/workspace.model";
export { LabelModel } from "./models/label.model";
export { TaskModel, TaskTagModel } from "./models/task.model";
export { NoteItemModel, NoteModel } from "./models/note.model";
export { GoalMilestoneModel, GoalModel, GoalProjectModel } from "./models/goal.model";
export { HabitCheckModel, HabitModel } from "./models/habit.model";
export { TimeEntryModel } from "./models/time-entry.model";
export type {
  LoginLogTable,
  PasswordTable,
  SessionAttributes,
  SessionTable,
} from "./models/account-tables";
