// npm run test:cleanup: remove the accounts API and browser tests created
// (names starting with "e2e-"), e.g. after a run was stopped half-way.
import { connectDatabase, disconnectDatabase } from "../infrastructure/database";
import { cleanup } from "./support";

void (async () => {
  await connectDatabase();
  const removed = await cleanup();
  console.log(`Removed ${removed.users} test users and ${removed.admins} test admins.`);
  await disconnectDatabase();
})();
