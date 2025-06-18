import { DBGetWithID, DBSetWithID } from "../../db";
import { ObjectAny, UserObj } from "@shared/types/general";
import AuthenticatedSocket, {
  AllAcceptingMentorIDs,
  SendClientsDataWithUserID,
} from "../AuthenticatedSocket";
import { validateUserObj } from "@shared/validation/user";
import { TrySendPushNotificationToUsers } from "./notification";

/**
 * TODO: NOT TESTED
 *
 * Given a userID and some changed values, ensures sync is maintained with other entities
 *
 * Other entities may contain a preview user object, which should be changed if user is changed.
 *
 *
 * @param userID
 * @param changedValues
 */
export async function SyncUserProfile(
  userID: string,
  changedValues: ObjectAny
) {
  if (!userID || !changedValues) {
    console.error(
      "SyncUserProfile cannot be called without userID or changedValues object.",
      userID,
      JSON.stringify(changedValues, null, 2)
    );
    return;
  }

  const userObj = await DBGetWithID("user", userID);
  if (!userObj) {
    console.error(
      "SyncUserProfile tried to sync with nonexistant user.",
      userID
    );
    return;
  }

  const {
    displayPictureURL,
    username,
    fName,
    mName,
    lName,
    isMentor,
    acceptingMentees,
  } = changedValues;

  const NeedsChatSync =
    displayPictureURL || fName || mName || lName || username;
  if (NeedsChatSync) {
    const { chats } = userObj;
    if (chats && chats instanceof Array) {
      for (let chatID of chats) {
        DBGetWithID("chat", chatID)
          .then((chatObj) => {
            if (!chatObj || typeof chatObj != "object") {
              return;
            }
            const { users } = chatObj;
            if (!users || typeof users != "object" || !users[userID]) {
              // if no users, or current user is not part of chat, skip.
              return;
            }

            const chatUserPreviewObj = users[userID];
            // copies over changed properties
            fName && (chatUserPreviewObj.fName = fName);
            displayPictureURL &&
              (chatUserPreviewObj.displayPictureURL = displayPictureURL);
            username && (chatUserPreviewObj.username = username);
            chatUserPreviewObj.mName = mName || "";
            lName && (chatUserPreviewObj.lName = lName);

            DBSetWithID("chat", chatID, { users }, true).catch((err) =>
              console.error("Error in SyncUserProfile", err)
            );
          })
          .catch((err) => {
            console.error("err in syncUserProfile", err);
          });
      }
    }
  }

  // if either property was changed, mentor status possibly changed.
  const isAcceptingMentorStatusChanged =
    typeof isMentor == "boolean" || typeof acceptingMentees == "boolean";
  if (isAcceptingMentorStatusChanged) {
    const isAcceptingMentor = userObj.acceptingMentees && userObj.isMentor;
    if (isAcceptingMentor) {
      console.log("added to mentor list", userObj.username);
      AllAcceptingMentorIDs.add(userID);
    } else {
      console.log("removed from mentor list", userObj.username);
      // remove user if they made a change that would affect their accepting mentor status.
      AllAcceptingMentorIDs.delete(userID);
    }
  }
}

/**
 * This function returns the target userData with the information that is visible to the requestingUser.
 *
 * if no requestingUserID is provided, then the targetUser data is returned as it is.
 *
 * Otherwise, depending on relationship between requesting user and targetUser, some information will be removed before being returned.
 * @param targetUserID
 * @param requestingUserID
 * @returns
 */
export async function GetUserData(
  targetUserID: string,
  requestingUserID?: string
): Promise<UserObj> {
  let userData: UserObj;
  let selfData: UserObj;

  let userDataRaw = await DBGetWithID("user", targetUserID);
  if (!userDataRaw) {
    throw new Error("Requested user does not exist");
  }

  try {
    validateUserObj(userDataRaw);
  } catch (err) {
    throw new Error("Error while fetching user data: " + err.message);
  }

  userData = { ...userDataRaw };

  if (!requestingUserID) {
    return userData;
  }

  const selfDataRaw = await DBGetWithID("user", requestingUserID);
  if (!selfDataRaw) {
    throw new Error("Self user doesn't exist");
  }

  try {
    validateUserObj(selfDataRaw);
  } catch (err) {
    throw new Error("Error while fetching user data: " + err.message);
  }

  selfData = { ...selfDataRaw };

  const { mentorIDs: userMentorIDs } = userData;

  // check if this is ourself
  if (userData.id == selfData.id) {
    // if so, send userData.
    return userData;
  }

  // no users should have access to our mentee list except for ourselves.
  // no use knowing we are a mentee either.
  delete userData.menteeIDs;
  delete userData.isMentee;

  // no one should access our OAuthSubID or email either
  delete userData.OAuthSubID;
  delete userData.email;

  // no one should access our chat list either
  delete userData.chats;

  // check if target user is our mentee
  if (userMentorIDs && userMentorIDs.includes(requestingUserID)) {
    return userData;
  }

  if (selfData.isMentor) {
    return userData;
  }
  // target user is not a mentee. Delete mentee data
  delete userData.assessments;
  delete userData.mentorIDs;

  return userData;
}

export async function RemoveMentorship(
  mentorID: string,
  menteeID: string,
  initiator: "mentor" | "mentee"
) {
  // get both mentor and mentee
  const mentorObj = await DBGetWithID("user", mentorID);
  if (!mentorObj) {
    throw new Error("Mentor does not exist");
  }

  const menteeObj = await DBGetWithID("user", menteeID);
  if (!menteeObj) {
    throw new Error("Mentee does not exist");
  }

  // remove mentor from mentee
  const menteeMentorList: Array<string> = menteeObj.mentorIDs;
  if (!menteeMentorList) {
    throw new Error("Mentee does not have any mentors");
  }

  try {
    menteeMentorList.splice(menteeMentorList.indexOf(mentorID), 1);
  } catch {
    throw new Error(
      "Cannot remove mentee. They are not one of the mentor's mentees."
    );
  }

  menteeObj.menteeIDs = menteeMentorList;
  await DBSetWithID("user", menteeID, { menteeIDs: menteeMentorList }, true);

  // remove mentee from mentor's mentee list
  const mentorMenteeList: Array<string> = mentorObj.menteeIDs;
  if (!mentorMenteeList) {
    throw new Error("Mentor does not have any mentees");
  }

  try {
    mentorMenteeList.splice(mentorMenteeList.indexOf(menteeID), 1);
  } catch {
    throw new Error(
      "Cannot remove mentee. They are not one of the mentor's mentees."
    );
  }

  menteeObj.menteeIDs = mentorMenteeList;
  await DBSetWithID("user", mentorID, { menteeIDs: mentorMenteeList }, true);
  console.log("removed mentorship relation", menteeObj, mentorObj);

  let notiTitle = "";
  let notiMessage = "";
  let url = "";
  const notiTargets: string[] = [];
  if (initiator === "mentor") {
    notiTitle = "Mentorship Removed";
    notiMessage = `${mentorObj.fName} (@${mentorObj.username}) has removed you as their mentee.`;
    notiTargets.push(menteeID);
    url = `/app/my-mentor`;
  } else {
    notiTitle = "Mentorship Removed";
    notiMessage = `${menteeObj.fName} (@${menteeObj.username}) has removed you as their mentor.`;
    notiTargets.push(mentorID);
    url = `/app/my-mentees`;
  }

  SendClientsDataWithUserID([mentorID, menteeID], "updateSelf", {});
  AuthenticatedSocket.SendClientsMessageWithUserID(
    notiTargets,
    notiTitle,
    notiMessage
  );

  await TrySendPushNotificationToUsers(notiTargets, notiTitle, {
    body: notiMessage,
    data: {
      url: url,
    },
  });
}
