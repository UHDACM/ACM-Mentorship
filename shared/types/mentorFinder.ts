import { UserObj } from "./general";

// what the ai gives back for each mentor it picked
export interface MentorMatch {
  userID: string;
  reason: string;
  score: number; // 0 - 100
}

// what the client actually gets, match info + the mentor itself
export interface MentorMatchResult {
  mentor: UserObj;
  reason: string;
  score: number;
}
