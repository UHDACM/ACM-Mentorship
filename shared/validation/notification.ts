import { NotificationOptions } from "@shared/types/notification";

// TODO: check data field?
export function isNotificationOptions(options: NotificationOptions): options is NotificationOptions {
  const {
    badge,
    body,
    dir,
    icon,
    lang,
    requireInteraction,
    silent,
    tag,
  } = options;

  if (badge !== undefined && typeof badge !== 'string') {
    return false;
  }

  if (body !== undefined && typeof body !== 'string') {
    return false;
  }

  if (dir !== undefined && !['auto', 'ltr', 'rtl'].includes(dir as string)) {
    return false;
  }

  if (icon !== undefined && typeof icon !== 'string') {
    return false;
  }

  if (lang !== undefined && typeof lang !== 'string') {
    return false;
  }

  if (requireInteraction !== undefined && typeof requireInteraction !== 'boolean') {
    return false;
  }

  if (silent !== undefined && silent !== null && typeof silent !== 'boolean') {
    return false;
  }

  if (tag !== undefined && typeof tag !== 'string') {
    return false;
  }

  return true;
}

export function isNotificationOptionsWithTitle(obj: unknown): obj is NotificationOptions & { title: string } {
  if (!isNotificationOptions(obj)) {
    return false;
  }

  const { title } = obj as NotificationOptions & { title: unknown };
  if (typeof title !== 'string') {
    return false;
  }
  
  return true;
}
