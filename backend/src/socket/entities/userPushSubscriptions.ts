import webpush, { WebPushError } from "web-push";
import {
  userPushSubscriptionTestMessage,
  userPushSubscriptionTTL,
} from "@shared/data/userPushSubscriptions";
import { DBGetWithID, DBSetWithID } from "../../../src/db";
import { isUserPushSubscriptions } from "@shared/validation/userPushSubscriptions";
import {
  PushSubscription,
  UserPushSubscriptions,
} from "@shared/types/userPushSubscriptions";
import { sleep } from "../../../src/scripts/tools";
import env from "../../env/env";

webpush.setVapidDetails(
  env.VAPID_SUBJECT,
  env.VAPID_PUBLIC_KEY,
  env.VAPID_PRIVATE_KEY
);

// A sample testing subscription to use to indicate this userPushSubscription belongs to a testing user
const TestingUserPushSubscription: UserPushSubscriptions = {
  testing: {
    subscription: {
      endpoint: "",
      expirationTime: null,
      keys: { p256dh: "", auth: "" },
    },
    expiration: 0,
  },
};

/**
 * Adds or updates a user's push subscription in the database.
 *
 * This function is responsible for validating a push subscription, ensuring the user exists,
 * and storing the subscription in the database. It also handles updating an existing subscription
 * if the endpoint already exists for the user.
 *
 * @param {string} userID - The unique identifier of the user.
 * @param {PushSubscription} sub - The push subscription object containing endpoint and keys.
 *
 * @returns {Promise<boolean>} - Returns `true` if the subscription was successfully added or updated,
 *                               and `false` if any step in the process fails.
 *
 * @throws {Error} - Catches and handles any errors during the process, returning `false` instead.
 *
 * ### Process:
 * 1. **Validate Subscription**: Sends a test notification to the provided subscription endpoint.
 *    - If the test fails, the function returns `false`.
 * 2. **Ensure User Exists**: Checks if the user exists in the database.
 *    - If the user does not exist, the function returns `false`.
 * 3. **Store Subscription**:
 *    - Retrieves the user's existing push subscriptions from the database.
 *    - Adds or updates the subscription for the given endpoint.
 *    - Sets the expiration time for the subscription (e.g., 7 days from now).
 * 4. **Save to Database**: Saves the updated subscription object back to the database.
 *    - If any database operation fails, the function returns `false`.
 *
 * ### Example Usage:
 * ```typescript
 * const subscription: PushSubscription = {
 *   endpoint: "https://example.com/endpoint",
 *   keys: {
 *     p256dh: "publicKey",
 *     auth: "authKey"
 *   }
 * };
 * const result = await AddUserPushSubscription("user123", subscription);
 * console.log(result); // true or false
 * ```
 */
export async function AddUserPushSubscription(
  userID: string,
  sub: PushSubscription,
  testing?: boolean
): Promise<boolean> {
  try {
    // tests the endpoint by sending a test notification
    const isValid = await TestPushSubscription(sub);
    if (!isValid) return false;

    // ensure user exists
    const user = await DBGetWithID("user", userID);
    if (!user) return false;

    // store subscription in database
    let userPushSubscriptions: UserPushSubscriptions =
      (await DBGetWithID("userPushSubscriptions", userID)) || {};

    if (!isUserPushSubscriptions(userPushSubscriptions)) {
      // invalid data in database, reset
      console.error(
        `Invalid userPushSubscriptions data for user: \n\n${JSON.stringify(
          userPushSubscriptions,
          null,
          2
        )}\n\n${userID}, resetting.`
      );
      userPushSubscriptions = testing ? TestingUserPushSubscription : {};
    }

    // add or update subscription
    userPushSubscriptions[sub.endpoint] = {
      subscription: sub,
      expiration: Date.now() + userPushSubscriptionTTL, // 7 days from now
    };

    // save back to database
    await DBSetWithID("userPushSubscriptions", userID, userPushSubscriptions);
  } catch {
    return false;
  }
  return true;
}

export async function TestPushSubscription(sub: PushSubscription, depth = 0) {
  if (depth > 3) {
    console.error("TestPushSubscription: Max retries reached");
    return false;
  }

  let resultCode: number = -1,
    resultHeader: webpush.Headers = {},
    resultBody: string = null;
  try {
    const response = await webpush.sendNotification(
      sub,
      userPushSubscriptionTestMessage
    );
    resultCode = response.statusCode;
    resultHeader = response.headers;
    resultBody = response.body;
  } catch (err: unknown) {
    if (err instanceof WebPushError) {
      const code = err.statusCode;
      resultCode = code;
      resultHeader = err.headers;
      resultBody = err.body;
    } else {
      console.error("TestPushSubscription error:", err);
      return false;
    }
  }

  if (resultCode >= 200 && resultCode < 300) {
    // success
    console.log("TestPushSubscription success");
    return true;
  } else if (resultCode == 404 || resultCode == 410) {
    console.error(
      "TestPushSubscription: Subscription is no longer valid (404/410)"
    );
    return false;
  } else if (resultCode == 400 || resultCode < 413) {
    console.error(
      "TestPushSubscription: Payload error:",
      resultCode,
      resultBody
    );
    return false;
  } else if (resultCode == 429) {
    const retryAfter = resultHeader["Retry-After"];
    if (retryAfter) {
      const waitTime = parseInt(retryAfter, 10) * 1000;
      console.warn(
        `TestPushSubscription: Rate limited, retrying after ${waitTime}ms`
      );
      await sleep(waitTime);
    } else {
      console.warn(
        "TestPushSubscription: Rate limited, retrying after default 1s"
      );
      await sleep(1000 * Math.pow(2, depth)); // exponential backoff
    }
    return await TestPushSubscription(sub, depth + 1);
  } else {
    console.error(
      "TestPushSubscription: Unexpected error:",
      resultCode,
      resultBody
    );
    return false;
  }
}
