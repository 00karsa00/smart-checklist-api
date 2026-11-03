/** Item returned to API clients. */
export type Item = {
  id: string;
  name: string;
  description: string | null;
  /** Owner, always the signed-in user. */
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};
