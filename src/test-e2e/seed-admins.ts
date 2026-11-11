// npm run test:admins: the two admins the web app's browser tests sign in as
// (removed again by npm run test:cleanup). Safe to run more than once.
import { connectDatabase, disconnectDatabase } from "../infrastructure/database";
import { adminService } from "../modules/admin/admin.service";
import { E2E_ADMINS, PASSWORD } from "./support";

void (async () => {
  await connectDatabase();
  for (const [role, userName] of Object.entries(E2E_ADMINS)) {
    if (await adminService.findByIdentifier(userName)) continue;
    await adminService.createAdmin({
      userName,
      loginMethod: "password",
      password: PASSWORD,
      role: role as keyof typeof E2E_ADMINS,
    });
  }
  console.log(`Test admins ready: ${Object.values(E2E_ADMINS).join(", ")}.`);
  await disconnectDatabase();
})();
