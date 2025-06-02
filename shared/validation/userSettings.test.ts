import { describe, it, expect } from "vitest";
import { isUserSettings } from "./userSettings";

export const userSettingsTestCases = {
  fullyValid: [
    {
      allowNotifications: true,
      allowNotificationsFor: {
        messages: true,
        mentorshipRequests: false,
      },
      allowAnalytics: true,
    },
  ],
  partiallyValid: [
    { allowNotifications: false },
    { allowNotificationsFor: { messages: true } },
    {},
  ],
  nestedOnly: [
    { allowNotificationsFor: { mentorshipRequests: true } },
  ],
  invalidTopLevel: [
    { allowNotifications: "yes" },
    { allowAnalytics: 123 },
  ],
  invalidNested: [
    { allowNotificationsFor: { messages: "nope" } },
    { allowNotificationsFor: { mentorshipRequests: null } },
  ],
  invalidID: [
    { id: 123, allowNotifications: true },
    { id: null, allowAnalytics: false },
    { id: "", allowNotifications: true },
  ],
  nonObjectInputs: [null, undefined, "string", 42, []],
};

describe("isUserSettings", () => {
  it("validates fully valid UserSettings objects", () => {
    userSettingsTestCases.fullyValid.forEach((testCase) => {
      expect(isUserSettings(testCase)).toBe(true);
    });
  });

  it("validates partially valid UserSettings objects", () => {
    userSettingsTestCases.partiallyValid.forEach((testCase) => {
      expect(isUserSettings(testCase)).toBe(true);
    });
  });

  it("validates nested-only UserSettings objects", () => {
    userSettingsTestCases.nestedOnly.forEach((testCase) => {
      expect(isUserSettings(testCase)).toBe(true);
    });
  });

  it("rejects invalid top-level types", () => {
    userSettingsTestCases.invalidTopLevel.forEach((testCase) => {
      expect(isUserSettings(testCase)).toBe(false);
    });
  });

  it("rejects invalid nested types", () => {
    userSettingsTestCases.invalidNested.forEach((testCase) => {
      expect(isUserSettings(testCase)).toBe(false);
    });
  });

  it("rejects invalid id types", () => {
    userSettingsTestCases.invalidID.forEach((testCase) => {
      expect(isUserSettings(testCase)).toBe(false);
    });
  });


  it("rejects non-object inputs", () => {
    userSettingsTestCases.nonObjectInputs.forEach((testCase) => {
      expect(isUserSettings(testCase)).toBe(false);
    });
  });
});
