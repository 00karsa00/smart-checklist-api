import { ClientInfo } from "../../accounts";

/** Where a sign-in attempt came from, for the login log and the session. */
export type LoginClient = ClientInfo;

/** Admin step 1. `userName` is normalised by the validator. */
export type AdminIdentifyDto = {
  userName: string;
};

/** User step 1: email or phone, normalised by the validator. */
export type UserIdentifyDto = {
  identifier: string;
};

/**
 * Step 2: the step-1 field plus the fields the login method needs
 * (`password` for "password"; future methods add their own fields).
 */
export type LoginCredentials = {
  password?: string;
};

export type AdminLoginDto = AdminIdentifyDto & LoginCredentials;
export type UserLoginDto = UserIdentifyDto & LoginCredentials;

export type ValidateTokenDto = {
  token: string;
};

/** POST …/refresh and …/logout. */
export type RefreshTokenDto = {
  refreshToken: string;
};
