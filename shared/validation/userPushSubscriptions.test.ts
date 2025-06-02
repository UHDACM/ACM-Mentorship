import {
  PushSubscription,
  UserPushSubscriptions,
} from "@shared/types/userPushSubscriptions";
import { describe, expect, it } from "vitest";
import {
  isPushSubscription,
  isUserPushSubscriptions,
} from "./userPushSubscriptions";

type PushSubscriptionMock = {
  endpoint?: unknown;
  expirationTime?: unknown;
  keys?: {
    p256dh?: unknown;
    auth?: unknown;
  };
};

describe("isPushSubscription", () => {
  const validSub: PushSubscription = {
    endpoint: "https://example.com/endpoint",
    expirationTime: null,
    keys: {
      p256dh: "validP256dhKey",
      auth: "validAuthKey",
    },
  };

  it("validates a correct PushSubscription object (with expirationTime as null or a number)", () => {
    const thisValidSub: PushSubscriptionMock = { ...validSub };
    expect(isPushSubscription(thisValidSub)).toBe(true);
    thisValidSub.expirationTime = Date.now();
    expect(isPushSubscription(thisValidSub)).toBe(true);
  });

  it("rejects non-object inputs", () => {
    expect(isPushSubscription(null)).toBe(false);
    expect(isPushSubscription(undefined)).toBe(false);
    expect(isPushSubscription(42)).toBe(false);
    expect(isPushSubscription("string")).toBe(false);
  });

  it("rejects objects missing required fields", () => {
    const missingEndpoint: PushSubscriptionMock = {
      ...validSub,
      endpoint: undefined,
    };
    const missingKeys: PushSubscriptionMock = {
      endpoint: "https://example.com/endpoint",
      expirationTime: null,
    };
    expect(isPushSubscription(missingEndpoint)).toBe(false);
    expect(isPushSubscription(missingKeys)).toBe(false);
  });

  it("rejects objects with invalid field types", () => {
    const invalidTypes: PushSubscriptionMock = {
      endpoint: 123,
      expirationTime: "not a number",
      keys: {
        p256dh: 456,
        auth: true,
      },
    };
    expect(isPushSubscription(invalidTypes as any)).toBe(false);
  });
});

describe("isUserPushSubscriptions", () => {
  const validUserPushSubscriptions: UserPushSubscriptions = {
    "https://fcm.googleapis.com/fcm/send/fxcy08Gw_eQ:APA91bFXi0QP9w9iigC02P6oOsmDG8bJffWEANsrFbKaCHvNj7EvzKIrgGPO5z9MZ-aX9Th2eJ9WJIkiLVsBAxs3Kz2IKGWNpPDW3STBoZ1e1VAfYniMUV2sVI8xOjlo899KEIVeW_L-":
      {
        expiration: 604800000,
        subscription: {
          endpoint:
            "https://fcm.googleapis.com/fcm/send/fxcy08Gw_eQ:APA91bFXi0QP9w9iigC02P6oOsmDG8bJffWEANsrFbKaCHvNj7EvzKIrgGPO5z9MZ-aX9Th2eJ9WJIkiLVsBAxs3Kz2IKGWNpPDW3STBoZ1e1VAfYniMUV2sVI8xOjlo899KEIVeW_L-",
          keys: {
            p256dh:
              "BLw48y0XgFmxuXdhdXb8-5Dp73kElVOVOAFyHEX67_SIiJsjre_esecw4FMVXmvksL32LVfPONqBl2ynRN_WQCY",
            auth: "ZHkVn77EabZX9TOO2_hpDQ",
          },
          expirationTime: null,
        },
      },
    testing: {
      expiration: 0,
      subscription: {
        endpoint: "",
        keys: {
          p256dh: "",
          auth: "",
        },
        expirationTime: null,
      },
    },
  };
  it("validates a correct UserPushSubscriptions object", () => {
    const valid: UserPushSubscriptions = {
      "https://example.com/endpoint": {
        subscription: {
          endpoint: "https://example.com/endpoint",
          expirationTime: null,
          keys: { p256dh: "key", auth: "auth" },
        },
        expiration: Date.now(),
      },
      "https://example2.com/endpoint": {
        subscription: {
          endpoint: "https://example2.com/endpoint",
          expirationTime: 12345,
          keys: { p256dh: "key2", auth: "auth2" },
        },
        expiration: Date.now() + 1000,
      },
    };
    expect(isUserPushSubscriptions(valid)).toBe(true);
  });

  it("rejects objects with invalid subscription", () => {
    const invalid: any = {
      "https://example.com/endpoint": {
        subscription: { endpoint: 123, keys: {} }, // invalid
        expiration: Date.now(),
      },
    };
    expect(isUserPushSubscriptions(invalid)).toBe(false);
  });

  it("rejects objects with non-number expiration", () => {
    const invalid: any = {
      "https://example.com/endpoint": {
        subscription: {
          endpoint: "https://example.com/endpoint",
          expirationTime: null,
          keys: { p256dh: "key", auth: "auth" },
        },
        expiration: "not a number",
      },
    };
    expect(isUserPushSubscriptions(invalid)).toBe(false);
  });

  it("rejects non-object inputs", () => {
    expect(isUserPushSubscriptions(null)).toBe(false);
    expect(isUserPushSubscriptions([])).toBe(false);
    expect(isUserPushSubscriptions("string")).toBe(false);
  });

  it("disregards testing flag value", () => {
    expect(
      isUserPushSubscriptions({
        testing: "not a boolean",
      })
    ).toBe(true);
    expect(
      isUserPushSubscriptions({
        testing: 2940,
      })
    ).toBe(true);
    expect(
      isUserPushSubscriptions({
        testing: {},
      })
    ).toBe(true);
  });
});
