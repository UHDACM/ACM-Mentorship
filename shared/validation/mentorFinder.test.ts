import { describe, it, expect } from "vitest";
import { isMentorMatch, isMentorMatchResult } from "./mentorFinder";

describe("isMentorMatch", () => {
  it("should return true for a valid match", () => {
    expect(isMentorMatch({ userID: "user123", reason: "knows backend", score: 90 })).toBe(true);
  });

  it("should allow an empty reason", () => {
    expect(isMentorMatch({ userID: "user123", reason: "", score: 0 })).toBe(true);
  });

  it("should return false when userID is missing or empty", () => {
    expect(isMentorMatch({ reason: "knows backend", score: 90 })).toBe(false);
    expect(isMentorMatch({ userID: "", reason: "knows backend", score: 90 })).toBe(false);
  });

  it("should return false when score is not a usable number", () => {
    // the ai sometimes sends the score as a string, Number() turns junk into NaN
    expect(isMentorMatch({ userID: "user123", reason: "r", score: "90" })).toBe(false);
    expect(isMentorMatch({ userID: "user123", reason: "r", score: NaN })).toBe(false);
  });

  it("should return false for non objects", () => {
    expect(isMentorMatch(null)).toBe(false);
    expect(isMentorMatch(undefined)).toBe(false);
    expect(isMentorMatch("user123")).toBe(false);
  });
});

describe("isMentorMatchResult", () => {
  const mentor = {
    id: "mentor1",
    fName: "Jane",
    lName: "Doe",
    username: "janedoe",
    bio: "Backend dev",
  };

  it("should return true for a valid result", () => {
    expect(isMentorMatchResult({ mentor, reason: "knows backend", score: 90 })).toBe(true);
  });

  it("should return false when the mentor is not a valid user", () => {
    expect(isMentorMatchResult({ mentor: { fName: 5 }, reason: "r", score: 90 })).toBe(false);
    expect(isMentorMatchResult({ reason: "r", score: 90 })).toBe(false);
  });

  it("should return false when reason or score are the wrong type", () => {
    expect(isMentorMatchResult({ mentor, reason: 5, score: 90 })).toBe(false);
    expect(isMentorMatchResult({ mentor, reason: "r", score: "90" })).toBe(false);
  });
});
