import { UserSettings } from "@shared/types/userSettings";
import { DBGetWithID, DBSetWithID } from "../../../src/db";
import { isUserSettings } from "@shared/validation/userSettings";

export async function GetUserSettings(userID: string): Promise<UserSettings | undefined> {
  const userSettings = await DBGetWithID("userSettings", userID);
  if (!isUserSettings(userSettings)) {
    return undefined;
  }

  return userSettings;
}


export async function UpdateUserSettings(userID: string, settings: UserSettings, testing?: boolean): Promise<boolean> {
  try {
    // Validate settings before updating
    if (!isUserSettings(settings)) {
      throw new Error("Invalid user settings");
    }

    if (typeof testing === "boolean") {
      settings.testing = testing;
    }
    await DBSetWithID("userSettings", userID, {...settings, testing });
    return true;
  } catch (error) {
    // console.error(`Failed to update user settings for userID ${userID}:`, error);
    return false;
  }
}