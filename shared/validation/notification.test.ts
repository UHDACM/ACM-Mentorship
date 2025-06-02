import { describe, it, expect } from "vitest";
import {
  isNotificationOptions,
  isNotificationOptionsWithTitle,
} from "./notification";
import { NotificationOptions } from "@shared/types/notification";

type NotificationOptionsMock = {
  [key in keyof NotificationOptions]: unknown;
};

describe("isNotificationOptions", () => {
  // since all properties are optional, we can test them one by one
  describe("NotificationOptions.badge", () => {
    it("should return false for non-string badge", () => {
      const InvalidNotificationOptions: NotificationOptionsMock[] = [
        { badge: 123 },
        { badge: true },
        { badge: {} },
        { badge: [] },
      ];
      InvalidNotificationOptions.forEach((obj) =>
        expect(isNotificationOptions(obj as NotificationOptions)).toBe(false)
      );
    });

    it("should return true for string badge", () => {
      const ValidNotificationOptions: NotificationOptionsMock[] = [
        { badge: "https://example.com/badge.png" },
        { badge: "" },
      ];
      ValidNotificationOptions.forEach((obj) =>
        expect(isNotificationOptions(obj as NotificationOptions)).toBe(true)
      );
    });
  });

  describe("NotificationOptions.body", () => {
    it("should return false for non-string body", () => {
      const InvalidNotificationOptions: NotificationOptionsMock[] = [
        { body: 123 },
        { body: true },
        { body: {} },
        { body: [] },
        { body: null },
      ];
      InvalidNotificationOptions.forEach((obj) =>
        expect(isNotificationOptions(obj as NotificationOptions)).toBe(false)
      );
    });

    it("should return true for string body", () => {
      const ValidNotificationOptions: NotificationOptionsMock[] = [
        { body: "This is a test body" },
        { body: "" },
      ];
      ValidNotificationOptions.forEach((obj) =>
        expect(isNotificationOptions(obj as NotificationOptions)).toBe(true)
      );
    });
  });

  describe("NotificationOptions.dir", () => {
    it("should return false for invalid dir values", () => {
      const InvalidNotificationOptions: NotificationOptionsMock[] = [
        { dir: "left" },
        { dir: "rtl " },
        { dir: 123 },
        { dir: true },
        { dir: {} },
        { dir: [] },
        { dir: null },
      ];
      InvalidNotificationOptions.forEach((obj) =>
        expect(isNotificationOptions(obj as NotificationOptions)).toBe(false)
      );
    });

    it("should return true for valid dir values", () => {
      const ValidNotificationOptions: NotificationOptionsMock[] = [
        { dir: "auto" },
        { dir: "ltr" },
        { dir: "rtl" },
      ];
      ValidNotificationOptions.forEach((obj) =>
        expect(isNotificationOptions(obj as NotificationOptions)).toBe(true)
      );
    });
  });

  describe("NotificationOptions.icon", () => {
    it("should return false for non-string icon", () => {
      const InvalidNotificationOptions: NotificationOptionsMock[] = [
        { icon: 123 },
        { icon: true },
        { icon: {} },
        { icon: [] },
        { icon: null },
      ];
      InvalidNotificationOptions.forEach((obj) =>
        expect(isNotificationOptions(obj as NotificationOptions)).toBe(false)
      );
    });

    it("should return true for string icon", () => {
      const ValidNotificationOptions: NotificationOptionsMock[] = [
        { icon: "https://example.com/icon.png" },
        { icon: "" },
      ];
      ValidNotificationOptions.forEach((obj) =>
        expect(isNotificationOptions(obj as NotificationOptions)).toBe(true)
      );
    });
  });

  describe("NotificationOptions.lang", () => {
    it("should return false for non-string lang", () => {
      const InvalidNotificationOptions: NotificationOptionsMock[] = [
        { lang: 123 },
        { lang: true },
        { lang: {} },
        { lang: [] },
        { lang: null },
      ];
      InvalidNotificationOptions.forEach((obj) =>
        expect(isNotificationOptions(obj as NotificationOptions)).toBe(false)
      );
    });

    it("should return true for string lang", () => {
      const ValidNotificationOptions: NotificationOptionsMock[] = [
        { lang: "en-US" },
        { lang: "fr" },
        { lang: "" },
      ];
      ValidNotificationOptions.forEach((obj) =>
        expect(isNotificationOptions(obj as NotificationOptions)).toBe(true)
      );
    });
  });

  describe("NotificationOptions.requireInteraction", () => {
    it("should return false for non-boolean requireInteraction", () => {
      const InvalidNotificationOptions: NotificationOptionsMock[] = [
        { requireInteraction: 123 },
        { requireInteraction: "true" },
        { requireInteraction: {} },
        { requireInteraction: [] },
        { requireInteraction: null },
      ];
      InvalidNotificationOptions.forEach((obj) =>
        expect(isNotificationOptions(obj as NotificationOptions)).toBe(false)
      );
    });

    it("should return true for boolean requireInteraction", () => {
      const ValidNotificationOptions: NotificationOptionsMock[] = [
        { requireInteraction: true },
        { requireInteraction: false },
      ];
      ValidNotificationOptions.forEach((obj) =>
        expect(isNotificationOptions(obj as NotificationOptions)).toBe(true)
      );
    });
  });

  describe("NotificationOptions.silent", () => {
    it("should return false for non-boolean and non-null silent values", () => {
      const InvalidNotificationOptions: NotificationOptionsMock[] = [
        { silent: 123 },
        { silent: "true" },
        { silent: {} },
        { silent: [] },
      ];
      InvalidNotificationOptions.forEach((obj) =>
        expect(isNotificationOptions(obj as NotificationOptions)).toBe(false)
      );
    });

    it("should return true for boolean or null silent", () => {
      const ValidNotificationOptions: NotificationOptionsMock[] = [
        { silent: true },
        { silent: false },
        { silent: undefined },
        { silent: null },
      ];
      ValidNotificationOptions.forEach((obj) =>
        expect(isNotificationOptions(obj as NotificationOptions)).toBe(true)
      );
    });
  });

  describe("NotificationOptions.tag", () => {
    it("should return false for non-string tag", () => {
      const InvalidNotificationOptions: NotificationOptionsMock[] = [
        { tag: 123 },
        { tag: true },
        { tag: {} },
        { tag: [] },
        { tag: null },
      ];
      InvalidNotificationOptions.forEach((obj) =>
        expect(isNotificationOptions(obj as NotificationOptions)).toBe(false)
      );
    });

    it("should return true for string tag", () => {
      const ValidNotificationOptions: NotificationOptionsMock[] = [
        { tag: "notification-tag" },
        { tag: "" },
      ];
      ValidNotificationOptions.forEach((obj) =>
        expect(isNotificationOptions(obj as NotificationOptions)).toBe(true)
      );
    });
  });

  describe("isNotificationOptions - random assortments", () => {
    it("should correctly validate random valid NotificationOptions objects", () => {
      const validMocks: NotificationOptionsMock[] = [
        {
          badge: "badge.png",
          body: "Hello",
          dir: "ltr",
          icon: "icon.png",
          lang: "en",
          requireInteraction: true,
          silent: false,
          tag: "tag1",
        },
        { body: "Hi", silent: null },
        { badge: "", icon: "", tag: "" },
        { dir: "auto", requireInteraction: false },
      ];

      validMocks.forEach((obj) =>
        expect(isNotificationOptions(obj as NotificationOptions)).toBe(true)
      );
    });

    it("should return false for random invalid NotificationOptions objects", () => {
      const invalidMocks: NotificationOptionsMock[] = [
        { badge: 123, body: "Hello" }, // badge invalid
        { dir: "left", icon: "icon.png" }, // dir invalid
        { requireInteraction: "yes", silent: false }, // requireInteraction invalid
        { silent: "no", tag: "tag1" }, // silent invalid
        { lang: 42, body: "test" }, // lang invalid
      ];

      invalidMocks.forEach((obj) =>
        expect(isNotificationOptions(obj as NotificationOptions)).toBe(false)
      );
    });
  });
});

// ========================================================================================

type NotificationOptionsWithTitleMock = {
  title?: unknown;
} & NotificationOptionsMock;

describe("isNotificationOptionsWithTitle", () => {
  describe("title property", () => {
    it("should return false if title is missing", () => {
      const obj: NotificationOptionsMock = { body: "This is a body" };
      expect(isNotificationOptionsWithTitle(obj)).toBe(false);
    });

    it("should return false if title is not a string", () => {
      const InvalidTitles: unknown[] = [123, true, {}, [], null];
      InvalidTitles.forEach((title) => {
        const obj: NotificationOptionsWithTitleMock = {
          title,
          body: "This is a body",
        };
        expect(isNotificationOptionsWithTitle(obj)).toBe(false);
      });
    });

    it("should return true if title is a string and other properties are valid", () => {
      const obj: NotificationOptionsWithTitleMock = {
        title: "Notification Title",
        body: "This is a body",
      };
      expect(isNotificationOptionsWithTitle(obj)).toBe(true);
    });
  });
});
