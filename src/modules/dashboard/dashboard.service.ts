import { profileService, ProfileService } from "../profile/profile.service";
import { taskService, TaskService } from "../task/task.service";
import { DueFilter } from "../task/types/task.type";
import { workspaceService, WorkspaceService } from "../workspace/workspace.service";
import { Dashboard, DASHBOARD_LIMITS } from "./types/dashboard.type";

const WEEK = 7;

/** The user's day at a glance, put together from tasks and projects. */
export class DashboardService {
  constructor(
    private readonly tasks: TaskService = taskService,
    private readonly workspaces: WorkspaceService = workspaceService,
    private readonly profiles: ProfileService = profileService,
  ) {}

  async get(userId: string): Promise<Dashboard> {
    const page = (due: DueFilter, limit: number) =>
      this.tasks.list(userId, { due, includeDone: false }, { page: 1, limit });
    const [today, overdue, dueToday, upcoming, noDate, completed, projects, progress] =
      await Promise.all([
        this.profiles.today(userId),
        page("overdue", DASHBOARD_LIMITS.overdue),
        page("today", DASHBOARD_LIMITS.dueToday),
        page("upcoming", DASHBOARD_LIMITS.upcoming),
        page("none", 1),
        this.tasks.completedPerDay(userId, WEEK),
        this.workspaces.listProjects(userId, { status: "active", includeArchived: false }),
        this.tasks.progressByProject(userId),
      ]);
    return {
      today,
      counts: {
        overdue: overdue.pagination.total,
        dueToday: dueToday.pagination.total,
        upcoming: upcoming.pagination.total,
        noDate: noDate.pagination.total,
        completedToday: completed.at(-1)?.count ?? 0,
        completedThisWeek: completed.reduce((sum, day) => sum + day.count, 0),
      },
      overdue: overdue.items,
      dueToday: dueToday.items,
      upcoming: upcoming.items,
      // Projects come overdue first, then by due date: the order listProjects gives.
      projects: projects.slice(0, DASHBOARD_LIMITS.projects).map((project) => ({
        ...project,
        progress: progress.get(project.id) ?? { done: 0, total: 0 },
      })),
      completedByDay: completed,
    };
  }
}

export const dashboardService = new DashboardService();
