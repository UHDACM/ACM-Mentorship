import { DBGetWithID, DBSetWithID } from "../../db";
import { ObjectAny } from "@shared/types/general";
import { AllAcceptingMentorIDs } from "../AuthenticatedSocket";

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
            chatUserPreviewObj.mName = mName || '';
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
