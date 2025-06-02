// Note: You will need to run `npm run build-sw` to compile this TypeScript Service Worker file to JavaScript
// it exports to public/ServiceWorker.js (its there for scope reasons)

// BIG NOTE: PLEASE REMOVE export {} FROM ServiceWorker.js AFTER COMPILATION
// OTHERWISE SERVICE WORKER REGISTRATION WILL FAIL DUE TO IT BEING A MODULE

// =======================================================

// these references are necessary for TypeScript to recognize Service Worker types
/// <reference lib="webworker" />

// ts ignore the following line as it causes issues with emitted JS
// they aren't issues in JS, but TS complains about them.

// @ts-ignore: duplicate in emitted JS
const sw = self as unknown as ServiceWorkerGlobalScope;
// =======================================================

// @ts-ignore: duplicate in emitted JS
const version = "1.0.31";
console.log("Service Worker Version:", version);

sw.addEventListener("activate", async (_) => {
  console.log("Service Worker activating Version:", version);
});

sw.addEventListener("install", async (_) => {
  console.log("Service Worker installing Version:", version);
});

sw.addEventListener("push", async (event: PushEvent) => {
  // we should receive a push with data containing notification title and options
  // in options, we can have body, icon, badge, data, etc.
  // see: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/push_event

  const pushData = event.data?.text();
  if (!pushData) {
    console.log("Push event but no data");
    return;
  }

  console.log("Push event with data:", pushData);

  if (pushData == "_test_message_") {
    console.log("Received test push message");
    return;
  }

  const parsedData: unknown = JSON.parse(pushData);

  if (
    !parsedData ||
    typeof parsedData !== "object" ||
    !("title" in parsedData)
  ) {
    console.log("Push event data is not valid notification data");
    return;
  }

  const { title, ...options } = parsedData as {
    title: string;
    [key: string]: unknown;
  };

  if (!title || typeof title !== "string") {
    console.log("Push event data missing valid title");
    return;
  }

  const { tag } = options as { tag?: string };

  if (tag && typeof tag == "string") {
    const existing = await sw.registration.getNotifications({ tag });
    // sw.registration.showNotification('Closed Notis', { body: `Closed existing notifications with tag: ${tag} | ${existing.length}` });
    existing.forEach((n) => n.close());
  }

  try {
    sw.registration.showNotification(title, options);
  } catch (e) {
    console.error("Error showing notification:", e);
  }
});

// @ts-ignore: duplicate in emitted JS
sw.addEventListener("notificationclick", (event) => {
  event.notification.close(); // Close the notification

  // Get URL from notification data
  const action = event.notification.data?.action;
  const urlToOpen = event.notification.data?.url || "/"; // fallback to homepage

  if (action) {
    const actionArgs = event.notification.data?.actionArgs || [];
    if (action === "open_chat" && actionArgs.length > 0) {
      const chatID = actionArgs[0];
      event.waitUntil(
        sw.clients
          .matchAll({ type: "window", includeUncontrolled: true })
          .then((clientList) => {
            for (const client of clientList) {
              if (client.url.startsWith("/app") && "focus" in client) {
                const newUrl = `${client.url}?open_chat=${chatID}`;
                client.navigate(newUrl);
                return client.focus();
              }
            }

            // Otherwise, open a new window/tab
            if (sw.clients.openWindow) {
              const newUrl = `/app/home?open_chat=${chatID}`;
              return sw.clients.openWindow(newUrl);
            }
          })
      );
      return;
    }
  } else if (urlToOpen) {
    OpenUrlInClient(event, urlToOpen);
  } else {
    sw.clients.openWindow("/app/home");
  }
});

// @ts-ignore: duplicate in emitted JS
function OpenUrlInClient(event: NotificationEvent, urlToOpen: string) {
  event.waitUntil(
    sw.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // If the page is already open, focus it
        for (const client of clientList) {
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        // Otherwise, open a new window/tab
        if (sw.clients.openWindow) {
          return sw.clients.openWindow(urlToOpen);
        }
      })
  );
}

sw.addEventListener("message", (event) => {
  // Listen for messages from the main thread
  if (event.data && event.data.type === "CLEAR_NOTIFICATIONS") {
    sw.registration.getNotifications().then((notifications) => {
      notifications.forEach((notification) => notification.close());
    });
  }
});

// sw.addEventListener('notificationclick', (event) => {
//   event.notification.close();
//   event.waitUntil(clients.openWindow('/'));
// });
