
import {
  SocialType,
  SocialTypes,
  Month,
  Months,
  MentorshipRequestStatuses,
  MentorshipRequestStatus,
  MentorshipRequestObj,
  SubmitGoalAction,
  SubmitGoalActions,
} from "@shared/types/general";



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
  return MentorshipRequestStatuses.includes(s as MentorshipRequestStatus);
}

export function isSubmitGoalAction(s: unknown): s is SubmitGoalAction {
  if (!s || typeof s != "string") {
    return false;
  }
  return SubmitGoalActions.includes(s as SubmitGoalAction);
}
