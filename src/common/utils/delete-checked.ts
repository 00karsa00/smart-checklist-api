/**
 * Delete a record the user may use: `check` first (it throws 404 when the
 * record is not theirs), then `remove`. Resolves null, as DELETE routes answer.
 */
export async function deleteChecked(
  check: () => Promise<unknown>,
  remove: () => Promise<void>,
): Promise<null> {
  await check();
  await remove();
  return null;
}
