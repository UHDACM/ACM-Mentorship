import MinimalisticButton from "../../components/MinimalisticButton/MinimalisticButton";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ReduxRootState } from "../../../src/store";
import InputToggle from "../../components/Inputs/InputToggle/InputToggle";
import { UserSettings } from "@shared/types/userSettings";
import { useChangesPreventNavigation } from "../../context/ChangesPreventNavigation/ChangesPreventNavigation";
import { ObjectsAreEqual } from "../../scripts/tools";
import { MyClientSocket } from "../../features/ClientSocket/ClientSocketHandler";
import { SaveButtonFixed } from "../../components/SaveButtonFixed/SaveButtonFixed";
import { setUserSettings } from "../../features/ClientSocket/ClientSocketSlice";
import { DefaultUserSettings } from "@shared/data/userSettings";

export default function UserSettingsPage() {
  const navigate = useNavigate();
  const { userSettings } = useSelector((g: ReduxRootState) => g.ClientSocket);
  const dispatch = useDispatch();

  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(
    userSettings || DefaultUserSettings
  );

  useEffect(() => {
    if (!userSettings) return;
    setSettings(userSettings);
  }, [userSettings]);

  const { allowNotifications, allowAnalytics, allowNotificationsFor } =
    settings;
  const { messages, mentorshipRequests } = allowNotificationsFor || {}; // default values

  const handleUpdateSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    const areEqual = ObjectsAreEqual(newSettings, userSettings || {});
    setHasUnsavedChanges(!areEqual);
  };

  const { setHasUnsavedChanges, hasUnsavedChanges, setWarningText } =
    useChangesPreventNavigation();

  const handleSaveSettings = async () => {
    console.log("settings", settings);
    setSaving(true);
    const res = await MyClientSocket?.UpdateUserSettings(settings);
    setHasUnsavedChanges(false);
    setSaving(false);
    if (res) {
      dispatch(setUserSettings(settings));
    }
  };

  useEffect(() => {
    setWarningText("You have unsaved changes in your settings.");
    setHasUnsavedChanges(false);
  }, []);

  return (
    <div
      className={"pageBase"}
      style={{ paddingTop: "3rem", paddingLeft: "3rem", paddingRight: "3rem" }}
    >
      <MinimalisticButton
        onClick={() => navigate(-1)}
        style={{ marginBottom: "0.5rem" }}
      >
        {"<"} Back
      </MinimalisticButton>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          alignItems: "start",
        }}
      >
        <p style={{ fontSize: "2rem", fontWeight: 300 }}>Settings</p>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            alignItems: "start",
          }}
        >
          <span style={{ fontWeight: 700 }}>Notifications</span>
          <InputToggle
            value={allowNotifications}
            children="Allow Notifications"
            onClick={(v) =>
              handleUpdateSettings({ ...settings, allowNotifications: v })
            }
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "start",
              marginLeft: "2.5rem",
              gap: "0.5rem",
              opacity: allowNotifications ? 1 : 0.5,
              pointerEvents: allowNotifications ? "auto" : "none",
            }}
          >
            <InputToggle
              value={messages}
              children="Messages"
              onClick={(v) =>
                handleUpdateSettings({
                  ...settings,
                  allowNotificationsFor: {
                    ...allowNotificationsFor,
                    messages: v,
                  },
                })
              }
            />
            <InputToggle
              value={mentorshipRequests}
              children="Mentorship Requests"
              onClick={(v) =>
                handleUpdateSettings({
                  ...settings,
                  allowNotificationsFor: {
                    ...allowNotificationsFor,
                    mentorshipRequests: v,
                  },
                })
              }
            />
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            alignItems: "start",
          }}
        >
          <span style={{ fontWeight: 700 }}>Analytics</span>
          <InputToggle
            value={allowAnalytics}
            children="Allow Analytics"
            onClick={(v) =>
              handleUpdateSettings({ ...settings, allowAnalytics: v })
            }
          />
        </div>
      </div>
      <SaveButtonFixed show={hasUnsavedChanges} onSave={handleSaveSettings} text={'Unsaved Setting Changes'} disabled={!hasUnsavedChanges || saving} />
    </div>
  );
}
