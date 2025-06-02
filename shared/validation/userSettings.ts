import { UserSettings } from "@shared/types/userSettings";
import { isDBObj } from "./general";

export function isUserSettings(settings: any): settings is UserSettings {
  if (!isDBObj(settings)) {
    return false;
  }

  const { allowNotifications, allowNotificationsFor, allowAnalytics } = settings as UserSettings;

  if (allowNotifications !== undefined && typeof allowNotifications !== 'boolean') {
    return false;
  }

  if (allowNotificationsFor !== undefined) {
    if (typeof allowNotificationsFor !== 'object' || allowNotificationsFor === null) {
      return false;
    }

    const { messages, mentorshipRequests } = allowNotificationsFor;
    
    if (messages !== undefined && typeof messages !== 'boolean') {
      return false;
    }

    if (mentorshipRequests !== undefined && typeof mentorshipRequests !== 'boolean') {
      return false;
    }
  }

  if (allowAnalytics !== undefined && typeof allowAnalytics !== 'boolean') {
    return false;
  }

  return true;
}

// TODO: In the future, more specific validation can be added (e.g., checking for required fields)
export function validateUserSettings(settings: unknown): asserts settings is UserSettings {
  if (!isUserSettings(settings)) {
    throw new Error("Invalid user settings");
  }
}