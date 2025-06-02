import { describe, it, expect } from "vitest";
import { TestPushSubscription } from "./userPushSubscriptions";

it("dummy test for userPushSubscriptions", async () => {
  expect(1 + 1).toBe(2);

  for (let i = 0; i < 3; i++) {
    await TestPushSubscription({
      endpoint:
        "https://fcm.googleapis.com/fcm/send/fxcy08Gw_eQ:APA91bFXi0QP9w9iigC02P6oOsmDG8bJffWEANsrFbKaCHvNj7EvzKIrgGPO5z9MZ-aX9Th2eJ9WJIkiLVsBAxs3Kz2IKGWNpPDW3STBoZ1e1VAfYniMUV2sVI8xOjlo899KEIVeW_L-",
      expirationTime: null,
      keys: {
        p256dh:
          "BLw48y0XgFmxuXdhdXb8-5Dp73kElVOVOAFyHEX67_SIiJsjre_esecw4FMVXmvksL32LVfPONqBl2ynRN_WQCY",
        auth: "ZHkVn77EabZX9TOO2_hpDQ",
      },
    });
  }
});
