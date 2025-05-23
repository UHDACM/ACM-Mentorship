import { ClientSocketPayloadSendMessageBase, ClientSocketPayloadSendMessageCreate, ClientSocketPayloadSendMessageSend } from "../types/clientSocketPayload";
import { SendMessageActions } from "../types/general";

// Validation function for ClientSocketPayloadSendMessageBase
export function isValidClientSocketPayloadSendMessageBase(
  payload: unknown
): payload is ClientSocketPayloadSendMessageBase {
  if (typeof payload !== "object" || payload === null) return false;

  const { action, contents } = payload as ClientSocketPayloadSendMessageBase;

  if (!action || typeof action !== "string" || !SendMessageActions.includes(action)) {
    return false;
  }

  if (!contents || typeof contents !== "string" || contents.trim().length < 1) {
    return false;
  }

  return true;
}

// Validation function for ClientSocketPayloadSendMessageCreate
export function isValidClientSocketPayloadSendMessageCreate(
  payload: unknown
): payload is ClientSocketPayloadSendMessageCreate {
  if (!isValidClientSocketPayloadSendMessageBase(payload)) return false;

  const { targetUserIDs } = payload as ClientSocketPayloadSendMessageCreate;

  if (!Array.isArray(targetUserIDs) || targetUserIDs.length === 0) {
    return false;
  }

  if (!targetUserIDs.every((id) => typeof id === "string" && id.trim().length > 0)) {
    return false;
  }

  return true;
}

// Validation function for ClientSocketPayloadSendMessageSend
export function isValidClientSocketPayloadSendMessageSend(
  payload: unknown
): payload is ClientSocketPayloadSendMessageSend {
  if (!isValidClientSocketPayloadSendMessageBase(payload)) return false;

  const { chatID } = payload as ClientSocketPayloadSendMessageSend;

  if (!chatID || typeof chatID !== "string" || chatID.trim().length < 1) {
    return false;
  }

  return true;
}



