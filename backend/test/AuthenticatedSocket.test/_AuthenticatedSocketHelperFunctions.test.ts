import { io, ManagerOptions, Socket, SocketOptions } from "socket.io-client";
import { ObjectAny } from "../../src/types";
import dotenv from 'dotenv';
import { expect, it } from "vitest";
import { DBDelete } from "../../src/db";
dotenv.config();

// creates socket that fails to connect without testing token
export function ConnectWithParams(
  succeed: boolean,
  errorMessage: string,
  opts?: ManagerOptions | SocketOptions
) {
  return new Promise<Socket>((res, rej) => {
    const tempSocket = io(`ws://localhost:${process.env.SERVER_PORT}`, opts);
    tempSocket.on("connect_error", () => {
      succeed ? rej("Expected success |" + errorMessage) : res(tempSocket);
    });
    tempSocket.on("connect", () =>
      succeed ? res(tempSocket) : rej("expected failure | " + errorMessage)
    );
    tempSocket.onAny((param) => {
      console.log("any_", errorMessage, param);
    });
  });
}

export function CreateUser(
  targetSocket: Socket,
  params: Object | undefined,
  succeed: boolean,
  errorMessage: string
) {
  return new Promise((res, rej) => {
    targetSocket.emit("createUser", params, (v: boolean) => {
      v
        ? succeed
          ? res(true)
          : rej("Expected failure" + errorMessage)
        : succeed
        ? rej("Expected success" + errorMessage)
        : res(true);
    });
    setTimeout(
      () =>
        rej(
          "create user request did not respond quick enough, " + errorMessage
        ),
      4000
    );
  });
}


const HANDLE_DATA_ERROR_HEADER = "####### HANDLE DATA ERROR #######\n";
export function handleData(
  payload: unknown,
  targetSocketData: ObjectAny,
  discriminator: string
) {
  console.log("DATA!", targetSocketData.id, discriminator, payload);
  function printDataError(...msg: any[]) {
    console.error(HANDLE_DATA_ERROR_HEADER + msg, payload);
  }
  if (!payload || typeof payload != "object") {
    printDataError("Received invalid payload data");
    return;
  }

  const type = payload["type"];
  const data = payload["data"];
  if (!type || !data) {
    printDataError("Undefined type or data for payload");
    return;
  } else if (type == "initialData") {
    if (typeof data != "object") {
      printDataError("Expected initial data to be object");
      return;
    }
    const { user, assessments } = data;
    if (!user) {
      printDataError("User or assessments is missing", user, assessments);
      return;
    }
    targetSocketData.id = user.id;
    targetSocketData.user = user;
    targetSocketData.assessments = assessments;
  } else if (type == "mentorshipRequest") {
    if (!targetSocketData.user.mentorshipRequests) {
      targetSocketData.user.mentorshipRequests = [];
    }

    if (typeof data != "object") {
      printDataError("Expected mentorshipRequest data to be objects");
      return;
    }

    const { mentorID, menteeID, id, status } = data;
    if (status) {
      console.log(
        "removing mentorship request for",
        targetSocketData.id,
        id,
        status
      );
      targetSocketData.user.mentorshipRequests.splice(
        targetSocketData.user.mentorshipRequests.indexOf(id),
        1
      );
      return;
    }

    if (!mentorID || !menteeID) {
      printDataError("Missing some parameters for mentorshipRequest object");
      return;
    }

    targetSocketData.user.mentorshipRequests.push(id);
  } else {
    printDataError("Unexpected type", type, data);
  }
}

export function updateState(
  targetSocketData: ObjectAny,
  state: string,
  discriminator: string
) {
  console.log("received state update", state, discriminator);
  targetSocketData.state = state;
}

export async function deleteAllTestingObjects() {
  await DBDelete("assessment", [["testing", "==", true]]);
  await DBDelete("user", [["testing", "==", true]]);
  await DBDelete("mentorshipRequest", [["testing", "==", true]]);
  await DBDelete("goal", [["testing", "==", true]]);
  await DBDelete('chat', [["testing", "==", true]]);
  await DBDelete('message', [["testing", "==", true]]);
}


// this function should not be used until after handleGetUser test has been validated.
export async function updateSelf(
  socket: Socket,
  targetSocketData: ObjectAny,
  errorMessage: string
) {
  if (!targetSocketData || !targetSocketData.id) {
    throw new Error(
      "Expected targetSocketData to be defined, " +
        errorMessage +
        " " +
        JSON.stringify(targetSocketData)
    );
  }
  const data = await GetUser(socket, targetSocketData.id, errorMessage);
  targetSocketData.user = data;
}

export async function GetUser(
  socket: Socket,
  targetUserID: string,
  errorMessage: string
): Promise<Object> {
  return await new Promise((res, rej) => {
    socket.emit("getUser", targetUserID, (data: boolean | Object) => {
      if (typeof data != "object") {
        rej("Expected to get user data successfully " + errorMessage);
        return;
      }
      res(data);
    });
  });
}



























it('should setup helper functions successfully', () => {
  expect(true).toBe(true);
});