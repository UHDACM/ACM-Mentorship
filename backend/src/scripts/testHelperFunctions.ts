import { io, SocketOptions, ManagerOptions, Socket } from "socket.io-client";
import { isValidUsername, MAX_NAME_LENGTH } from "./validation";
import { SocketPayloadCreateUser } from "@shared/types/socket";
import { UserObj } from "@shared/types/general";
import { isValidMentorshipRequestObj } from "@shared/validation/general";
import {
  isValidServerSocketPayloadDataBase,
  isValidServerSocketPayloadDataMentorshipRequest,
} from "@shared/validation/serverSocketPayload";

const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
export function generateValidName(): string {
  // Generate a random length between 1 and MAX_NAME_LENGTH
  const length = Math.floor(Math.random() * MAX_NAME_LENGTH) + 1;
  let name = "";
  for (let i = 0; i < length; i++) {
    name += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return name;
}

const usernameChars =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-.";
const locallyUsedUsernames = new Set<string>();
/**
 * Generates a valid username that meets the criteria defined in validation.ts
 *
 * if `unusedInDatabase` is true, it will also check the database to ensure the username is not already taken.
 *
 * Should not be used in production, only for testing purposes
 * @returns a valid unique username
 */
export async function generateValidUniqueUsername(
  unusedInDatabase?: boolean
): Promise<string> {
  // Generate a statistically unlikely username by using a long random string
  const length = Math.max(16, Math.floor(Math.random() * 8) + 16); // 16-23 chars
  let username = "";
  for (let i = 0; i < length; i++) {
    username += usernameChars.charAt(
      Math.floor(Math.random() * usernameChars.length)
    );
  }

  try {
    if (locallyUsedUsernames.has(username)) {
      throw new Error(); // thows to enter catch block
    }
    if (unusedInDatabase) {
      await isValidUsername(username);
    }
  } catch {
    return generateValidUniqueUsername();
  }
  locallyUsedUsernames.add(username);
  return username.toLowerCase();
}

// creates socket that fails to connect without testing token
export function ConnectSocketWithParams(
  itShouldSucceedCreatingUser: boolean,
  errorMessage: string,
  opts?: ManagerOptions | SocketOptions
) {
  return new Promise<Socket>((res, rej) => {
    const tempSocket = io(`ws://localhost:${process.env.SERVER_PORT}`, opts);
    tempSocket.on("connect_error", () => {
      itShouldSucceedCreatingUser
        ? rej("Expected success |" + errorMessage)
        : res(tempSocket);
    });
    tempSocket.on("connect", () =>
      itShouldSucceedCreatingUser
        ? res(tempSocket)
        : rej("expected failure | " + errorMessage)
    );
    // tempSocket.onAny((param) => {
    //   console.log("any_", errorMessage, param);
    // });
  });
}

export function ConnectSocketAndCreateUserWithParams(
  CreateUserPayload: SocketPayloadCreateUser,
  itShouldSucceedCreatingUser: boolean,
  errorMessage: string,
  opts?: ManagerOptions | SocketOptions
) {
  return new Promise<Socket>(async (res, rej) => {
    try {
      const socket = await ConnectSocketWithParams(true, errorMessage, opts);

      socket.on("state", async (state) => {
        socket.removeListener("state");

        if (state != "authed_nouser") {
          res(socket);
        }

        socket.emit("createUser", CreateUserPayload, (success: boolean) => {
          if (success) {
            itShouldSucceedCreatingUser
              ? res(socket)
              : rej("expected failure | " + errorMessage);
          } else {
            itShouldSucceedCreatingUser
              ? rej("Expected success |" + errorMessage)
              : res(socket);
          }
        });
      });
    } catch (err) {
      rej(err);
    }
  });
}

/**
 * Listens to the socket for any data that updates the userObj and keeps the userObj upto date
 * with the latest data.
 * 
 * this mimics the behaviour of the client application
 * 
 * used primarily for testing purposes.
 * @param socket 
 * @param userObj 
 */
export function KeepSocketDataUptoDate(socket: Socket, userObj: UserObj) {
  socket.on("data", (payload: unknown) => {
    if (!isValidServerSocketPayloadDataBase(payload)) {
      return;
    }
    console.log(userObj.OAuthSubID, "received data", payload.type);

    if (isValidServerSocketPayloadDataMentorshipRequest(payload)) {
      const { data: mentorshipRequestObj } = payload;
      if (!isValidMentorshipRequestObj(mentorshipRequestObj)) {
        return;
      }

      if (mentorshipRequestObj.status) {
        // only possible statuses will result in request being removed from userObj
        if (userObj.mentorshipRequests) {
          userObj.mentorshipRequests = userObj.mentorshipRequests.filter(
            (id) => id !== mentorshipRequestObj.id
          );
        }
        return;
      } else if (mentorshipRequestObj.id) {
        if (!userObj.mentorshipRequests) {
          userObj.mentorshipRequests = [mentorshipRequestObj.id];
          return;
        }
        userObj.mentorshipRequests.push(mentorshipRequestObj.id);
      }
    }
  });
}
