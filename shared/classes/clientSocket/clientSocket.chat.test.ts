import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ClientSocket } from "./clientSocket";
import { sleep } from "@shared/scripts/generalTools";
import { USERNAME_RESERVED_TESTING_PREFIX } from "@shared/data/validation";
import { ClientSocketState } from "@shared/types/socket";
import { GenerateSocketArray } from "@shared/scripts/testingTools";
import { isValidMessageContent } from "@shared/validation/general";

/**
 * This file tests mentorship request related functionality of the ClientSocket class.
 *
 * Anything that is directly related to mentorship requests should be tested here.
 *
 */

const SocketArray: ClientSocket[] = [];

// max number of mentors + 1 extra for the mentee (used to test max mentors limit) + 1 extra mentor to test max mentors limit
const SocketCount = 2;
const SocketAddress = `ws://localhost:${process.env.SERVER_PORT}`;

// this is a valid message, according to `isValidMessageContent`
const validMessage = "Hello, this is a test message!";

beforeAll(async () => {
  // creates SocketCount sockets and connects them to the server

  expect(isValidMessageContent(validMessage)).toBe(true); // should not throw

  const sockets = GenerateSocketArray(
    SocketCount,
    SocketAddress,
    "clientSocket.chat.test"
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
        username: `${USERNAME_RESERVED_TESTING_PREFIX}_chat_${i + 1}`,
        fName: `User${i + 1}`,
        lName: `Test${i + 1}`,
      })
    )
  );
  // this should be enough time for the socket to create account and be fully set up.
  await sleep(1500);

  // ensures they're all connected, authed, and have user data
  SocketArray.forEach((socket) => {
    ExpectSocketToBeInState(socket, "authed_user");
  });
});

describe("CreateChat", () => {
  /**
   * In this test, we will have a user create a chat with another user.
   *
   * TargetUserID will be invalid, so the request should fail.
   */
  it("Fails with invalid target userID", async () => {
    const creatorSocket = SocketArray[0];
    if (!creatorSocket.user) throw new Error("No user data on socket");

    const invalidUserIDs = ["invalidUserID", "", "-1"];
    await Promise.all(
      invalidUserIDs.map((targetUserID) => {
        return new Promise<void>((res, rej) =>
          creatorSocket
            .CreateChat(targetUserID, validMessage)
            .then(() => rej(`Create Chat should have failed '${targetUserID}'`))
            .catch(() => {
              res();
            })
        );
      })
    );
  });

  /**
   * In this test, we will have a user create a chat with another user.
   *
   * Contents will be invalid, so the request should fail.
   */
  it("Fails with invalid message content", async () => {
    const creatorSocket = SocketArray[0];
    const targetSocket = SocketArray[1];
    if (!creatorSocket.user) throw new Error("No user data on socket");
    if (!targetSocket.user) throw new Error("No user data on target socket");

    const invalidMessageContents = ["", "", ""];
    invalidMessageContents.forEach((messageContent) => {
      expect(() => isValidMessageContent(messageContent)).toThrow();
    });

    await Promise.all(
      invalidMessageContents.map((messageContent) => {
        return new Promise<void>((res, rej) =>
          creatorSocket
            .CreateChat(targetSocket.user.id!, messageContent)
            .then(() =>
              rej(`Create Chat should have failed '${messageContent}'`)
            )
            .catch(() => {
              res();
            })
        );
      })
    );
  });

  /**
   * In this test, we will have a user try to create a chat with themselves.
   * This should fail.
   */
  it("Fails when a user tries to create a chat with themselves", async () => {
    const creatorSocket = SocketArray[0];
    if (!creatorSocket.user) throw new Error("No user data on socket");

    await new Promise<void>((res, rej) =>
      creatorSocket
        .CreateChat(creatorSocket.user.id!, validMessage)
        .then(() => rej(`Create Chat should have failed with self`))
        .catch(() => res())
    );
  });
});

// TODO: write tests for sending messages in chats, fetching chat history, etc.


afterAll(async () => {
  for (const socket of SocketArray) {
    if (socket.state != "disconnected") {
      socket.disconnect();
    }
  }
  await sleep(1000); // give some time to disconnect before ending the process
});

