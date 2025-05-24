import { MentorshipRequestObj, MentorshipRequestStatus, UserObj } from "@shared/types/general";
import { DBCreate, DBDeleteWithID, DBGetWithID, DBSetWithID } from "../../db";
import { SendClientsDataWithUserID } from "../AuthenticatedSocket";
import { isValidUserObj } from "@shared/validation/user";
import { MAX_NUMBER_OF_MENTORS_PER_MENTEE } from "@shared/data/mentorshipRequests";
import { isValidMentorshipRequestObj } from "@shared/validation/general";

// export async function RemoveOutgoingMentorshipRequestsFromUser(userID: string) {
//   const userData = await DBGetWithID("user", userID);
//   const { mentorshipRequests } = userData;

//   if (!mentorshipRequests || !(mentorshipRequests instanceof Array)) {
//     return;
//   }

//   for (let mentorshipRequestID of mentorshipRequests) {
//     try {
//       const mentorshipRequestObj = await DBGetWithID(
//         "mentorshipRequest",
//         mentorshipRequestID
//       );
//       if (!mentorshipRequestID) {
//         continue;
//       }
//       const { mentorID, menteeID } = mentorshipRequestObj;
//       if (!mentorID || !menteeID) {
//         continue;
//       }

//       if (menteeID != userID) {
//         continue;
//       }
//       await RemoveMentorshipRequest(mentorshipRequestID, "cancelled");
//     } catch (err) {
//       console.error("[0scaj0s] RemoveOutgoingMentorshipRequests: " + err);
//     }
//   }
// }

export async function RemoveMentorshipRequest(
  mentorshipRequestID: string,
  alertStatus: MentorshipRequestStatus
) {
  if (!mentorshipRequestID) {
    return;
  }

  const mentorshipRequestObj = await DBGetWithID(
    "mentorshipRequest",
    mentorshipRequestID
  );
  if (!mentorshipRequestObj || typeof mentorshipRequestObj != "object" || !isValidMentorshipRequestObj(mentorshipRequestObj)) {
    return;
  }

  await DBDeleteWithID("mentorshipRequest", mentorshipRequestID);

  const { mentorID, menteeID } = mentorshipRequestObj;
  if (!mentorID || !menteeID) {
    console.error(
      "Something was wrong with the mentorship request",
      JSON.stringify(mentorshipRequestObj)
    );
    return;
  }

  await RemoveMentorshipRequestFromUser(mentorshipRequestID, mentorID);
  await RemoveMentorshipRequestFromUser(mentorshipRequestID, menteeID);

  const payload: MentorshipRequestObj = {
    ...mentorshipRequestObj,
    id: mentorshipRequestID,
    status: alertStatus,
  };
  
  SendClientsDataWithUserID([mentorID, menteeID], "mentorshipRequest", payload);
}

export async function RemoveMentorshipRequestFromUser(
  mentorshipRequestID: string,
  userID: string
) {
  if (!userID) {
    return;
  }

  const userData = await DBGetWithID("user", userID);
  if (!userData) {
    return;
  }

  const { mentorshipRequests } = userData;
  if (!mentorshipRequests) {
    return;
  }

  if (!(mentorshipRequests instanceof Array)) {
    console.error(`Mentorship request for ${userID} is invalid.`);
    return;
  }

  try {
    mentorshipRequests.splice(mentorshipRequests.indexOf(mentorshipRequestID));
    await DBSetWithID("user", userID, { mentorshipRequests }, true);
  } catch (err) {
    console.error(
      "Tried to remove mentorship request from user, but they did not have it. " +
        err.message
    );
  }
}

// TODO: change name, its vague
export async function addMentorshipRequest(
  mentorID: string,
  menteeID: string,
  testing: boolean
) {
  const mentorshipRequestObj: MentorshipRequestObj = {
    mentorID,
    menteeID,
  };
  testing && (mentorshipRequestObj.testing = true);

  const mentorshipRequestID = await DBCreate(
    "mentorshipRequest",
    mentorshipRequestObj
  );

  if (!mentorshipRequestID) {
    return;
  }

  await addMentorshipRequestToUser(mentorshipRequestID, mentorID);
  await addMentorshipRequestToUser(mentorshipRequestID, menteeID);

  SendClientsDataWithUserID([mentorID, menteeID], "mentorshipRequest", {
    ...mentorshipRequestObj,
    id: mentorshipRequestID,
  });
}

export async function addMentorshipRequestToUser(
  mentorshipRequestID: string,
  userID: string
) {
  if (!userID) {
    return;
  }

  const userData = await DBGetWithID("user", userID);
  if (!userData) {
    return;
  }

  let { mentorshipRequests } = userData;
  if (!mentorshipRequests) {
    mentorshipRequests = [];
  } else if (mentorshipRequests && !(mentorshipRequests instanceof Array)) {
    console.error(`Mentorship request for ${userID} is invalid.`);
    mentorshipRequests = [];
  }

  try {
    mentorshipRequests.push(mentorshipRequestID);
    await DBSetWithID("user", userID, { mentorshipRequests }, true);
  } catch (err) {
    console.error(
      "Tried to add mentorship request from user, but they did not have it. " +
        err.message
    );
  }
}

export async function setMentorshipBetweenUsers(
  mentorID: string,
  menteeID: string
) {
  // get both mentor and mentee
  // get both mentor and mentee
  const mentorObj = await DBGetWithID("user", mentorID);
  if (!mentorObj || !isValidUserObj(mentorObj)) {
    throw new Error("Mentor does not exist");
  }
  const menteeObj = await DBGetWithID("user", menteeID);
  if (!menteeObj || !isValidUserObj(menteeObj)) {
    throw new Error("Mentee does not exist");
  }

  // add mentee to mentor's mentee list
  let mentorMenteeList: Array<string> = mentorObj.menteeIDs;
  if (!mentorMenteeList) {
    mentorMenteeList = [];
  }
  mentorMenteeList.push(menteeID);

  // add mentor to mentee
  let menteeMentorList: Array<string> = menteeObj.mentorIDs;
  if (!menteeMentorList) {
    menteeMentorList = [];
  }
  menteeMentorList.push(mentorID);

  // ensure mentee does not have too many mentors
  if (menteeMentorList.length > MAX_NUMBER_OF_MENTORS_PER_MENTEE) {
    throw new Error("Mentee already has maximum number of mentors");
  }

  // update and send both
  const menteeUpdate: Partial<UserObj> = {
    mentorIDs: menteeMentorList,
  };
  await DBSetWithID("user", menteeID, menteeUpdate, true);

  const mentorUpdate: Partial<UserObj> = {
    menteeIDs: mentorMenteeList,
  };
  await DBSetWithID("user", mentorID, mentorUpdate, true);
}
