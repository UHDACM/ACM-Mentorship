// written in JS because typing is such an issue with redux
import { createSlice, Draft, PayloadAction } from "@reduxjs/toolkit";
import { ChatObj, MessageObj } from '@shared/types/general';


interface ChatState {
  open: boolean;
  chats: Map<string, ChatObj>,
  messages: Map<string, MessageObj | false>,
  loaded: boolean,
  activeChatID?: string,
  chatLastTimeRead: Map<string, number>
};

const initialState: ChatState = {
  open: false,
  chats: new Map(),
  chatLastTimeRead: new Map(),
  messages: new Map(),
  loaded: false
};
// tries to load chatLastTimeRead from local storage
try {
  const dat = localStorage.getItem('chatLastTimeRead');
  if (dat) {
    initialState.chatLastTimeRead = new Map(Object.entries(JSON.parse(dat)))
  }
} catch {}

const ChatSlice = createSlice({
  name: "Chat",
  initialState: initialState,
  reducers: {
    setChatOpen(state: Draft<ChatState>, action: PayloadAction<boolean>) {
      state.open = action.payload;
    },
    addChat(state: Draft<ChatState>, action: PayloadAction<{ chatID: string, chat: ChatObj }>) {
      const { chatID, chat } = action.payload;
      state.chats.set(chatID, chat);
    },
    setChats(state: Draft<ChatState>, action: PayloadAction<typeof initialState.chats>) {
      for (let [chatID, chatObj] of action.payload) {
        state.chats.set(chatID, chatObj);
      }
    },

    /** to be called only on load once */
    chatsAreLoaded(state: Draft<ChatState>) {
      state.loaded = true
    },
    setActiveChat(state: Draft<ChatState>, action: PayloadAction<string | undefined>) {
      state.activeChatID = action.payload;
    },
    addChatMessages(state: Draft<ChatState>, action: PayloadAction<MessageObj[]>) {
      for (let message of action.payload) {
        if (!message.id) {
          continue;
        }
        state.messages.set(message.id, message);
      }
    },
    setChatMessages(state: Draft<ChatState>, action: PayloadAction<typeof initialState.messages>) {
      for (let [messageID, messageObj] of action.payload) {
        state.messages.set(messageID, messageObj);
      }
    },
    markChatRead(state: Draft<ChatState>, action: PayloadAction<string>) {
      state.chatLastTimeRead.set(action.payload, Date.now());
      localStorage.setItem('chatLastTimeRead', JSON.stringify(Object.fromEntries(state.chatLastTimeRead.entries())));
    }
  }
});

export const { setChatOpen, addChat, setChats, chatsAreLoaded, setActiveChat, addChatMessages, setChatMessages, markChatRead } = ChatSlice.actions;
export default ChatSlice.reducer;
