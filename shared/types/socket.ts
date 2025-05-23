export const MentorshipRequestActions = [
  "send",
  "accept",
  "decline",
  "cancel",
  "removeMentor",
  "removeMentee",
] as const;
export type MentorshipRequestAction = (typeof MentorshipRequestActions)[number];


export const MentorshipRequestResponseActions = [
  "accept",
  "decline",
  "cancel"
] as const satisfies readonly MentorshipRequestAction[];
export type MentorshipRequestResponseAction =
  (typeof MentorshipRequestResponseActions)[number];
  

export const ClientSocketStates = [
  "connecting",
  "authed_nouser",
  "authed_user",
  "disconnected",
  "connect_error"
] as const;

export type ClientSocketState = (typeof ClientSocketStates)[number];

// all possible events that the client socket expects from the server
export const ClientSocketEvents = [
  "connect",
  "connect_error",
  "disconnect",
  "state",
  "message",
  "data",
] as const;
export type ClientSocketEvent = (typeof ClientSocketEvents)[number];

// all possible events that the server can receive from the client
// TODO: add all possible events
export const ServerSocketEvents = [
  "data",
  "mentorshipRequest",
  "message",
  "createUser",
  "updateProfile",
  "submitAssessment",
  "submitGoal",
  "getUser",
  "getAssessment",
  "getAllMentors",
  "getChats",
  "getGoal",
  "getMentorshipRequest",
  "getMessages",
  "getMentorshipRequestBetweenUsers",
  "sendMessage"
] as const;
export type ServerSocketEvent = (typeof ServerSocketEvents)[number];

export type ClientSocketMentorshipRequest = {
  mentorID: string;
  menteeID: string;
};

export type ClientSocketMentorshipRequestMap = {
  [key: string]: ClientSocketMentorshipRequest;
};

// A function that can be run after a ClientSocket event is handled. Client socket receives a function of this type as an optional param in its constructor.
export type ClientSocketPostProcessingFunction = (
  event: ClientSocketEvent,
  payload?: unknown
) => void;

export const SubmitAssessmentActions = [
  "create",
  "publish",
  "unpublish",
  "delete",
  "edit",
] as const;
export type SubmitAssessmentAction = (typeof SubmitAssessmentActions)[number];

export const ClientSocketInstanceVariables = [
  "user",
  "state",
  "availableAssessmentQuestions",
  "chats",
  "messages"
] as const;
export type ClientSocketInstanceVariable = (typeof ClientSocketInstanceVariables)[number];

export type ClientSocketPostInstanceVariableUpdateFunction = (
  variable: ClientSocketInstanceVariable
) => void;
