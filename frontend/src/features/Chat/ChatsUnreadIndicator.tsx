import { useSelector } from "react-redux";
import { ReduxRootState } from "../../store";
import { useEffect, useState } from "react";

export default function ChatsUnreadIndicator({ style }: { style?: React.CSSProperties }) {
  const [hasUnread, setHasUnread] = useState(false);
  const { chatLastTimeRead, chats } = useSelector((store: ReduxRootState) => store.Chat);

  useEffect(() => {
    for (let [chatID, chatObj] of chats) {
      if (!chatLastTimeRead.has(chatID)) {
        setHasUnread(true);
        return;
      }

      if (chatObj.lastMessage!.timestamp > (chatLastTimeRead.get(chatID) || 0)) {
        setHasUnread(true);
        return;
      }
    }
    setHasUnread(false);
  }, [chats, chatLastTimeRead]);
  if (hasUnread) {
    return <div style={{width: '1rem', height: '1rem', backgroundColor: '#33d', borderRadius: '50%', ...style}}/>
  }
}