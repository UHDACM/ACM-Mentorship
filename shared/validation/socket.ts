import {
  ClientSocketState,
  ClientSocketStates,
  MentorshipRequestResponseAction,
  MentorshipRequestResponseActions,
  SubmitAssessmentAction,
  SubmitAssessmentActions,
} from "../types/socket";

import {
  SocketPayloadMentorshipSend,
  SocketPayloadMentorshipAccept,
  SocketPayloadMentorshipDecline,
  SocketPayloadMentorshipCancel,
  SocketPayloadMentorshipRemoveMentor,
  SocketPayloadMentorshipRemoveMentee,
  SocketPayloadCreateUser,
} from "@shared/types/clientSocketPayload";

export function isSocketPayloadMentorshipRequestSend(
  payload: any
): payload is SocketPayloadMentorshipSend {
  if (payload.action === "send" && typeof payload.mentorID === "string") {
    return true;
  }
  return false;
}

export function isSocketPayloadMentorshipRequestAccept(
  payload: any
): payload is SocketPayloadMentorshipAccept {
  if (
    payload.action === "accept" &&
    typeof payload.mentorshipRequestID === "string"
  ) {
    return true;
  }
  return false;
}

export function isSocketPayloadMentorshipRequestDecline(
  payload: any
): payload is SocketPayloadMentorshipDecline {
  if (
    payload.action === "decline" &&
    typeof payload.mentorshipRequestID === "string"
  ) {
    return true;
  }
  return false;
}

export function isSocketPayloadMentorshipRequestCancel(
  payload: any
): payload is SocketPayloadMentorshipCancel {
  if (
    payload.action === "cancel" &&
    typeof payload.mentorshipRequestID === "string"
  ) {
    return true;
  }
  return false;
}

export function isSocketPayloadMentorshipRequestRemoveMentor(
  payload: any
): payload is SocketPayloadMentorshipRemoveMentor {
  if (
    payload.action === "removeMentor" &&
    typeof payload.mentorID === "string"
  ) {
    return true;
  }
  return false;
}

export function isSocketPayloadMentorshipRequestRemoveMentee(
  payload: any
): payload is SocketPayloadMentorshipRemoveMentee {
  if (
    payload.action === "removeMentee" &&
    typeof payload.menteeID === "string"
  ) {
    return true;
  }
  return false;
}

export function isSocketPayloadCreateUser(
  payload: unknown
): payload is SocketPayloadCreateUser {
  if (typeof payload !== "object" || payload === null) {
    return false;
  }

  const { fName, mName, lName, username } = payload as SocketPayloadCreateUser;
  if (
    typeof fName !== "string" ||
    (typeof mName !== "undefined" && typeof mName !== "string") ||
    typeof lName !== "string" ||
    typeof username !== "string"
  ) {
    return false;
  }
  return true;
}

export function isClientSocketState(s: unknown): s is ClientSocketState {
  if (!s || typeof s != "string") {
    return false;
  }
  return ClientSocketStates.includes(s as ClientSocketState);
}

export function isSubmitAssessmentAction(
  s: unknown
): s is SubmitAssessmentAction {
  if (!s || typeof s != "string") {
    return false;
  }
  return SubmitAssessmentActions.includes(s as SubmitAssessmentAction);
}


export function isMentorshipRequestResponseAction(
  s: unknown
): s is MentorshipRequestResponseAction {
  if (!s || typeof s != "string") {
    return false;
  }
  return MentorshipRequestResponseActions.includes(s as MentorshipRequestResponseAction);
}
