import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ReduxRootState } from "../../../src/store";
import {
  addDialog,
  addDialogImmediate,
  closeDialog,
} from "../Dialog/DialogSlice";
import { MyClientSocket } from "../ClientSocket/ClientSocketHandler";
import { DefaultUserSettings } from "@shared/data/userSettings";
import { sleep } from "@shared/scripts/generalTools";
import { SettingsAllowNotification } from "@shared/scripts/notification";

/**
 * This component encourages the user to enable notifications after their first chat or mentorship request.
 * @returns
 */
export default function NoficiationEncourageEnable() {
  const dispatch = useDispatch();

  const { user, userSettings, state } = useSelector(
    (g: ReduxRootState) => g.ClientSocket
  );
  const { notificationsAllowed } = useSelector(
    (g: ReduxRootState) => g.NotificationManager
  );

  // notifies user after 13 seconds if they haven't enabled notifications yet
  const [loadedUser, setLoadedUser] = useState(false);
  const [hasEncouraged, setHasEncouraged] = useState(false);
  useEffect(() => {
    if (loadedUser) return;
    if (!user) return;
    if (state != 'authed_user') return;

    setLoadedUser(true);

    // notificationsAllowed being undefined means permission not yet loaded
    if (notificationsAllowed == undefined) return;

    // if notifications are already allowed through browser and user settings, do nothing
    if (notificationsAllowed && SettingsAllowNotification(userSettings)) return;

    if (hasEncouraged) return;
    setHasEncouraged(true);
    setTimeout(() => {
      if (!MyClientSocket) return;
      else if (!MyClientSocket.user) return;
      encourageEnableNotifications();
    }, 13000);
  }, [notificationsAllowed, user, loadedUser, hasEncouraged, state]);

  const encourageEnableNotifications = () => {
    dispatch(
      addDialog({
        title: "Don't go unnotified!",
        subtitle:
          "Enable notifications to stay updated on new messages and mentorship requests.",
        buttons: [
          {
            text: "Enable Notifications",
            onClick: async () => {
              const currentUserSettings = userSettings || DefaultUserSettings;
              if (!currentUserSettings.allowNotifications) {
                MyClientSocket?.UpdateUserSettings({
                  ...currentUserSettings,
                  allowNotifications: true,
                  allowNotificationsFor: {
                    messages: true,
                    mentorshipRequests: true,
                  }
                });
              }

              dispatch(closeDialog());
              dispatch(
                addDialogImmediate({
                  title: "Waiting for permission...",
                  subtitle: "Please allow notifications to receive updates.",
                  showDelay: 0,
                })
              );

              console.log("Requesting notification permission from user");
              const permission = await Notification.requestPermission();
              console.log("Notification permission result:", permission);
              await sleep(1000); // hacky solution to ensure dialog is seen before closing

              if (permission === "granted") {
                dispatch(
                  addDialogImmediate({
                    title: "Notifications Enabled!",
                    subtitle:
                      "You will now receive notifications for new messages and mentorship requests.",
                  })
                );
              } else {
                // show user how to enable notifications from browser settings, for their specific browser
                console.log(
                  "Notification permission denied, showing instructions to enable manually"
                );
                dispatch(
                  addDialogImmediate({
                    title: "Enable Notifications on XYZ Browser",
                    subtitle:
                      "This is how you enable notifications on XYZ Browser: ...",
                  })
                );
              }
              console.log("Closing notification permission dialog");
              dispatch(closeDialog());
            },
          },
          {
            text: "Maybe Later",
            onClick: () => {
              // TODO: possibly set a flag to not show this again for some time
              dispatch(closeDialog());
            },
          },
        ],
      })
    );
  };

  return null;
}
