import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setNotificationsAllowed } from "./NotificationManagerSlice";
import { ReduxRootState } from "../../../src/store";
import { MyClientSocket } from "../ClientSocket/ClientSocketHandler";
import { sleep, urlBase64ToUint8Array } from "@shared/scripts/generalTools";
import { isPushSubscription } from "@shared/validation/userPushSubscriptions";
import { SettingsAllowNotification } from "@shared/scripts/notification";

export default function NotificationManager() {
  const dispatch = useDispatch();
  // Check if the browser supports service workers
  // this can be done before hooks because it doesn't rely on any react state
  if (!("serviceWorker" in navigator)) {
    console.error("Service workers are not supported in this browser.");
    return;
  }

  // Handles state changes for notification permissions (state passed by useEffect below)
  const handleNotificationState = (permission: PermissionState) => {
    if (permission == "granted") {
      // update the redux state here to true
      dispatch(setNotificationsAllowed(true));
    } else {
      // update the redux state here to false
      dispatch(setNotificationsAllowed(false));
    }
  };

  // useEffect to check notification permissions on component mount
  useEffect(() => {
    // TODO: handle browsers that do not support the Permissions API
    // i.e.: poll Notification.permission every few seconds

    const checkPermission = () => {
      const current = Notification.permission;

      if (
        notificationsAllowed &&
        (current == "default" || current == "denied")
      ) {
        handleNotificationState("denied");
      } else if (!notificationsAllowed && current == "granted") {
        handleNotificationState("granted");
      }
    };

    const check = async () => {
      checkPermission();
      setInterval(checkPermission, 5000); // poll every 5 seconds for browsers that don't support Permissions API
      try {
        const permission = await navigator.permissions.query({
          name: "notifications",
        });
        handleNotificationState(permission.state);
        permission.onchange = () => {
          handleNotificationState(permission.state);
        };
      } catch {}
    };
    check();
  }, []);

  const { notificationsAllowed } = useSelector(
    (state: ReduxRootState) => state.NotificationManager
  );
  const {
    state: ClientSocketState,
    previousUserID,
    userSettings,
  } = useSelector((state: ReduxRootState) => state.ClientSocket);

  // useEffect to register service worker when notifications are allowed and client socket is connected
  useEffect(() => {
    const updateSubscription = async () => {
      console.log("NotificationManager: updateSubscription called");
      if (!("serviceWorker" in navigator)) return; // exits if service workers not supported

      if (!MyClientSocket) return;
      if (ClientSocketState == "connecting") return;

      let alreadyUnsubscribed = false;
      const tryUnsubscribe = async () => {
        !alreadyUnsubscribed && (await UnsubscribeFromNotifications());
        alreadyUnsubscribed = true;
      };

      if (ClientSocketState == "authed_nouser") {
        // if we are authed, but user doesn't have an account, we cannot register for notifications
        console.log(
          "NotificationManager: user is authed_nouser, unsubscribing from notifications"
        );
        await tryUnsubscribe();
        return;
      }

      // at this point, user has an account and socket is connected
      if (!MyClientSocket.user) {
        await sleep(1000); // wait a bit for user info to load
        if (!MyClientSocket.user) {
          console.log(
            "NotificationManager: user is still not available after wait, unsubscribing from notifications"
          );
          await tryUnsubscribe();
          return;
        }
      } // should not happen, but just to make typescript happy
      console.log(
        `NotificationManager: user is authed, checking notification subscription`,
        MyClientSocket.user
      );

      if (previousUserID == undefined) {
        // first time registering, no previous user
        console.log(
          "NotificationManager: waiting for previous user ID to be defined"
        );
        return;
      }

      if (previousUserID !== MyClientSocket.user.id) {
        // user has changed, unsubscribe from previous notifications
        // with that said, we can proceed to register for their own notifications
        console.log(
          `NotificationManager: user changed (${previousUserID} | ${MyClientSocket.user.id}) unsubscribing from previous notifications`
        );
        await tryUnsubscribe();
      }

      if (notificationsAllowed === undefined) {
        // still waiting on browser permission state
        console.log(
          "NotificationManager: notificationsAllowed is undefined, waiting"
        );
        return;
      }

      if (!notificationsAllowed) {
        // by this point, a user (previous or current) is authed and has an account
        // but notifications are not allowed, so we unsubscribe from any existing notifications
        console.log(
          "NotificationManager: notifications are not allowed by browser, unsubscribing"
        );
        await tryUnsubscribe();
      }

      if (!SettingsAllowNotification(userSettings)) {
        // user has disabled notifications in their settings, unsubscribe from any existing notifications
        console.log(
          "NotificationManager: user has disabled notifications in settings, unsubscribing",
          userSettings
        );
        await tryUnsubscribe();
        return;
      }

      // at this point, we have a connected socket, a user with an account, and notifications are allowed
      // we may already be subscribed, so check that first (and its validity)
      console.log(
        "NotificationManager: checking existing notification subscription"
      );
      const subscription = await GetNotificationSubscription();
      console.log("got existing subscription:", subscription);
      if (subscription) {
        const subscriptionJSON = subscription.toJSON();
        if (!isPushSubscription(subscriptionJSON)) {
          // invalid subscription, unsubscribe and proceed to re-subscribe
          console.log(
            "NotificationManager: existing subscription is invalid, unsubscribing"
          );
          await tryUnsubscribe();
        }
        // if its valid, backend will save it, so just return after
        else if (
          await MyClientSocket.SetNotificationSubscription(subscriptionJSON)
        ) {
          // Successfully set notification subscription
          return;
        }
      }

      console.log("NotificationManager: subscribing to notifications");
      // subscribe to notifications
      const newSubscription = await SubscribeToNotifications();
      console.log("got new subscription:", newSubscription);
      alreadyUnsubscribed = false; // reset this in case we unsubscribed earlier
      if (newSubscription) {
        const subscriptionJSON = newSubscription.toJSON();

        if (!isPushSubscription(subscriptionJSON)) {
          // invalid subscription, unsubscribe and proceed to re-subscribe
          console.log(
            "NotificationManager: existing subscription is invalid, unsubscribing"
          );
          await tryUnsubscribe();
          return;
        }

        // send subscription info to server via client socket
        const response = await MyClientSocket.SetNotificationSubscription(
          subscriptionJSON
        );
        console.log("Set notification subscription response:", response);
      } else {
        console.error("Failed to subscribe to notifications.");
      }
    };
    updateSubscription();
  }, [
    ClientSocketState, // connecting or (more importantly) authed_nouser triggers re-check
    notificationsAllowed, // user browser's notification permission change triggers re-check
    userSettings, // user settings can enable/disable notifications
  ]);

  return null;
}

export async function EnsureServiceWorkerRegistered() {
  let registration = await GetServiceWorkerRegistration();
  if (!registration) {
    // service worker is in public/service-worker/ServiceWorker.js,
    // which is compiled from public/service-worker/ServiceWorker.ts
    // compiled via npm run build-sw
    registration = await navigator.serviceWorker.register("/ServiceWorker.js", {
      type: "module",
    });
  }

  registration.onupdatefound = () => {
    console.log("New service worker update found.");
    const newWorker = registration.installing;
    if (newWorker) {
      newWorker.onstatechange = () => {
        if (newWorker.state === "activated") {
          console.log("New service worker activated.");
        }
      };
    }
  };

  if (import.meta.env.DEV) {
    console.log(
      "Vite development environment detected. Forcing service worker update."
    );
    await registration.update();
  }

  return registration;
}

const VapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";
if (!VapidPublicKey) {
  throw new Error("VAPID_PUBLIC_KEY is not set in environment variables.");
}
export async function SubscribeToNotifications() {
  // subscribe to notifications
  if (!("serviceWorker" in navigator)) {
    console.error("Service workers are not supported in this browser.");
    return null;
  }

  const registration = await EnsureServiceWorkerRegistered(); // ensure service worker is registered

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VapidPublicKey),
  });
  return subscription;
}

export async function UnsubscribeFromNotifications() {
  // unsubscribe from notifications
  console.log("UnsubscribeFromNotifications called");
  if (!("serviceWorker" in navigator)) {
    console.error("Service workers are not supported in this browser.");
    return;
  }

  const subscription = await GetNotificationSubscription();
  if (!subscription) return; // nothing to unsubscribe from
  await subscription!.unsubscribe();

  // tell service worker to clear any existing notifications
  const registration = await GetServiceWorkerRegistration();
  registration?.active?.postMessage({ type: "CLEAR_NOTIFICATIONS" });
}

export async function GetNotificationSubscription() {
  console.log("GetNotificationSubscription called");
  const registration = await GetServiceWorkerRegistration();
  console.log("got service worker registration:", registration);
  if (!registration) return null;

  const subscription = await registration.pushManager.getSubscription();
  return subscription;
}

export async function GetServiceWorkerRegistration() {
  if (!("serviceWorker" in navigator)) {
    console.error("Service workers are not supported in this browser.");
    return null;
  }

  const registrationCheck = await navigator.serviceWorker.getRegistration();
  if (!registrationCheck) {
    console.warn("No service worker registration found.");
    return null;
  }

  const registration = await navigator.serviceWorker.ready;
  return registration;
}
