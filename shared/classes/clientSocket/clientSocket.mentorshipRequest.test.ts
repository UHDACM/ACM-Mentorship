import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ClientSocket } from "./clientSocket";
import { sleep } from "@shared/scripts/generalTools";
import { USERNAME_RESERVED_TESTING_PREFIX } from "@shared/data/validation";
import { ClientSocketState } from "@shared/types/socket";
import { MAX_NUMBER_OF_MENTORS_PER_MENTEE } from "@shared/data/mentorshipRequests";

/**
 * This file tests mentorship request related functionality of the ClientSocket class.
 *
 * Anything that is directly related to mentorship requests should be tested here.
 *
 */

const SocketArray: ClientSocket[] = [];

// max number of mentors + 1 extra for the mentee (used to test max mentors limit) + 1 extra mentor to test max mentors limit
const SocketCount = MAX_NUMBER_OF_MENTORS_PER_MENTEE + 1 + 1;
const SocketAddress = "ws://localhost:8080";
beforeAll(async () => {
  // creates SocketCount sockets and connects them to the server

  for (let i = 0; i < SocketCount; i++) {
    const newSocket: ClientSocket = new ClientSocket(SocketAddress, {
      auth: { token: `testing clientSocket.mentorshipRequest.${i + 1}` },
    });
    SocketArray.push(newSocket);
  }

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
        username: `${USERNAME_RESERVED_TESTING_PREFIX}_user${i + 1}`,
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

describe('mentorshipRequest "send" action', () => {
  it("sending: fails with invalid target userIDs", async () => {
    const randomUserIDs: string[] = [
      "nonexistentID1",
      "nonexistentID2",
      "nonexistentID3",
    ];
    await Promise.all(
      randomUserIDs.map((userID) => {
        SocketArray[0].SendMentorshipRequest(userID);
      })
    );
  });

  it("sending: fails when sending request to self", async () => {
    const response = await SocketArray[0].SendMentorshipRequest(
      SocketArray[0].user.id
    );
    expect(response).toBe(false);
  });

  // at this point, socket1 is not accepting mentees ====================================================================
  // socket2 tries to send request to socket1, but should fail
  it("sending: fails when sending request to user who is not accepting mentees", async () => {
    expect(SocketArray[1].user.acceptingMentees).toBeFalsy();
    const response = await SocketArray[0].SendMentorshipRequest(
      SocketArray[1].user.id
    );
    expect(response).toBe(false);
  });

  it("sending: succeeds when sending request to different user", async () => {
    const BecomeMentorResponse = await SocketArray[1].BecomeMentor();
    expect(BecomeMentorResponse).toBe(true);

    // wait a bit for user data to update
    await sleep(500);

    expect(SocketArray[1].user.isMentor).toBe(true);
    expect(SocketArray[1].user.acceptingMentees).toBe(true);

    const response = await SocketArray[0].SendMentorshipRequest(
      SocketArray[1].user.id
    );
    expect(response).toBe(true);

    // wait a bit for user data to update
    await sleep(500);

    // verify that the request is in socket1's and socket2's mentorshipRequests array
    expect(SocketArray[0].user.mentorshipRequests?.[0]).toBe(
      SocketArray[1].user.mentorshipRequests?.[0]
    );
  });
});

describe('mentorshipRequest "cancel" action', () => {
  // at this point, socket2 is accepting mentees, and there is an existing request between socket1 and socket2 (courtesy of the previous send action test)
  // these tests test if socket1 can cancel the request it sent to socket2
  it("it fails with invalid params (mentorshipRequestIDs)", async () => {
    const invalidMentorshipRequestIDs = ["", "invalidID1", "invalidID2"];
    const promises: Promise<void>[] = [];

    // test all combinations of invalid params
    for (const requestID of invalidMentorshipRequestIDs) {
      const promise = new Promise<void>(async (res, rej) => {
        const response = await SocketArray[0].DoMentorshipRequestAction(
          requestID,
          "cancel"
        );
        if (response) {
          rej("should not succeed " + JSON.stringify({ requestID }));
        } else {
          res();
        }
      });
      promises.push(promise);
    }
    await Promise.all(promises);
  });

  it("fails when user who did not send the request (target mentor or not) tries to cancel it", async () => {
    // SocketArray[0] sent a request to SocketArray[1] (mentor) in the previous test
    // therefore, SocketArray[1] (mentor) and SocketArray[2] (unrelated user) should not be able to cancel it
    const requestID = SocketArray[0].user.mentorshipRequests?.[0]; // most recent request sent by socket1
    const Socket2Response = await SocketArray[1].DoMentorshipRequestAction(
      requestID,
      "cancel"
    );
    expect(Socket2Response).toBe(false);

    const Socket3Response = await SocketArray[2].DoMentorshipRequestAction(
      requestID,
      "cancel"
    );
    expect(Socket3Response).toBe(false);
  });

  it("succeeds when correct user cancels existing request", async () => {
    const requestID = SocketArray[0].user.mentorshipRequests?.[0]; // most recent request sent by socket1
    const Socket1Response = await SocketArray[0].DoMentorshipRequestAction(
      requestID,
      "cancel"
    );
    expect(Socket1Response).toBe(true);

    // wait a bit for user data to update
    await sleep(500);

    // verify that the request is removed from socket1's and socket2's mentorshipRequests array
    if (
      SocketArray[0].user.mentorshipRequests.includes(requestID) ||
      SocketArray[1].user.mentorshipRequests.includes(requestID)
    ) {
      throw new Error(
        "mentorshipRequests should be undefined or not include the cancelled requestID"
      );
    }
  });
});

describe('mentorshipRequest "decline" action', () => {
  // at this point, socket2 is accepting mentees, and there is no existing request between socket1 and socket2
  // socket1 sends a request to socket2
  it("sending: succeeds when sending request from socket1 to socket2", async () => {
    const response = await SocketArray[0].SendMentorshipRequest(
      SocketArray[1].user.id
    );
    expect(response).toBe(true);

    // wait a bit for user data to update
    await sleep(500);

    // verify that the request is in socket1's and socket2's mentorshipRequests array
    expect(SocketArray[0].user.mentorshipRequests?.[0]).toBe(
      SocketArray[1].user.mentorshipRequests?.[0]
    );
  });

  it("it fails with non-existent mentorshipRequestIDs", async () => {
    const invalidMentorshipRequestIDs = ["", "invalidID1", "invalidID2"];
    const promises: Promise<void>[] = [];

    // test all invalid mentorshipRequestIDs
    for (const requestID of invalidMentorshipRequestIDs) {
      const promise = new Promise<void>(async (res, rej) => {
        const response = await SocketArray[1].DoMentorshipRequestAction(
          requestID,
          "decline"
        );
        if (response) {
          rej("should not succeed " + JSON.stringify({ requestID }));
        } else {
          res();
        }
      });
      promises.push(promise);
    }
    await Promise.all(promises);
  });

  it("fails when user who is not the target of the request (target sender or not) tries to decline it", async () => {
    // SocketArray[0] sent a request to SocketArray[1] (mentor) in the previous test
    // therefore, only SocketArray[1] (mentor) should be able to decline it
    const requestID = SocketArray[0].user.mentorshipRequests?.[0]; // most recent request sent by socket1
    const Socket1Response = await SocketArray[0].DoMentorshipRequestAction(
      requestID,
      "decline"
    );
    expect(Socket1Response).toBe(false);

    const Socket3Response = await SocketArray[2].DoMentorshipRequestAction(
      requestID,
      "decline"
    );
    expect(Socket3Response).toBe(false);
  });

  it("succeeds when receiving user declines existing request", async () => {
    const requestID = SocketArray[1].user.mentorshipRequests?.[0]; // most recent request sent by socket2
    const Socket2Response = await SocketArray[1].DoMentorshipRequestAction(
      requestID,
      "decline"
    );
    expect(Socket2Response).toBe(true);

    // wait a bit for user data to update
    await sleep(500);

    // verify that the request is removed from socket1's and socket2's mentorshipRequests array
    if (
      SocketArray[0].user.mentorshipRequests.includes(requestID) ||
      SocketArray[1].user.mentorshipRequests.includes(requestID)
    ) {
      throw new Error(
        "SocketArray[0].user.mentorshipRequests or SocketArray[1].user.mentorshipRequests should be undefined or not include the declined requestID"
      );
    }
  });
});

describe('mentorshipRequest "accept" action', () => {
  // at this point, socket2 is accepting mentees, and there is no existing request between socket1 and socket2
  // socket1 sends a request to socket2
  it("sending: succeeds when sending request from socket1 to socket2", async () => {
    const response = await SocketArray[0].SendMentorshipRequest(
      SocketArray[1].user.id
    );
    expect(response).toBe(true);

    // wait a bit for user data to update
    await sleep(500);

    // verify that the request is in socket1's and socket2's mentorshipRequests array
    expect(SocketArray[0].user.mentorshipRequests?.[0]).toBe(
      SocketArray[1].user.mentorshipRequests?.[0]
    );
  });

  it("it fails with non-existent mentorshipRequestIDs", async () => {
    const invalidMentorshipRequestIDs = ["", "invalidID1", "invalidID2"];
    const promises: Promise<void>[] = [];

    // test all invalid mentorshipRequestIDs
    for (const requestID of invalidMentorshipRequestIDs) {
      const promise = new Promise<void>(async (res, rej) => {
        const response = await SocketArray[1].DoMentorshipRequestAction(
          requestID,
          "accept"
        );
        if (response) {
          rej("should not succeed " + JSON.stringify({ requestID }));
        } else {
          res();
        }
      });
      promises.push(promise);
    }
    await Promise.all(promises);
  });

  it("fails when user who is not the target of the request (target sender or not) tries to accept it", async () => {
    // SocketArray[0] sent a request to SocketArray[1] (mentor) in the previous test
    // therefore, only SocketArray[1] (mentor) should be able to accept it
    const requestID = SocketArray[0].user.mentorshipRequests?.[0]; // most recent request sent by socket1
    const Socket1Response = await SocketArray[0].DoMentorshipRequestAction(
      requestID,
      "accept"
    );
    expect(Socket1Response).toBe(false);

    const Socket3Response = await SocketArray[2].DoMentorshipRequestAction(
      requestID,
      "accept"
    );
    expect(Socket3Response).toBe(false);
  });

  it("succeeds when receiving user accepts existing request", async () => {
    const requestID = SocketArray[1].user.mentorshipRequests?.[0]; // most recent request sent by socket2
    const Socket2Response = await SocketArray[1].DoMentorshipRequestAction(
      requestID,
      "accept"
    );
    expect(Socket2Response).toBe(true);

    // wait a bit for user data to update
    await sleep(500);

    // verify that the request is removed from socket1's and socket2's mentorshipRequests array
    if (
      SocketArray[0].user.mentorshipRequests.includes(requestID) ||
      SocketArray[1].user.mentorshipRequests.includes(requestID)
    ) {
      throw new Error(
        "SocketArray[0].user.mentorshipRequests or SocketArray[1].user.mentorshipRequests should be undefined or not include the accepted requestID"
      );
    }
    console.log("socket1", SocketArray[0].user);
    console.log("socket2", SocketArray[1].user);
    // verify that socket1 and socket2 are now mentor and mentee respectively
    expect(SocketArray[0].user.mentorIDs).toContain(SocketArray[1].user.id);
    expect(SocketArray[1].user.menteeIDs).toContain(SocketArray[0].user.id);
  });
});

describe("multi-mentor support", () => {
  // at this point, socket2 is accepting mentees, and socket1 is a mentee of socket2
  // the rest of the sockets are not mentors yet

  it("succeeds when making multiple users mentors", async () => {
    const Promises: Promise<boolean>[] = [];
    for (let i = 2; i < SocketArray.length; i++) {
      Promises.push(SocketArray[i].BecomeMentor());
    }

    const Responses = await Promise.all(Promises);
    Responses.forEach((response) => {
      expect(response).toBe(true);
    });

    // wait a bit for user data to update
    await sleep(500);

    // ensure that all users are now mentors and accepting mentees
    for (let i = 2; i < SocketArray.length; i++) {
      expect(SocketArray[i].user.isMentor).toBe(true);
      expect(SocketArray[i].user.acceptingMentees).toBe(true);
    }
  });

  it("socket1 can send mentorship requests to all sockets in SocketArray", async () => {
    const Promises: Promise<boolean>[] = [];
    for (let i = 2; i < SocketArray.length; i++) {
      Promises.push(
        SocketArray[0].SendMentorshipRequest(SocketArray[i].user.id)
      );
    }

    const Responses = await Promise.all(Promises);
    Responses.forEach((response) => {
      expect(response).toBe(true);
    });

    // wait a bit for user data to update
    await sleep(500);

    // ensure that all requests are in the respective users' and socket2's mentorshipRequests array
    for (let i = 2; i < SocketArray.length; i++) {
      if (
        !SocketArray[0].user.mentorshipRequests.includes(
          SocketArray[i].user.mentorshipRequests?.[0]
        )
      ) {
        throw new Error(
          "Socket1's mentorshipRequests should include the request from Socket" +
            (i + 1)
        );
      }
    }
  });

  it(`socket1 can have up to ${MAX_NUMBER_OF_MENTORS_PER_MENTEE} mentors`, async () => {
    const PromisesExpectedToSucceed: Promise<boolean>[] = [];
    const PromisesExpectedToFail: Promise<boolean>[] = [];

    // all mentors accept mentorship requests from socket1 until limit is reached
    let mentorCount = SocketArray[0].user.mentorIDs?.length || 0;
    for (let i = 2; i < SocketArray.length; i++) {
      // leave the last one to test the max mentees limit
      if (mentorCount < MAX_NUMBER_OF_MENTORS_PER_MENTEE) {
        PromisesExpectedToSucceed.push(
          SocketArray[i].DoMentorshipRequestAction(
            SocketArray[i].user.mentorshipRequests?.[0],
            "accept"
          )
        );
        mentorCount++;
      } else {
        PromisesExpectedToFail.push(
          SocketArray[i].DoMentorshipRequestAction(
            SocketArray[i].user.mentorshipRequests?.[0],
            "accept"
          )
        );
      }
    }

    const SuccessfulResponses = await Promise.all(PromisesExpectedToSucceed);
    SuccessfulResponses.forEach((response, i) => {
      console.log("SuccessfulResponses", i, response);
      expect(response).toBe(true);
    });
    const FailedResponses = await Promise.all(PromisesExpectedToFail);
    FailedResponses.forEach((response, i) => {
      console.log("FailedResponses", i, response);
      expect(response).toBe(false);
    });

    // wait a bit for user data to update
    await sleep(1500);
    // ensure that all accepted users are now mentors of socket1
    for (let i = 1; i < SocketArray.length; i++) {
      if (i < MAX_NUMBER_OF_MENTORS_PER_MENTEE + 1) {
        if (!SocketArray[0].user.mentorIDs.includes(SocketArray[i].user.id)) {
          throw new Error(
            "Socket" + (i + 1) + "'s mentorIDs should include Socket2's id"
          );
        }
        if (!SocketArray[i].user.menteeIDs.includes(SocketArray[0].user.id)) {
          throw new Error(
            `Socket${i + 1}'s menteeIDs should include Socket1's id`
          );
        }
      } else {
        if (SocketArray[0].user.mentorIDs.includes(SocketArray[i].user.id)) {
          throw new Error(
            "Socket" + (i + 1) + "'s mentorIDs should not include Socket1's id"
          );
        }
        if (
          SocketArray[i].user.menteeIDs &&
          SocketArray[i].user.menteeIDs.includes(SocketArray[0].user.id)
        ) {
          throw new Error(
            `Socket${i + 1}'s menteeIDs should not include Socket1's id`
          );
        }
      }
    }

    // ensure all mentorship requests are removed from all users' mentorshipRequests array
    for (let i = 0; i < SocketArray.length; i++) {
      if (
        SocketArray[i].user.mentorshipRequests &&
        SocketArray[i].user.mentorshipRequests.length > 0
      ) {
        throw new Error(
          "Socket" +
            (i + 1) +
            "'s mentorshipRequests should be undefined or empty " +
            JSON.stringify(SocketArray[i].user.mentorshipRequests)
        );
      }
    }
  });
});

// TODO: Add other tests for mentorship requests
// such as: FindMentorshipRequestBetweenUsers

afterAll(async () => {
  SocketArray[0].disconnect();
  // console.log("socket1data", SocketArray[0]);
  SocketArray[1].disconnect();
  // console.log("socket2data", SocketArray[1]);
  SocketArray[2].disconnect();
  // console.log("socket3data", SocketArray[2]);
  await sleep(1000); // give some time to disconnect before ending the process
});
