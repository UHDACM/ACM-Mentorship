import { useDispatch, useSelector } from "react-redux";
import { setActiveChat, setChatOpen } from "../../features/Chat/ChatSlice";
import { ReduxRootState } from "../../store";
import {
  ClientSocketUser,
  MyClientSocket,
} from "../../features/ClientSocket/ClientSocket";
import { closeDialog, setDialog } from "../../features/Dialog/DialogSlice";
import { ObjectAny } from "@shared/types/general";

export default function useChatWithUser() {
  const { user: self } = useSelector(
    (store: ReduxRootState) => store.ClientSocket
  );
  const { chats } = useSelector((store: ReduxRootState) => store.Chat);
  const dispatch = useDispatch();
  async function chatWithUser(targetUserID: string) {
    let user: ClientSocketUser | undefined;
    try {
      if (!MyClientSocket) {
        return;
      }
      user = await new Promise((res) => {
        MyClientSocket?.GetUser(
          targetUserID,
          (v: ClientSocketUser | boolean) => {
            if (!v || typeof v == "boolean") {
              return;
            }
            res(v);
          }
        );
      });
    } catch (err) {
      return;
    }
    if (!self || !self.id || !user || !user.id) {
      return;
    }
    for (let [chatID, chatObj] of chats) {
      const chatUsers = Object.keys(chatObj.users);
      if (chatUsers.length != 2) {
        continue;
      } else if (!chatUsers.includes(self.id) || !chatUsers.includes(user.id)) {
        continue;
      }

      // if we reach this point, we have found the chat.
      dispatch(setChatOpen(true));
      dispatch(setActiveChat(chatID));
      return;
    }

    // no chat exists, prompt user to start the convo.
    dispatch(
      setDialog({
        title: "Start the Convo!",
        subtitle: "Make a solid first impression",
        inputs: [
          {
            name: "message",
            label: "Message",
            type: "text",
            containerStyle: { minWidth: 200 },
          },
        ],
        buttons: [
          {
            text: "Send",
            useDisableTill: true,
            onClick: (params, cb) => {
              if (!MyClientSocket || !user || !user.id) {
                cb && cb();
                return;
              }
              const { message } = params as ObjectAny;
              if (!message) {
                cb && cb();
                return;
              }
              MyClientSocket.CreateChat(
                user.id,
                message,
                (v: boolean | string) => {
                  if (typeof v == "boolean") {
                    cb && cb();
                    return;
                  }
                  cb && cb();
                  dispatch(closeDialog());
                  dispatch(setActiveChat(v));
                }
              );
            },
          },
        ],
        buttonContainerStyle: { width: "100%", display: 'flex', justifyContent: 'end' },
      })
    );
  }

  return chatWithUser
}
