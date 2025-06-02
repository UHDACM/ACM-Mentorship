import { DocumentTestKey } from "@shared/data/db";
import { NotificationOptions } from "@shared/types/notification";
import { isNotificationOptions } from "@shared/validation/notification";
import { isUserPushSubscriptions } from "@shared/validation/userPushSubscriptions";
import { DBGetWithID, DBSetWithID } from "src/db";
import webpush from "web-push";
import { isUserInSocketMap } from "../AuthenticatedSocket";
import { isUserSettings } from "@shared/validation/userSettings";
import { SettingsAllowNotification } from '@shared/scripts/notification';

export async function TrySendPushNotificationToUsers(
  userIDs: string[],
  title: string,
  notificationOptions: NotificationOptions
) {
  if (!userIDs || !(userIDs instanceof Array) || userIDs.length === 0) return;
  if (!isNotificationOptions(notificationOptions)) {
    throw new Error("Invalid notificationOptions options");
  }

  const promises: Promise<void>[] = userIDs.map((userID) =>
    TrySendPushNotificationToUser(userID, title, notificationOptions)
  );

  await Promise.all(promises);
}

async function TrySendPushNotificationToUser(
  userID: string,
  title: string,
  notificationOptions: NotificationOptions
) {
  console.log("Trying to send push notification to user:", userID);
  if (!userID || typeof userID !== "string") return;
  if (!isNotificationOptions(notificationOptions)) {
    throw new Error("Invalid notificationOptions options");
  }

  const endpointSubscriptions: unknown = await DBGetWithID(
    "userPushSubscriptions",
    userID
  );

  const userSettings = await DBGetWithID("userSettings", userID);
  if (!isUserSettings(userSettings)) return;
  if (!SettingsAllowNotification(userSettings)) return;

  if (!isUserPushSubscriptions(endpointSubscriptions)) {
    return;
  }

  if (isUserInSocketMap(userID)) {
    // user is online, no need to send push notification
    return;
  }

  const promises: Promise<string>[] = Object.keys(endpointSubscriptions).map(
    (endpoint) =>
      new Promise(async (res, rej) => {
        if (endpoint == 'id' || endpoint == DocumentTestKey) {
          // skip
          res(endpoint);
          return;
        }
        const endpointSubscription = endpointSubscriptions[endpoint];

        const { subscription, expiration } = endpointSubscription;

        if (expiration && Date.now() > expiration) {
          // subscription expired, remove it from endpointSubscriptions
          delete endpointSubscriptions[endpoint];
          rej(endpoint);
          return;
        }

        // try to send notificationOptions
        webpush
          .sendNotification(
            subscription,
            JSON.stringify({ title, ...notificationOptions })
          )
          .then(() => res(endpoint))
          .catch(() => {
            rej(endpoint);
          });
      })
  );

  const results = await Promise.allSettled(promises);

  let anyRemoved = false;
  for (const result of results) {
    if (result.status === "rejected") {
      anyRemoved = true;
      // result.reason is the endpoint
      delete endpointSubscriptions[result.reason];
    }
  }
  // if any were removed, update the database
  if (anyRemoved) {
    console.log('Updating push subscriptions for user:', userID);

    // clean up any keys that are not endpoints (asynchronously)
    DBSetWithID("userPushSubscriptions", userID, endpointSubscriptions);
  }
}
