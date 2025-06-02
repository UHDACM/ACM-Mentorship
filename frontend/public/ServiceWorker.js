const sw = self;
const version = "1.0.31";
console.log("Service Worker Version:", version);
sw.addEventListener("activate", async (_) => {
    console.log("Service Worker activating Version:", version);
});
sw.addEventListener("install", async (_) => {
    console.log("Service Worker installing Version:", version);
});
sw.addEventListener("push", async (event) => {
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
    const parsedData = JSON.parse(pushData);
    if (!parsedData ||
        typeof parsedData !== "object" ||
        !("title" in parsedData)) {
        console.log("Push event data is not valid notification data");
        return;
    }
    const { title, ...options } = parsedData;
    if (!title || typeof title !== "string") {
        console.log("Push event data missing valid title");
        return;
    }
    const { tag } = options;
    if (tag && typeof tag == "string") {
        const existing = await sw.registration.getNotifications({ tag });
        existing.forEach((n) => n.close());
    }
    try {
        sw.registration.showNotification(title, options);
    }
    catch (e) {
        console.error("Error showing notification:", e);
    }
});
sw.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const action = event.notification.data?.action;
    const urlToOpen = event.notification.data?.url || "/";
    if (action) {
        const actionArgs = event.notification.data?.actionArgs || [];
        if (action === "open_chat" && actionArgs.length > 0) {
            const chatID = actionArgs[0];
            event.waitUntil(sw.clients
                .matchAll({ type: "window", includeUncontrolled: true })
                .then((clientList) => {
                for (const client of clientList) {
                    if (client.url.startsWith("/app") && "focus" in client) {
                        const newUrl = `${client.url}?open_chat=${chatID}`;
                        client.navigate(newUrl);
                        return client.focus();
                    }
                }
                if (sw.clients.openWindow) {
                    const newUrl = `/app/home?open_chat=${chatID}`;
                    return sw.clients.openWindow(newUrl);
                }
            }));
            return;
        }
    }
    else if (urlToOpen) {
        OpenUrlInClient(event, urlToOpen);
    }
    else {
        sw.clients.openWindow("/app/home");
    }
});
function OpenUrlInClient(event, urlToOpen) {
    event.waitUntil(sw.clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((clientList) => {
        for (const client of clientList) {
            if (client.url === urlToOpen && "focus" in client) {
                return client.focus();
            }
        }
        if (sw.clients.openWindow) {
            return sw.clients.openWindow(urlToOpen);
        }
    }));
}
sw.addEventListener("message", (event) => {
    if (event.data && event.data.type === "CLEAR_NOTIFICATIONS") {
        sw.registration.getNotifications().then((notifications) => {
            notifications.forEach((notification) => notification.close());
        });
    }
});
// export {};
