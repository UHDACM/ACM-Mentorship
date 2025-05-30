import {
  Assessment,
  AssessmentQuestion,
  ChatObj,
  GoalObj,
  MentorshipRequestObj,
  MessageObj,
  UserObj,
} from "@shared/types/general";
import {
  ClientSocketEvent,
  ClientSocketEvents,
  ClientSocketPostInstanceVariableUpdateFunction,
  ClientSocketPostProcessingFunction,
  ClientSocketState,
  MentorshipRequestResponseAction,
  ServerSocketEvent,
} from "@shared/types/socket";
import {
  isServerSocketPayloadDataInitialData,
  isValidServerSocketPayloadDataBase,
  isValidServerSocketPayloadDataChat,
  isValidServerSocketPayloadDataMentorshipRequest,
  isValidServerSocketPayloadDataUpdateSelf,
} from "@shared/validation/serverSocketPayload";
import {
  isAssessment,
  isSubmitGoalAction,
  isValidChatObj,
  isValidGoal,
  isValidMentorshipRequestObj,
  isValidMessageContent,
  isValidMessageObj,
} from "@shared/validation/general";
import {
  isClientSocketState,
  isSubmitAssessmentAction,
} from "@shared/validation/socket";
import { io, ManagerOptions, Socket, SocketOptions } from "socket.io-client";
import {
  ClientCreateUserPayload,
  ClientSocketPayloadSendMessageCreate,
  ClientSocketPayloadSendMessageSend,
  SocketPayloadMentorshipAccept,
  SocketPayloadMentorshipCancel,
  SocketPayloadMentorshipDecline,
  SocketPayloadMentorshipRemoveMentee,
  SocketPayloadMentorshipRemoveMentor,
  SocketPayloadMentorshipSend,
  SubmitAssessmentPayload,
  SubmitGoalPayload,
} from "@shared/types/clientSocketPayload";
import { isValidUserObj } from "@shared/validation/user";
import {
  SocketServerErrorImproperlyFormattedToken,
  SocketServerErrorNoToken,
} from "@shared/data/socketServer";

const MAX_FAILED_CONNECTION_ATTEMPTS = 3;
const OBSCURE_MODE = false;

export class ClientSocket {
  /**
   * used to track socket attached socket events that can be cleaned up later
   * this is used to remove event listeners when the client state changes
   * without removing all listeners (which would include those attached externally)
   **/

  private socket: Socket;
  private postProcess?: ClientSocketPostProcessingFunction;
  private postProcessInstanceVariableUpdate: ClientSocketPostInstanceVariableUpdateFunction = () => {};
  user: UserObj = {};
  state: ClientSocketState = "connecting";
  availableAssessmentQuestions: AssessmentQuestion[] = [];
  chats: Map<string, ChatObj> = new Map();
  messages: Map<string, MessageObj | false> = new Map();

  /**
   * Tracks the number of connection attempts made
   * Used to limit the number of connection attempts before giving up
   * and setting the client state to "disconnected"
   */
  connectionAttempts: number = 0;

  // needs to handle chat messages too

  constructor(
    socketServerURL: string,
    opts?: ManagerOptions | SocketOptions,
    postProcess?: ClientSocketPostProcessingFunction,
    postProcessInstanceVariableUpdate?: ClientSocketPostInstanceVariableUpdateFunction
  ) {
    // assign post processing function if provided
    this.postProcess = postProcess;
    if (postProcessInstanceVariableUpdate) {
      this.postProcessInstanceVariableUpdate = postProcessInstanceVariableUpdate;
    }

    // connect to server
    this.socket = io(`${socketServerURL}`, opts);

    // this.socket.onAny((event, ...args) => {
    //   console.log(`Socket Event: ${event}`, args);
    // });
    const connectingState: ClientSocketState = "connecting";
    this._invokeHandler("state", connectingState);
    this._attachEssentialListeners();
  }

  /**
   * Handle connection errors
   *
   * Payload is an error or a string.
   *
   * If it is an error, the server rejected the socket.
   *
   * if it is a string, the error happened somewhere later in the connection process.
   *
   *
   *
   * DO NOT CALL THIS FUNCTION DIRECTLY
   * call `_invokeHandler("connect_error")` instead
   * @param payload Is an error or a string
   * @returns void
   */
  private _handleConnectError(payload?: unknown) {
    // error is fatal, and should not be reattempted
    if (payload instanceof Error) {
      console.error("Connection error:", payload.message);
      this.disconnect();

      if (payload.message === SocketServerErrorNoToken) {
        // TODO: do something to notify user that they need to provide a token
      } else if (
        payload.message === SocketServerErrorImproperlyFormattedToken
      ) {
        // TODO: do something to notify user that they need to provide a valid token
      }
      return;
    }

    // if it is a string, the error happened somewhere later in the connection process.
    // so we can try to reconnect a few times.
    const connectingState: ClientSocketState = "connecting";
    this._invokeHandler("state", connectingState);
    this.connectionAttempts++;
    if (this.connectionAttempts >= MAX_FAILED_CONNECTION_ATTEMPTS) {
      this.disconnect();
      return;
    }
  }

  /**
   * Handle incoming socket data
   *
   * Server will send to "data" event, payloads of type `ServerSocketPayloadDataBase`
   *
   * DO NOT CALL THIS FUNCTION DIRECTLY
   * call `_invokeHandler("data", payload)` instead
   *
   * @param payload The incoming data payload
   * @returns void
   */
  private _handleData(payload: unknown) {
    // all valid payload data will be of type (or extend) ServerSocketPayloadDataBase
    if (!isValidServerSocketPayloadDataBase(payload)) {
      return;
    }

    // handle mentorship request data
    if (isValidServerSocketPayloadDataMentorshipRequest(payload)) {
      const { data: mentorshipRequestObj } = payload;
      if (!isValidMentorshipRequestObj(mentorshipRequestObj)) {
        return;
      }

      // TODO: I should probably do something with this data.
      this.requestUpdateSelf();
    } else if (isServerSocketPayloadDataInitialData(payload)) {
      const { user, availableAssessmentQuestions } = payload.data;
      this._setUser(user);
      this._setAvailableAssessmentQuestions(availableAssessmentQuestions);
    } else if (isValidServerSocketPayloadDataChat(payload)) {
      const chatObj = payload.data;
      this._setChatID(chatObj.id, chatObj);
    } else if (isValidServerSocketPayloadDataUpdateSelf(payload)) {
      this.requestUpdateSelf();
    } else {
      console.error("==== Invalid Payload ====", payload.type, payload.data);
      return;
    }
  }

  /**
   * This function handles incoming state changes from the server
   *
   *
   * NEVER CALL THIS FUNCTION DIRECTLY
   *
   * call `_invokeHandler("state", state)` instead
   *
   * @param state
   * @returns
   */
  private _handleState(state: unknown) {
    if (!isClientSocketState(state)) {
      return;
    }
    this._setState(state);
  }

  /**
   * In the initializer, all socket events are routed to this function
   *
   * This allows the class to handle certain events internally, while also
   * allowing for a post-processing function to be run after each event is handled.
   *
   * @param event
   * @param payload
   */
  private _invokeHandler(event: ClientSocketEvent, payload?: unknown) {
    if (event === "data") {
      this._handleData(payload);
    } else if (event === "state") {
      this._handleState(payload);
    } else if (event === "connect_error") {
      this._handleConnectError(payload);
    } else if (event === "disconnect") {
      this._handleDisconnect();
    }

    // there is intentionally no handler for "message" and "connect"

    if (this.postProcess) {
      this.postProcess(event, payload);
    }
  }

  /*
    Attaches event listeners for all expected events.
    Routed through _invokeHandler to allow for internal handling and post-processing (through this.postProcess).
  */
  private _attachEssentialListeners() {
    for (let event of ClientSocketEvents) {
      this.socket.on(event, (payload: unknown) =>
        this._invokeHandler(event, payload)
      );
    }
  }

  /**
   * Create a new user account
   *
   * Rejects the promise if the account cannot be created
   *
   * @param params The user account parameters (as `ClientCreateUserPayload`)
   * @param callback The callback function to call with the result
   * @returns void
   */
  public async CreateAccount(
    params: ClientCreateUserPayload
  ): Promise<boolean> {
    // don't submit if already submitting some information.
    if (this.state != "authed_nouser") {
      throw new Error("You already have an account");
    }

    if (typeof params != "object") {
      throw new Error("Params are invalid.");
    }

    const { fName, mName, lName, username } = params;
    if (!fName) {
      throw new Error("You're missing a first name.");
    } else if (!lName) {
      throw new Error("You're missing a last name.");
    } else if (!username) {
      throw new Error("You're missing a username.");
    }

    const payload: ClientCreateUserPayload = {
      fName,
      mName,
      lName,
      username,
    };

    const createUserEvent: ServerSocketEvent = "createUser";
    return await new Promise((res) => {
      this.socket.emit(createUserEvent, payload, (v: boolean) => {
        res(v);
      });
    });
  }

  public async UpdateProfile(params: Partial<UserObj>): Promise<boolean> {
    const UpdateProfileEvent: ServerSocketEvent = "updateProfile";
    return await new Promise((res) => {
      this.socket.emit(UpdateProfileEvent, params, (v: boolean) => {
        // if successful, requests a self update
        v && this.requestUpdateSelf();
        res(v);
      });
    });
  }

  public SubmitAssessment(
    payload: SubmitAssessmentPayload
  ): Promise<boolean | string> {
    const { action, questions, id } = payload;

    return new Promise((res) => {
      if (!action || !isSubmitAssessmentAction(action)) {
        throw new Error(`Not sure what action ${action} is.`);
      }

      const submitAssessmentAction: ServerSocketEvent = "submitAssessment";
      if (action == "create") {
        this.socket.emit(
          submitAssessmentAction,
          { action, questions },
          (v: boolean | string) => {
            res(v);
            if (v) {
              this.requestUpdateSelf();
            }
          }
        );
      } else if (action == "edit") {
        this.socket.emit(
          submitAssessmentAction,
          { action, questions, id },
          (v: boolean | string) => {
            res(v);
          }
        );
      } else if (action == "delete") {
        if (!id || typeof id != "string") {
          res(false);
          return;
        }
        this.socket.emit(
          submitAssessmentAction,
          { action, id },
          (v: boolean | string) => {
            res(v);
            if (v) {
              this.requestUpdateSelf();
            }
          }
        );
      }
      this.requestUpdateSelf();
    });
  }

  public SubmitGoal({
    action,
    goal,
    id,
  }: SubmitGoalPayload): Promise<boolean | string> {
    if (!isSubmitGoalAction(action)) {
      throw new Error("Action is invalid");
    }

    const submitGoalAction: ServerSocketEvent = "submitGoal";
    return new Promise((res) => {
      switch (action) {
        case "create":
          if (!goal || typeof goal != "object") {
            return;
          }
          const createPayload: SubmitGoalPayload = { goal, action: "create" };
          this.socket.emit(
            submitGoalAction,
            createPayload,
            (v: boolean | string) => {
              res(v);
              if (v) {
                this.requestUpdateSelf();
              }
            }
          );
          break;
        case "edit":
          if (!goal || typeof goal != "object") {
            res(false);
            return;
          } else if (!id || typeof id != "string") {
            res(false);
            return;
          }
          const editPayload: SubmitGoalPayload = { goal, action: "edit", id };
          this.socket.emit(submitGoalAction, editPayload, (v: boolean) => {
            res(v);
            if (v) {
              this.requestUpdateSelf();
            }
          });
          break;
        case "delete":
          if (!id || typeof id != "string") {
            res(false);
            return;
          }
          const deletePayload: SubmitGoalPayload = { id, action: "delete" };
          this.socket.emit(submitGoalAction, deletePayload, (v: boolean) => {
            res(v);
            if (v) {
              this.requestUpdateSelf();
            }
          });
          break;
        default:
          res(false);
          return;
      }
    });
  }

  public BecomeMentor() {
    return this.UpdateProfile({ isMentor: true, acceptingMentees: true });
  }

  public SendMentorshipRequest(userID: string): Promise<boolean> {
    const mentorshipRequestAction: ServerSocketEvent = "mentorshipRequest";

    const sendPayload: SocketPayloadMentorshipSend = {
      action: "send",
      mentorID: userID,
    };
    return new Promise((res) => {
      this.socket.emit(mentorshipRequestAction, sendPayload, (v: boolean) => {
        this.requestUpdateSelf();
        res(v);
      });
    });
  }

  public RemoveMentor(mentorID: string): Promise<boolean> {
    if (!mentorID || typeof mentorID != "string") {
      throw new Error("Invalid mentorID");
    }
    const mentorshipRequestAction: ServerSocketEvent = "mentorshipRequest";
    const removeMentorPayload: SocketPayloadMentorshipRemoveMentor = {
      action: "removeMentor",
      mentorID: mentorID,
    };
    return new Promise((res) => {
      this.socket.emit(
        mentorshipRequestAction,
        removeMentorPayload,
        (v: boolean) => {
          this.requestUpdateSelf();
          res(v);
        }
      );
    });
  }

  public RemoveMentee(menteeID: string): Promise<boolean> {
    if (!menteeID || typeof menteeID != "string") {
      throw new Error("Invalid menteeID");
    }
    const mentorshipRequestAction: ServerSocketEvent = "mentorshipRequest";
    const removeMenteePayload: SocketPayloadMentorshipRemoveMentee = {
      action: "removeMentee",
      menteeID: menteeID,
    };

    return new Promise((res) => {
      this.socket.emit(
        mentorshipRequestAction,
        removeMenteePayload,
        (v: boolean) => {
          this.requestUpdateSelf();
          res(v);
        }
      );
    });
  }

  public GetMentorshipRequestBetweenMentorMentee(
    mentorID: string,
    menteeID: string
  ): Promise<MentorshipRequestObj | false> {
    if (!mentorID || !menteeID) {
      throw new Error("Mentor or Mentee ID(s) not provided");
    }

    const GetRequestAction: ServerSocketEvent =
      "getMentorshipRequestBetweenUsers";
    return new Promise((res) => {
      this.socket.emit(GetRequestAction, mentorID, menteeID, (v: unknown) => {
        try {
          if (!isValidMentorshipRequestObj(v)) {
            throw new Error();
          }
        } catch {
          res(false)
          return;
        }
        res(v);
      });
    });
  }

  public DoMentorshipRequestAction(
    requestID: string,
    mentorshipRequestAction: MentorshipRequestResponseAction
  ): Promise<boolean> {
    const PayloadAction:
      | SocketPayloadMentorshipAccept
      | SocketPayloadMentorshipCancel
      | SocketPayloadMentorshipDecline = {
      mentorshipRequestID: requestID,
      action: mentorshipRequestAction,
    };
    const mentorshipRequestEvent: ServerSocketEvent = "mentorshipRequest";
    return new Promise((res) => {
      this.socket.emit(mentorshipRequestEvent, PayloadAction, (v: boolean) => {
        res(v);
        if (v) {
          this.requestUpdateSelf();
        }
      });
    });
  }

  public CreateChat(
    targetUserID: string,
    messageContent: string
  ): Promise<string> {
    return new Promise((res, rej) => {
    if (!targetUserID || !messageContent) {
      rej(
        "Cannot create chat without a target user or message content"
      );
    } 
    
    try {
      if (!isValidMessageContent(messageContent)) {
        // it will throw an error if invalid in the function
        throw new Error("Message content is invalid");
      }
    } catch (err) {
      rej((err as Error).message);
      return;
    }

    const sendMessageAction: ServerSocketEvent = "sendMessage";
    const sendMessagePayload: ClientSocketPayloadSendMessageCreate = {
      action: "create",
      contents: messageContent,
      targetUserIDs: [targetUserID],
    };

      this.socket.emit(
        sendMessageAction,
        sendMessagePayload,
        (v: false | string) => {
          if (v == false) {
            rej('Could not create chat');
            return;
          }
          res(v);
        }
      );
    });
  }

  public SendMessage(chatID: string, messageContent: string): Promise<boolean> {
    if (!chatID || !messageContent) {
      throw new Error("ChatID or message content not provided");
    } else if (messageContent.length == 0) {
      throw new Error(
        "We need a little bit more text before we can send this message."
      );
    }

    const sendMessageAction: ServerSocketEvent = "sendMessage";
    const sendMessagePayload: ClientSocketPayloadSendMessageSend = {
      action: "send",
      contents: messageContent,
      chatID: chatID,
    };
    return new Promise((res) => {
      this.socket.emit(
        sendMessageAction,
        sendMessagePayload,
        (v: boolean | string) => {
          if (typeof v !== "boolean") {
            throw new Error(v);
          }
          res(v);
        }
      );
    });
  }

  public async GetAssessment(
    assessmentID: string
  ): Promise<Assessment | false> {
    const getAssessmentEvent: ServerSocketEvent = "getAssessment";
    return await new Promise((res) => {
      this.socket.emit(
        getAssessmentEvent,
        assessmentID,
        (v: Object | boolean) => {
          if (typeof v == "boolean") {
            res(false);
            return;
          }
          if (!isAssessment(v)) {
            throw new Error("Assessment is malformed");
          }
          res(v);
        }
      );
    });
  }

  public async GetUser(userID: string): Promise<UserObj | false> {
    const getUserEvent: ServerSocketEvent = "getUser";
    return await new Promise((res) => {
      this.socket.emit(getUserEvent, userID, (v: Object | boolean) => {
        if (typeof v == "boolean") {
          res(false);
          return;
        }

        try {
          if (!isValidUserObj(v)) {
            throw new Error("");
          }
        } catch {
          res(false);
          return;
        }

        if (OBSCURE_MODE) {
          v.fName = "Obscured";
          v.mName = "";
          v.lName = "";
          v.username = "obscured";
          v.displayPictureURL = "";
        }

        res(v);
      });
    });
  }

  public GetAllMentors(): Promise<UserObj[] | false> {
    return new Promise((res) => {
      const getAllMentorsAction: ServerSocketEvent = "getAllMentors";
      this.socket.emit(getAllMentorsAction, (v: unknown) => {
        if (typeof v == "boolean") {
          res(false);
          return;
        }

        const validMentors: UserObj[] = [];
        if (!(v instanceof Array)) {
          throw new Error("There was a problem while fetching mentors");
        }
        for (let mentor of v) {
          try {
            if (!isValidUserObj(mentor)) {
              throw new Error();
            }
          } catch {
            // skips current mentor if their user data is malformed
            continue;
          }

          if (OBSCURE_MODE) {
            mentor.fName = "Obscured";
            mentor.mName = "";
            mentor.lName = "";
            mentor.username = "obscured";
            mentor.displayPictureURL = "";
          }
          validMentors.push(mentor);
        }
        res(validMentors);
      });
    });
  }

  public GetGoal(goalID: string): Promise<false | GoalObj> {
    const getGoalAction: ServerSocketEvent = "getGoal";
    return new Promise((res) => {
      if (!goalID) {
        res(false);
        return;
      }

      this.socket.emit(getGoalAction, goalID, (v: false | GoalObj) => {
        if (!v) {
          throw new Error("Could not retrieve goal");
        }
        if (!isValidGoal(v)) {
          throw new Error("Goal is malformed");
        }
        res(v);
      });
    });
  }

  /**
   * This is an internal function only, as the function `LoadChatMessages` will make use of `_GetMessages`.
   *
   * See `LoadChatMessages` for more.
   * @param messageIDs
   * @returns `messageObj[]`
   */
  private _GetMessages(messageIDs: string[]): Promise<MessageObj[]> {
    if (!messageIDs || !(messageIDs instanceof Array)) {
      throw new Error("ist of messageIDs was not received");
    }
    const getMessagesEvent: ServerSocketEvent = "getMessages";
    return new Promise((res) => {
      this.socket.emit(getMessagesEvent, messageIDs, (v: unknown) => {
        if (!v || !(v instanceof Array)) {
          throw new Error("Failed to retrieve messages");
        }

        // only valid messages make it into the message obj
        const validMessages: MessageObj[] = [];
        for (const messageObj of v) {
          try {
            if (!isValidMessageObj(v)) {
              continue;
            }
            validMessages.push(messageObj);
          } catch {
            continue;
          }
        }
        res(v);
      });
    });
  }

  /**
   * Loads the messages of a given chat if those messages are missing.
   *
   * It will take the list of messageIDs in a given chat, and check which ones are NOT in `this.chats`.
   *
   * It will then use `_GetMessage` to fetch those missing messages.
   *
   * @param chatID
   * @returns
   */
  public async LoadChatMessages(chatID: string) {
    if (!chatID || typeof chatID != "string") {
      throw new Error("Invalid chatID given");
    }

    const chatObj = this.chats.get(chatID);

    console.log('chatMap', this.chats);
    if (!chatObj) {
      throw new Error(
        "You do not have access to this chat, or chat does not exist."
      );
    }

    // only fetches messages that are missing.
    const fetchMessageIDs: string[] = [];
    for (const messageID of chatObj.messages) {
      if (this.chats.has(messageID)) {
        continue;
      }
      fetchMessageIDs.push(messageID);
    }

    if (fetchMessageIDs.length != 0) {
      const messageObjs = await this._GetMessages(fetchMessageIDs);
      let updated = false;
      for (const messageObj of messageObjs) {
        if (!messageObj.id) {
          continue;
        }
        this.messages.set(messageObj.id, messageObj);
        updated = true;
      }
      if (!updated) {
        return true;
      }
      // TODO: this is a bit hacky
      this._setMessages(this.messages);
    }

    return true;
  }

  public GetChats(chatIDs: string[]): Promise<ChatObj[]> {
    if (!chatIDs || !(chatIDs instanceof Array)) {
      throw new Error("Cannot get chats, ChatIDs is missing");
    }
    const getChatAction: ServerSocketEvent = "getChats";
    return new Promise((res) => {
      this.socket.emit(getChatAction, chatIDs, (v: unknown) => {
        if (!v || !(v instanceof Array)) {
          throw new Error("Failed to fetch chats");
        }

        const validChats: ChatObj[] = [];
        for (const chatObj of v) {
          try {
            if (!isValidChatObj(chatObj)) {
              // none should ever fail this check, as backend checks data before sending.
              continue;
            }
            this._setChatID(chatObj.id, chatObj);
            validChats.push(chatObj);
          } catch {
            continue;
          }
        }
        res(validChats);
      });
    });
  }

  public GetMentorshipRequest(
    mentorshipRequestID: string
  ): Promise<false | MentorshipRequestObj> {
    if (!mentorshipRequestID || typeof mentorshipRequestID != "string") {
      throw new Error("Requested mentorship request ID is invalid");
    }

    const getMentorshipRequestEvent: ServerSocketEvent = "getMentorshipRequest";
    return new Promise((res) => {
      this.socket.emit(
        getMentorshipRequestEvent,
        mentorshipRequestID,
        (v: MentorshipRequestObj | false) => {
          if (v === false) {
            throw new Error("Mentorship request does not exist");
          }
          res(v);
        }
      );
    });
  }

  public async requestUpdateSelf() {
    if (!this.user.id) {
      return;
    }
    const res = await this.GetUser(this.user.id);
    if (!res) {
      throw new Error("Error while fetching your user data");
    }
    this._setUser(res);
  }

  public disconnect() {
    this.socket.disconnect();
    const disconnectState: ClientSocketState = "disconnected";
    this._invokeHandler("state", disconnectState);
  }

  private _handleDisconnect() {
    const disconnectState: ClientSocketState = "disconnected";
    this._invokeHandler("state", disconnectState);
  }

  /**
   * Get the underlying socket instance
   *
   * Mainly used by testing code to attach event listeners
   *
   * @returns The Socket.IO client socket instance
   */
  public getSocket() {
    return this.socket;
  }

  private _setUser(user: UserObj) {
    this.user = user;
    this.postProcessInstanceVariableUpdate("user");
  }

  private _setState(state: ClientSocketState) {
    this.state = state;
    this.postProcessInstanceVariableUpdate("state");
  }

  private _setAvailableAssessmentQuestions(questions: AssessmentQuestion[]) {
    this.availableAssessmentQuestions = questions;
    this.postProcessInstanceVariableUpdate("availableAssessmentQuestions");
  }

  private _setChatID(chatID: string, chatObj: ChatObj) {
    this.chats.set(chatID, chatObj);
    this.postProcessInstanceVariableUpdate("chats");
  }

  private _setMessages(messages: Map<string, MessageObj | false>) {
    this.messages = messages;
    this.postProcessInstanceVariableUpdate("messages");
  }
}
