import { useDispatch, useSelector } from "react-redux";
import MinimalisticButton from "../../components/MinimalisticButton/MinimalisticButton";
import { ReduxRootState } from "../../store";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { setActiveChat } from "./ChatSlice";
import { MyClientSocket } from "../ClientSocket/ClientSocketHandler";
import { IoIosArrowRoundBack } from "react-icons/io";
import { placeholderPreviewPicture } from "./Chat";
import { OBSCURE_MODE } from "../../scripts/shared";
import { GetRandomAvatarURL } from "../../scripts/tools";

export default function ChatWidgetActiveChat({
  fontScale = 1,
}: {
  fontScale?: number;
}) {
  const { activeChatID, chats, messages } = useSelector(
    (store: ReduxRootState) => store.Chat
  );
  const { user: self, ready } = useSelector(
    (store: ReduxRootState) => store.ClientSocket
  );
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const chatSectionRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const activeChatObj = chats.get(activeChatID || "");

  // resizes text area
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "auto"; // Reset height
      textAreaRef.current.style.height =
        textAreaRef.current.scrollHeight + "px"; // Set new height
    }
  }, [text]);

  useEffect(() => {
    // used to keep chat scrolled to bottom when messages are sent.
    setTimeout(() => {
      if (!chatSectionRef.current) {
        return;
      }
      if (
        chatSectionRef.current.scrollHeight -
          chatSectionRef.current.clientHeight -
          chatSectionRef.current.scrollTop <
        180
      ) {
        setTimeout(() => {
          if (!chatSectionRef.current) {
            return;
          }
          chatSectionRef.current.scrollTo({
            top: chatSectionRef.current.scrollHeight + 1000,
          })
        }, 100);
      }
    }, 100);
  }, [activeChatObj?.messages]);

  useEffect(() => {
    // this scrolls to bottom after giving enough time to load messages
    setTimeout(() => {
      if (!chatSectionRef.current) {
        return;
      }
      chatSectionRef.current.scrollTo({
        top: chatSectionRef.current.scrollHeight + 1000,
      });
    }, 30);
  }, []);

  function onExitActiveChat() {
    dispatch(setActiveChat(undefined));
  }

  function handleSendMessage() {
    if (
      sending ||
      text.trim().length < 1 ||
      !MyClientSocket ||
      !ready ||
      !activeChatID
    ) {
      return;
    }

    setSending(true);
    MyClientSocket.SendMessage(activeChatID, text.trim()).then((v: boolean) => {
      setSending(false);
      if (!v) {
        return;
      }
      setText("");
    });
  }

  if (!activeChatID || !activeChatObj || !self) {
    onExitActiveChat();
    return;
  }

  const { users } = activeChatObj;
  const userIDsInChat = Object.keys(users);
  const otherUserID =
    userIDsInChat[0] !== self.id ? userIDsInChat[0] : userIDsInChat[1];
  const otherUserObj = users[otherUserID];

  return (
    <>
      <div
        style={{
          height: 2.5 * fontScale + "rem",
          backgroundColor: "#333",
          padding: 0.25 * fontScale + "rem",
          borderBottom: "1px solid #333",
          display: "flex",
          alignItems: "center",
        }}
      >
        <IoIosArrowRoundBack
          onClick={onExitActiveChat}
          size={2 * fontScale + "rem"}
          style={{ cursor: "pointer" }}
        />
        <div
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            marginLeft: 0.5 * fontScale + "rem",
          }}
          onClick={() => navigate(`/app/user?id=${otherUserID}`)}
        >
          <img
            style={{
              width: 1.5 * fontScale + "rem",
              height: 1.5 * fontScale + "rem",
              borderRadius: "50%",
            }}
            src={(OBSCURE_MODE ? GetRandomAvatarURL() : otherUserObj.displayPictureURL) || placeholderPreviewPicture}
          />
          <span style={{ marginLeft: 0.8 * fontScale + "rem" }}>
            {OBSCURE_MODE ? 'obscured' : `${otherUserObj.fName} ${otherUserObj.lName}`}
          </span>
        </div>
      </div>
      <div
        style={{
          width: "100%",
          background: "#222",
          height: "100%",
          padding: 10,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          overflowX: "hidden",
          overflowY: "scroll",
          scrollbarColor: "#555",
          scrollbarWidth: "thin",
          paddingTop: 1 * fontScale + "rem",
          paddingBottom: 7.7 * fontScale + "rem",
        }}
        ref={chatSectionRef}
      >
        {activeChatObj.messages.filter((messageID) => messages.get(messageID) != false).map((messageID, messageIndex) => {
          const messageObj = messages.get(messageID);
          const prevMessageID = activeChatObj.messages[messageIndex - 1];
          const prevMessageObj = prevMessageID
            ? messages.get(prevMessageID)
            : undefined;
          if (!messageObj || prevMessageObj === false) {
            return null;
          }
          return (
            <div
              key={`message_${messageID}`}
              style={{
                width: "100%",
                display: "flex",
                flexDirection:
                  messageObj.sender !== self.id ? "row" : "row-reverse",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: messageObj.sender !== self.id ? "start" : "end",
                  width: "100%",
                }}
              >
                {prevMessageObj?.sender !== messageObj.sender && (
                  <div style={{ marginTop: 0.1 * fontScale + "rem" }}>
                    {OBSCURE_MODE ? 'obscured' : users[messageObj.sender].fName}
                  </div>
                )}
                <div
                  style={{
                    maxWidth: "80%",
                    backgroundColor: "#555",
                    padding: 0.5 * fontScale + "rem",
                    borderRadius: 0.5 * fontScale + "rem",
                    marginTop: 0.3 * fontScale + "rem",
                  }}
                >
                  {messageObj.contents}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          width: "100%",
          backgroundColor: "#333",
          height: "auto",
          display: "flex",
          flexDirection: "row",
          alignItems: "start",
          paddingBottom: 0.5 * fontScale + "rem",
          paddingLeft: 0.5 * fontScale + "rem",
          paddingRight: 0.25 * fontScale + "rem",
          paddingTop: 0.25 * fontScale + "rem",
          boxSizing: "border-box",
          borderTop: "1px solid #fff2",
          position: "absolute",
          bottom: 0,
        }}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          ref={textAreaRef}
          style={{
            padding: 0.5 * fontScale + "rem",
            borderRadius: 0.5 * fontScale + "rem",
            minHeight: 2.5 * fontScale + "rem",
            fontSize: fontScale + "rem",
            color: "black",
            background: "#eee",
            width: "100%",
            resize: "none",
          }}
          disabled={sending}
          placeholder="(ctrl + enter = send)"
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.ctrlKey) {
              handleSendMessage();
            }
          }}
        />
        <MinimalisticButton
          style={{
            fontSize: 0.8 * fontScale + "rem",
            marginLeft: 0.5 * fontScale + "rem",
            marginRight: 0.25 * fontScale + "rem",
          }}
          disabled={sending}
          onClick={handleSendMessage}
        >
          Send
        </MinimalisticButton>
      </div>
    </>
  );
}
