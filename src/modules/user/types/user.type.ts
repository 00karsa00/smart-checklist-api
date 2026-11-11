/** App user returned to API clients: the basic details only. Secrets never leave the module. */
export type AppUser = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  /** How this user signs in, e.g. "password". */
  loginMethod: string;
  isActive: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/** Public profile of the signed-in user. */
export type UserSession = Pick<AppUser, "id" | "name" | "email" | "phone" | "loginMethod">;
