import { registerNotificationSource } from "../notification/notification.sources";
import { focusDone } from "./time.math";
import { timeService } from "./time.service";

registerNotificationSource({
  group: "focus",
  candidates: async (userId) => focusDone(await timeService.running(userId)),
});
