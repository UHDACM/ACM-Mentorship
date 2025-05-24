import { isValidAssessmentQuestion, isValidMentorshipRequestObj, isValidMessageObj } from "./general";
import {
  ServerSocketPayloadDataMentorshipRequest,
  ServerSocketPayloadDataUpdateSelf,
  ServerSocketPayloadDataChat,
  ServerSocketPayloadDataBase,
  ServerSocketDataPayloadType,
  ServerSocketDataPayloadTypes,
  ServerSocketPayloadDataInitialData,
  ServerSocketPayloadMessage,
} from "@shared/types/serverSocketPayload";
import { isValidUserObj } from "./user";


export function isValidServerSocketPayloadDataBase(input: unknown): input is ServerSocketPayloadDataBase {
  if (typeof input !== 'object' || input === null) return false;

  const { type } = input as Record<string, unknown>;

  if (typeof type !== 'string' || !isServerSocketDataPayloadType(type)) return false;
  // data can be any value (unknown), so no further validation needed
  return true;
}

export function isValidServerSocketPayloadDataMentorshipRequest(
  input: unknown
): input is ServerSocketPayloadDataMentorshipRequest {
  if (typeof input !== "object" || input === null) return false;

  const { type, data } = input as Record<string, unknown>;

  if (type !== "mentorshipRequest") return false;
  if (!isValidMentorshipRequestObj(data)) return false;

  return true;
}

export function isValidServerSocketPayloadDataUpdateSelf(
  input: unknown
): input is ServerSocketPayloadDataUpdateSelf {
  if (typeof input !== "object" || input === null) return false;

  const { type, data } = input as Record<string, unknown>;

  if (type !== "updateSelf") return false;
  if (data !== undefined) return false;

  return true;
}

export function isValidServerSocketPayloadDataChat(
  input: unknown
): input is ServerSocketPayloadDataChat {
  if (typeof input !== "object" || input === null) return false;

  const { type, data } = input as Record<string, unknown>;

  if (type !== "chat") return false;
  if (!isValidMessageObj(data)) return false;

  return true;
}

export function isServerSocketDataPayloadType(s: string): s is ServerSocketDataPayloadType {
  if (!s || typeof s != "string") {
    return false;
  }
  return ServerSocketDataPayloadTypes.includes(s as ServerSocketDataPayloadType);
}




export function isServerSocketPayloadDataInitialData(s: unknown): s is ServerSocketPayloadDataInitialData {
  if (typeof s !== "object" || s === null) return false;

  const { type, data } = s as ServerSocketPayloadDataInitialData;
  if (type !== "initialData") return false;
  if (typeof data !== "object" || data === null) return false;

  const { user, availableAssessmentQuestions } = data as Record<string, unknown>;
  if (!isValidUserObj(user)) return false;
  if (!Array.isArray(availableAssessmentQuestions)) return false;
  for (const question of availableAssessmentQuestions) {
    if (!isValidAssessmentQuestion(question)) return false;
  }

  return true;
}

export function isServerSocketPayloadMessage(input: unknown): input is ServerSocketPayloadMessage {
  if (typeof input !== "object" || input === null) return false;

  const { title, body } = input as Record<string, unknown>;

  if (typeof title !== "string") return false;
  if (typeof body !== "string") return false;

  return true;
}
