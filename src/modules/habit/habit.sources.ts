import { registerNotificationSource } from "../notification/notification.sources";
import { profileService } from "../profile/profile.service";
import { registerSearchSource, searchInList } from "../search/search.sources";
import { habitService } from "./habit.service";
import { habitReminders } from "./habit.stats";

registerNotificationSource({
  group: "habits",
  candidates: async (userId) => {
    const [habits, now] = await Promise.all([
      habitService.list(userId),
      profileService.now(userId),
    ]);
    return habitReminders(habits, now);
  },
});

registerSearchSource({
  kind: "habit",
  search: async (userId, query, limit) =>
    searchInList(
      await habitService.list(userId, true),
      query,
      limit,
      (habit) => habit.title,
      (habit) => ({
        kind: "habit",
        id: habit.id,
        title: habit.title,
        data: { streak: String(habit.currentStreak), archived: habit.isArchived ? "true" : null },
      }),
      (habit) => habit.description,
    ),
});
