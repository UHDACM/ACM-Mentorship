import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ClientSocket } from "./clientSocket";
import { sleep } from "@shared/scripts/generalTools";
import { USERNAME_RESERVED_TESTING_PREFIX } from "@shared/data/validation";
import { ClientSocketState } from "@shared/types/socket";
import { GenerateSocketArray } from "@shared/scripts/testingTools";
import { userSettingsTestCases } from "@shared/validation/userSettings.test";

/**
 * This file tests mentorship request related functionality of the ClientSocket class.
 *
 * Anything that is directly related to mentorship requests should be tested here.
 *
 */

if (process.env.SKIP_TEST_DATA_DELETION == 'true') {
  throw new Error('SKIP_TEST_DATA_DELETION cannot be true for this test file as it relies on clean test data.');
}

const SocketArray: ClientSocket[] = [];
let MainSocket: ClientSocket;

// max number of mentors + 1 extra for the mentee (used to test max mentors limit) + 1 extra mentor to test max mentors limit
const SocketCount = 1;
const SocketAddress = `ws://localhost:${process.env.SERVER_PORT}`;

beforeAll(async () => {
  const sockets = GenerateSocketArray(
    SocketCount,
    SocketAddress,
    "userSettings",
    (e, p) => {
      if (e == 'message') {
        console.log(`Socket Message Event: ${JSON.stringify(p)}`);
      }
    }
  );
  SocketArray.push(...sockets);

  const ExpectSocketToBeInState = (
    socket: ClientSocket,
    state: ClientSocketState
  ) => {
    expect(socket.state).toBe(state);
  };

  // this should be enough time for the socket to connect and authenticate.
  await sleep(1500);

  // ensures they're all connected and authed (but no user yet)
  SocketArray.forEach((socket) => {
    ExpectSocketToBeInState(socket, "authed_nouser");
  });

  await Promise.all(
    SocketArray.map((socket, i) =>
      socket.CreateAccount({
        username: `${USERNAME_RESERVED_TESTING_PREFIX}_userSettings${i + 1}`,
        fName: `User${i + 1}`,
        lName: `uS${i + 1}`,
      })
    )
  );
  // this should be enough time for the socket to create account and be fully set up.
  await sleep(1500);

  // ensures they're all connected, authed, and have user data
  SocketArray.forEach((socket) => {
    ExpectSocketToBeInState(socket, "authed_user");
  });

  MainSocket = SocketArray[0];
});

describe("UpdateUserSettings", () => {
  it("accepts partially valid UserSettings objects", async () => {
    for (const input of userSettingsTestCases.partiallyValid) {
      const response = await MainSocket.UpdateUserSettings(input);
      expect(response).toBe(true);
    }
  });

  // it("accepts nested-only UserSettings objects", async () => {
  //   for (const input of userSettingsTestCases.nestedOnly) {
  //     const response = await MainSocket.UpdateUserSettings(input);
  //     expect(response).toBe(true);
  //   }
  // });

  // it("rejects invalid top-level types", async () => {
  //   for (const input of userSettingsTestCases.invalidTopLevel) {
  //     const response = await MainSocket.UpdateUserSettings((input as unknown) as UserSettings);
  //     expect(response).toBe(false);
  //   }
  // });

  // it("rejects invalid nested types", async () => {
  //   for (const input of userSettingsTestCases.invalidNested) {
  //     const response = await MainSocket.UpdateUserSettings(input as unknown as UserSettings);
  //     expect(response).toBe(false);
  //   }
  // });

  // it("rejects non-object inputs", async () => {
  //   for (const input of userSettingsTestCases.nonObjectInputs) {
  //     const response = await MainSocket.UpdateUserSettings(input as unknown as UserSettings);
  //     expect(response).toBe(false);
  //   }
  // });
});

afterAll(async () => {
  for (const socket of SocketArray) {
    if (socket.state != "disconnected") {
      socket.disconnect();
    }
  }
  await sleep(1000); // give some time to disconnect before ending the process
});

