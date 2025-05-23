import { AssessmentQuestion, ChatObj, MentorshipRequestObj, UserObj } from "./general";

// all possible payload data types that the server can send to the client
export const ServerSocketDataPayloadTypes = [
  "initialData",
  "mentorshipRequest",
  "chat",
  "updateSelf",
] as const;

export type ServerSocketDataPayloadType = typeof ServerSocketDataPayloadTypes[number];

export interface ServerSocketPayloadDataBase {
  type: ServerSocketDataPayloadType;
  data: unknown;
};

export interface ServerSocketPayloadDataMentorshipRequest extends ServerSocketPayloadDataBase {
  type: "mentorshipRequest";
  data: MentorshipRequestObj; // further validation is done in the respective handlers
};

export interface ServerSocketPayloadDataUpdateSelf extends ServerSocketPayloadDataBase {
  type: "updateSelf";
  data: undefined; // no data is sent, just the type
};

export interface ServerSocketPayloadDataChat extends ServerSocketPayloadDataBase {
  type: "chat";
  data: ChatObj;
};

export interface ServerSocketPayloadDataInitialData extends ServerSocketPayloadDataBase {
  type: "initialData";
  data: {
    user: UserObj;
    availableAssessmentQuestions: AssessmentQuestion[];
  }; // no data is sent, just the type
};

export interface ServerSocketPayloadMessage {
  title: string;
  body: string;
};
