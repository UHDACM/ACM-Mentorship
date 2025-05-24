// contains all possible payload data types that the client can send to the server

import { AssessmentQuestion, GoalObj, SendMessageAction, SubmitGoalAction } from "./general";
import { MentorshipRequestAction, SubmitAssessmentAction } from "./socket";

export interface SocketPayloadMentorshipBase {
  action: MentorshipRequestAction;
}

/* Sending a mentorship request requires the following payload */
export interface SocketPayloadMentorshipSend
  extends SocketPayloadMentorshipBase {
  action: "send";
  mentorID: string;
}

/* Sending a mentorship request requires the following payload */
export interface SocketPayloadMentorshipAccept
  extends SocketPayloadMentorshipBase {
  action: "accept";
  mentorshipRequestID: string;
}

/* Sending a mentorship request requires the following payload */
export interface SocketPayloadMentorshipDecline
  extends SocketPayloadMentorshipBase {
  action: "decline";
  mentorshipRequestID: string;
}

/* Sending a mentorship request requires the following payload */
export interface SocketPayloadMentorshipCancel
  extends SocketPayloadMentorshipBase {
  action: "cancel";
  mentorshipRequestID: string;
}

export interface SocketPayloadMentorshipRemoveMentor
  extends SocketPayloadMentorshipBase {
  action: "removeMentor";
  mentorID: string;
}

export interface SocketPayloadMentorshipRemoveMentee
  extends SocketPayloadMentorshipBase {
  action: "removeMentee";
  menteeID: string;
}

export interface SocketPayloadCreateUser {
  fName: string;
  mName?: string;
  lName: string;
  username: string;
}

export type ClientCreateUserPayload = {
  fName: string;
  mName?: string;
  lName: string;
  username: string;
};

// TODO: Break into subparts too (like SocketMentorshipBase)
export type SubmitAssessmentPayload = {
  action?: SubmitAssessmentAction;
  questions?: AssessmentQuestion[];
  id?: string;
  published?: boolean;
};

export type SubmitGoalPayload = {
  action?: SubmitGoalAction;
  goal?: GoalObj;
  id?: string;
};


export interface ClientSocketPayloadSendMessageBase {
  action: SendMessageAction;
  contents: string;
};

export interface ClientSocketPayloadSendMessageCreate extends ClientSocketPayloadSendMessageBase {
  action: 'create';
  targetUserIDs: string[];
};

export interface ClientSocketPayloadSendMessageSend extends ClientSocketPayloadSendMessageBase {
  action: 'send';
  chatID: string;
};
