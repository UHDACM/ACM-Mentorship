import { DBObj } from "./general";

export interface UserSettings extends DBObj {
  allowNotifications?: boolean;
  allowNotificationsFor?: {
    messages?: boolean;
    mentorshipRequests?: boolean;
  };
  allowAnalytics?: boolean;
  
  testing?: boolean; // indicates if this is a testing user
};