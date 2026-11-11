import { UpdateUserDto } from "../../user/dto/user.dto";
import { UserSettings } from "../types/profile.type";

/** What a user may change on their own profile (normalised by the validator). */
export type UpdateProfileDto = Pick<UpdateUserDto, "name" | "email" | "phone">;

/** Any of the settings; the validator normalises currency to upper case. */
export type UpdateSettingsDto = Partial<UserSettings>;
