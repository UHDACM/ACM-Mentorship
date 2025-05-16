import {
  ClientDataPayloadType,
  ClientDataPayloadTypes,
  ClientSocketState,
  ClientSocketStates,
  SubmitAssessmentAction,
  SubmitAssessmentActions,
} from "../features/ClientSocket/ClientSocket";

import {
  ObjectAny,
  AssessmentQuestion,
  Assessment,
  SocialType,
  SocialTypes,
  AssessmentQuestionInputTypes,
  Month,
  Months,
  MentorshipRequestStatuses,
  MentorshipRequestStatus,
  MentorshipRequestObj,
  MentorshipRequestResponseAction,
  MentorshipRequestResponseActions,
  SubmitGoalAction,
  SubmitGoalActions,
} from "@shared/types/general";

export function isClientSocketState(s: string): s is ClientSocketState {
  return ClientSocketStates.includes(s);
}

export function isClientDataPayloadType(s: string): s is ClientDataPayloadType {
  return ClientDataPayloadTypes.includes(s);
}

export function isAssessmentQuestion(q: object): q is AssessmentQuestion {
  if (!q || typeof q != "object") {
    return false;
  }
  const qAny = q as ObjectAny;
  const { question, inputType } = qAny;
  if (!question || typeof question != "string") {
    return false;
  } else if (!inputType || !AssessmentQuestionInputTypes.includes(inputType)) {
    return false;
  }
  return true;
}

export function isAssessmentQuestions(
  qArr: object[]
): qArr is AssessmentQuestion[] {
  if (!qArr || !(qArr instanceof Array)) {
    return false;
  }
  for (let q of qArr) {
    if (!q || typeof q != "object") {
      return false;
    }
    const qAny = q as ObjectAny;
    const { question, inputType } = qAny;
    if (!question || typeof question != "string") {
      return false;
    } else if (
      !inputType ||
      !AssessmentQuestionInputTypes.includes(inputType)
    ) {
      return false;
    }
  }
  return true;
}

export function isSubmitAssessmentAction(
  s: string
): s is SubmitAssessmentAction {
  return SubmitAssessmentActions.includes(s);
}

export function isAssessment(s: object): s is Assessment {
  if (!s || typeof s != "object") {
    return false;
  }
  const sConv: ObjectAny = s;
  const { date, published, questions, userID } = sConv;
  if (!date || typeof date != "number") {
    return false;
  } else if (typeof published != "boolean") {
    return false;
  } else if (!userID || typeof userID != "string") {
    return false;
  } else if (
    !questions ||
    !(questions instanceof Array) ||
    !isAssessmentQuestions(questions)
  ) {
    return false;
  }
  return true;
}

export function isSocialType(s: unknown): s is SocialType {
  return SocialTypes.includes(s as SocialType);
}

export function isMonth(s: string): s is Month {
  return Months.includes(s);
}

export function isMentorshipRequestObject(
  s: unknown
): s is MentorshipRequestObj {
  if (!s || typeof s != "object") {
    return false;
  }

  const mentorshipRequest = s as MentorshipRequestObj; // Type assertion after checks

  const { mentorID, menteeID, status, id } = mentorshipRequest; // Destructure here

  if (!id || typeof id !== "string") {
    return false;
  }

  if (!mentorID || typeof mentorID !== "string") {
    return false;
  }

  if (!menteeID || typeof menteeID !== "string") {
    return false;
  }

  if (status && !isMentorshipRequestStatus(status)) {
    return false;
  }

  return true;
}

export function isMentorshipRequestStatus(
  s: unknown
): s is MentorshipRequestStatus {
  if (!s || typeof s != "string") {
    return false;
  }
  return MentorshipRequestStatuses.includes(s);
}

export function isMentorshipRequestResponseAction(
  s: unknown
): s is MentorshipRequestResponseAction {
  if (!s || typeof s != "string") {
    return false;
  }
  return MentorshipRequestResponseActions.includes(s);
}

export function isSubmitGoalAction(s: unknown): s is SubmitGoalAction {
  if (!s || typeof s != "string") {
    return false;
  }
  return SubmitGoalActions.includes(s);
}
