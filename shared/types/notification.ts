
// copy and paste from MDN: https://developer.mozilla.org/en-US/docs/Web/API/Notification/Notification#options
// allows for easier notification handling in both backend and frontend

// note: data has been modified
export interface NotificationOptions {
  badge?: string;
  body?: string;
  data?: {
    url?: string;
    action?: string;
    actionArgs?: string[];
  };
  dir?: NotificationDirection;
  icon?: string;
  lang?: string;
  requireInteraction?: boolean;
  silent?: boolean | null;
  tag?: string;
}