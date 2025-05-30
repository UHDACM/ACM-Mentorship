import { ChatObj, MessageObj } from "@shared/types/general";
import {
  DBCreate,
  DBDeleteWithID,
  DBGetWithID,
  DBObj,
  DBSetWithID,
  DocumentTestKey,
} from "src/db";
import AuthenticatedSocket, { SendClientsDataWithUserID } from "../AuthenticatedSocket";
import { isValidChatObj, isValidMessageContent } from "@shared/validation/general";

export async function CreateChat(
  targetUserIDs: string[],
  requestingUserID: string,
  firstMessageContents: string,
  testing?: boolean
) {
  if (!requestingUserID) {
    throw new Error("Requesting UserID was not provided");
  } else if (
    !targetUserIDs ||
    !(targetUserIDs instanceof Array) ||
    targetUserIDs.length == 0
  ) {
    throw new Error("TargetUserIDs were not provided");
  } else if (targetUserIDs.includes(requestingUserID)) {
    throw new Error("TargetUserIDs cannot include the requesting userID");
  } else if (!firstMessageContents) {
    throw new Error("Cannot create chat, no message was provided");
  }
  console.log(
    "[ie45] noParamIssues",
    JSON.stringify({ targetUserIDs, requestingUserID }, null, 2)
  );

  // ensure requesting user exists
  const requestingUserObj = await DBGetWithID("user", requestingUserID);
  if (!requestingUserObj) {
    throw new Error("Requesting user's account does not exist");
  }

  // determine if chat exists if every user has a chatID in common
  // if current user doesn't have a chats array, then a common chatID cannot exist, and thus the chat does not exist
  let chatDoesNotExist = requestingUserObj.chats ? false : true;

  let chatIDCounts = new Map<string, number>();
  if (!chatDoesNotExist) {
    for (let chatID of requestingUserObj.chats) {
      chatIDCounts.set(chatID, 1);
    }
  }

  // ensure targetUserIDs are valid
  const targetUserIDSet = new Map<string, DBObj>();
  // add requesting user to set.
  targetUserIDSet.set(requestingUserID, requestingUserObj);
  for (let userID of targetUserIDs) {
    // ensure userID is valid, and user exists.
    if (typeof userID != "string") {
      throw new Error("A target userID is invalid");
    }

    if (targetUserIDSet.get(userID)) {
      continue;
    }
    // this prevents retrieving users more than once, even if they appear in the array more than once.
    const targetUser = await DBGetWithID("user", userID);
    if (!targetUser) {
      throw new Error("User with userID " + userID + " does not exist.");
    }
    targetUserIDSet.set(userID, targetUser);
    console.log("foundAndAdded", userID, targetUser.username);

    if (chatDoesNotExist) {
      continue;
    }

    const { chats } = targetUser;
    if (!chats) {
      chatDoesNotExist = true;
      continue;
    } else if (!(chats instanceof Array)) {
      // very weird. Should never happen. Override chats property with an array
      console.error(
        "A user has a chats property that isn't an array. " +
          userID +
          " - " +
          JSON.stringify(chats)
      );
      await DBSetWithID("user", userID, { chats: [] }, true);
      continue;
    } else {
      // process each chatID current user has
      for (let chatID of chats) {
        // count only the ones the initial user had
        const chatIDCount = chatIDCounts.get(chatID);
        if (chatIDCount) {
          chatIDCounts.set(chatID, chatIDCount + 1);
        }
      }
    }
  }
  console.log("[ie45] gabagoo");

  // ensure no chats with current members exist
  const userCount = targetUserIDSet.size;
  if (!chatDoesNotExist) {
    // search for existing chat, ensuring on doesn't already exist.
    for (let [chatID, count] of chatIDCounts) {
      if (count == userCount) {
        // end up here if every user has current chatID in common
        const existingChatObj = await DBGetWithID("chat", chatID);
        if (!existingChatObj) {
          console.error(
            "Uh oh, every user had chatID",
            chatID,
            "but chat doesn't exist"
          );
          continue;
        }
        const { users } = existingChatObj;
        if (!users || typeof users != "object") {
          console.error(
            "Chat",
            chatID,
            "had no users, or users were invalid",
            users
          );
          // TODO: delete chat
          continue;
        } else if (Object.keys(users).length == userCount) {
          // existing chat was found.
          return chatID;
        }
      }
    }
    // provides no real substance. Cannot pass this section if chat exists.
    chatDoesNotExist = true;
  }

  console.log("[ie45] heemiejeems");
  // chat does not exist. Go ahead and create
  const users = {};
  for (let [userID, userObj] of targetUserIDSet) {
    // contruct preview in chat object
    users[userID] = {
      username: userObj.username || "[no username]",
      fName: userObj.fName || "",
      mName: userObj.mName || "",
      lName: userObj.lName || "",
      displayPictureURL: userObj.displayPictureURL || "",
    };
  }
  console.log("[ie45] parabsa");
  let createdChatID: string;
  const chatObj: Partial<ChatObj> = {
    users,
    messages: [],
  };

  if (testing) {
    chatObj[DocumentTestKey] = true;
  }

  try {
    createdChatID = await DBCreate("chat", chatObj);
  } catch (err) {
    console.error(
      "Something went wrong while creating chat",
      err,
      JSON.stringify(users, null, 2)
    );
    throw new Error("Something went wrong while creating chat");
  }

  // update every user's chat to contain this chat
  for (let [userID, userObj] of targetUserIDSet) {
    const { chats } = userObj;
    let newChats: string[];
    if (!chats || !(chats instanceof Array)) {
      newChats = [createdChatID];
    } else {
      newChats = [...chats, createdChatID];
    }

    try {
      await DBSetWithID("user", userID, { chats: newChats }, true);
    } catch (err) {
      console.error(
        "Error while updating user chat array",
        err,
        JSON.stringify(newChats)
      );
    }
  }

  // now send message in chat.
  await SendChatMessage(
    firstMessageContents,
    createdChatID,
    requestingUserID,
    testing
  );

  return createdChatID;
}

export async function SendChatMessage(
  contents: string,
  chatID: string,
  requestingUserID: string,
  testing?: boolean
) {
  if (!requestingUserID || !chatID) {
    throw new Error("Cannot send message: No requesting userID was provided");
  }

  isValidMessageContent(contents);

  // verify requesting user exists
  const userObj = await DBGetWithID("user", requestingUserID);
  if (!userObj) {
    throw new Error("Cannot send message: Requesting user does not exist");
  }

  const { chats } = userObj;
  // verify user is part of chat on their side
  if (!chats || !(chats instanceof Array) || !chats.includes(chatID)) {
    throw new Error(
      "Cannot send message: requesting user is not part of chat."
    );
  }

  // verify target chat exists
  const chatObj = await DBGetWithID("chat", chatID);
  if (!chatObj) {
    console.error(
      "ERROR! User has chat in chat array, but chat does not exist",
      "user:",
      requestingUserID,
      "chat:",
      chatID
    );
    throw new Error("Cannot send message: requested chat does not exist");
  }

  try {
    if (!isValidChatObj(chatObj)) {
      // will never enter in here. Error will be thrown in validation function
      throw new Error("Malformed chat object");
    }
  } catch (err) {
    throw new Error(
      "Cannot send message: " +
        (err instanceof Error ? err.message : "requested chat is invalid")
    );
  }

  if (
    !chatObj.users ||
    typeof chatObj.users !== "object" ||
    !Object.keys(chatObj.users).includes(requestingUserID)
  ) {
    throw new Error(
      "Cannot send message: requesting user is not part of chat."
    );
  }

  // verification done. Send message
  let messageID: string;
  const messageObj: MessageObj = {
    contents: contents.trim(),
    timestamp: Date.now(),
    sender: requestingUserID,
    chatID: chatID,
  };

  if (testing) {
    messageObj[DocumentTestKey] = true;
  }

  try {
    messageID = await DBCreate("message", messageObj);
  } catch (err) {
    throw new Error("Something went wrong while creating message");
  }

  // updates chat message array
  let messages = [...(chatObj.messages || [])];
  while (messages.length > AuthenticatedSocket.ChatMessageCountLimit - 1) {
    const deletedMessageID = messages.shift();
    try {
      await DBDeleteWithID("message", deletedMessageID);
    } catch (err) {
      console.error("Problem while deleting message", messageID, err);
    }
  }
  messages.push(messageID);

  // update chat with new message array and preview
  try {
    await DBSetWithID(
      "chat",
      chatID,
      {
        messages,
        lastMessage: messageObj,
      },
      true
    );
  } catch (err) {
    throw new Error("Something went wrong while updating chat");
  }

  const newChatObj: ChatObj = {
    ...chatObj,
    messages,
    lastMessage: messageObj,
  };
  const { users } = newChatObj as ChatObj;
  console.log("sentChatMessage");
  // send updated chat to all involved users
  SendClientsDataWithUserID(Object.keys(users), "chat", newChatObj);
}
