import { DocumentTestKey } from "@shared/data/db";
import { PushSubscription, UserPushSubscriptions } from "@shared/types/userPushSubscriptions";

/**
 * Very similar to isPushSubscriptionJSON, but checks for the actual PushSubscription type (used in backend, defined in shared)
 * @param sub 
 * @returns 
 */
export function isPushSubscription(sub: unknown): sub is PushSubscription {
	if (typeof sub !== 'object' || sub === null) return false;

  const s = sub as PushSubscription;
  const { endpoint, expirationTime, keys } = s;
  if (typeof endpoint !== 'string') return false;
  if (expirationTime !== null && typeof expirationTime !== 'number') return false;
  if (typeof keys !== 'object' || keys === null) return false;

  const { p256dh, auth } = keys;
  // TODO: further validate that these are base64 strings?
  if (typeof p256dh !== 'string') return false;
  if (typeof auth !== 'string') return false;

  return true;
}

export function isUserPushSubscriptions(obj: unknown): obj is UserPushSubscriptions {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }

  if (Array.isArray(obj)) {
    return false;
  }

  const subscriptionObj = obj as UserPushSubscriptions;

  for (const endpoint in subscriptionObj) {
    if (endpoint === DocumentTestKey || endpoint == "id") {
      // skip testing or id flag
      // id is usually included when fetched from database
      continue;
    }

    const entry = subscriptionObj[endpoint];
    if (typeof entry !== "object" || entry === null) {
      return false;
    }

    const { subscription, expiration } = entry;
    if (!isPushSubscription(subscription)) {
      return false;
    }
    if (typeof expiration !== "number") {
      return false;
    }
  }

  return true;
}