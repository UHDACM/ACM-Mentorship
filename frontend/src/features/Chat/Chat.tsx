import { useDispatch, useSelector } from "react-redux";
import { ReduxRootState } from "../../store";
import { useEffect } from "react";
import { addChat, addChatMessages, chatsAreLoaded, markChatRead } from "./ChatSlice";
import { MyClientSocket } from "../ClientSocket/ClientSocket";
import { ChatObj, MessageObj } from '@shared/types/general';


export const placeholderPreviewPicture =
  "https://www.mtsolar.us/wp-content/uploads/2020/04/avatar-placeholder.png";
/**
 * Component that ensures chats are kept up to date, and required messages are fetched.
 * 
 * Also makes sure chatLastTimeRead is kept up to date
 * @returns 
 */
export default function Chat() {
  const { chats, loaded, activeChatID, messages } = useSelector(
    (store: ReduxRootState) => store.Chat
  );
  const dispatch = useDispatch();
  const { ready, user } = useSelector(
    (store: ReduxRootState) => store.ClientSocket
  );
  const activeChatObj = chats.get(activeChatID || "");
  useEffect(() => {
    // ensures all chat data is loaded.
    if (!ready || !user || !MyClientSocket || loaded) {
      return;
    }

    const { chats: userChats } = user;
    if (!userChats) {
      dispatch(chatsAreLoaded());
      return;
    }

    const missingIDs = new Set<string>();
    for (let chatID of userChats) {
      if (!chats.has(chatID)) {
        missingIDs.add(chatID);
      }
    }
    if (missingIDs.size == 0) {
      dispatch(chatsAreLoaded());
      return;
    }

    MyClientSocket.GetChats(
      Array.from(missingIDs),
      (missingChatObjs: ChatObj[]) => {
        if (!missingChatObjs || !(missingChatObjs instanceof Array)) {
          return;
        }
        for (let missingChatObj of missingChatObjs) {
          dispatch(
            addChat({ chatID: missingChatObj.id, chat: missingChatObj })
          );
        }
        dispatch(chatsAreLoaded());
      }
    );
  }, [ready, user]);

  // handles getting all chat messages
  useEffect(() => {
    if (!activeChatID || !MyClientSocket || !activeChatObj || !self || !ready) {
      return;
    }

    // find all messages we don't have yet
    const missingMessages: string[] = [];
    const { messages: chatMessages } = activeChatObj;
    for (let messageID of chatMessages) {
      if (!messages.has(messageID)) {
        missingMessages.push(messageID);
      }
    }

    if (missingMessages.length > 0) {
      MyClientSocket.GetMessages(missingMessages, (messages: MessageObj[]) => {
        dispatch(addChatMessages(messages));
      });
    }
    dispatch(markChatRead(activeChatID));
  }, [activeChatObj, activeChatID, self, ready]);

  return null;
}