import { useDispatch, useSelector } from "react-redux";
import { ReduxRootState } from "../../store";
import { useEffect } from "react";
import {
  addChat,
  chatsAreLoaded,
  markChatRead,
  setChatMessages,
} from "./ChatSlice";
import { MyClientSocket } from "../ClientSocket/ClientSocketHandler";
import { ChatObj } from "@shared/types/general";

export const placeholderPreviewPicture =
  "https://www.mtsolar.us/wp-content/uploads/2020/04/avatar-placeholder.png";
/**
 * Component that ensures chats are kept up to date, and required messages are fetched.
 *
 * Also makes sure chatLastTimeRead is kept up to date
 * @returns
 */
export default function Chat() {
  const { chats, loaded, activeChatID } = useSelector(
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

    // todo: implement pagination if user has a lot of chats
    // todo: implement error handling

    console.log('Fetching missing chat IDs:', Array.from(missingIDs));
    MyClientSocket.GetChats(Array.from(missingIDs)).then(
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

  // handles getting all missing chat messages
  useEffect(() => {
    if (!activeChatID || !MyClientSocket || !activeChatObj || !self || !ready) {
      return;
    }
    // loads messages for the active chat into client socket, then into redux
    MyClientSocket.LoadChatMessages(activeChatID).then((status: boolean) => {
      if (!status) {
        return;
      } else if (!MyClientSocket?.messages) {
        return;
      } 
      dispatch(setChatMessages(MyClientSocket?.messages));
    });
    dispatch(markChatRead(activeChatID));
  }, [activeChatObj, activeChatID, self, ready]);

  return null;
}
