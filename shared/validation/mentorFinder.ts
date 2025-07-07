import { MentorMatch, MentorMatchResult } from "@shared/types/mentorFinder";
import { validateUserObj } from "./user";

export function isMentorMatch(obj: unknown): obj is MentorMatch {
  if (obj === null || typeof obj !== 'object') {
    return false;
  }

  const { userID, reason, score } = obj as MentorMatch;

  if (typeof userID !== 'string' || !userID) {
    return false;
  }

  if (typeof reason !== 'string') {
    return false;
  }

  if (typeof score !== 'number' || isNaN(score)) {
    return false;
  }

  return true;
}

export function isMentorMatchResult(obj: unknown): obj is MentorMatchResult {
  if (obj === null || typeof obj !== 'object') {
    return false;
  }

  const { mentor, reason, score } = obj as MentorMatchResult;

  if (typeof reason !== 'string') {
    return false;
  }

  if (typeof score !== 'number' || isNaN(score)) {
    return false;
  }

  try {
    validateUserObj(mentor);
  } catch {
    return false;
  }

  return true;
}
