import { describe, it, expect } from "vitest";
import { userSettingsTestCases } from "@shared/validation/userSettings.test";
import { GetUserSettings, UpdateUserSettings } from "./userSettings";
import { UserSettings } from "@shared/types/userSettings";

const testUserID = "userSettings.test.user";
describe("UpdateUserSettings", () => {
  it("rejects invalid UserSettings objects", async () => {
    for (const testCase of [
      ...userSettingsTestCases.invalidTopLevel,
      ...userSettingsTestCases.invalidNested,
      ...userSettingsTestCases.nonObjectInputs,
    ]) {
      const result = await UpdateUserSettings(
        testUserID,
        testCase as UserSettings,
        true
      );
      expect(result).toBe(false);
    }
  });

  it("accepts valid UserSettings objects", async () => {
    for (const testCase of [
      ...userSettingsTestCases.fullyValid,
      ...userSettingsTestCases.partiallyValid,
      ...userSettingsTestCases.nestedOnly,
    ]) {
      const result = await UpdateUserSettings(
        testUserID,
        testCase as UserSettings,
        true
      );
      expect(result).toBe(true);
    }
  });
});

// Now that UpdateUserSettings is tested, we can test GetUserSettings, as it depends on it.
describe("GetUserSettings", () => {
  it("retrieves the correct UserSettings after update", async () => {
    const validSettings: UserSettings = {
      allowAnalytics: true,
      allowNotificationsFor: {
        mentorshipRequests: true,
        messages: false
      }
    };

    const updateResult = await UpdateUserSettings(
      testUserID,
      validSettings,
      true
    );
    expect(updateResult).toBe(true);

    const retrievedSettings = await GetUserSettings(testUserID);
    delete validSettings.testing; // Remove testing flag for comparison
    delete validSettings.id;

    console.log("Updated Settings:", validSettings);
    console.log("Retrieved Settings:", retrievedSettings);

    expect(retrievedSettings).toEqual(validSettings);
  });
});
