import { UserSettings } from "@shared/types/userSettings";

// used by frontend and backend to check if userSettings allows notifications
export function SettingsAllowNotification(userSettings: UserSettings | undefined): boolean {
  return userSettings?.allowNotifications ?? false;
}
