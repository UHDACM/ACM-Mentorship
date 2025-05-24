import { describe, expect, test } from "vitest";
import {
  isSocketPayloadMentorshipRequestSend,
  isSocketPayloadMentorshipRequestAccept,
  isSocketPayloadMentorshipRequestDecline,
  isSocketPayloadMentorshipRequestCancel,
  isSocketPayloadMentorshipRequestRemoveMentor,
  isSocketPayloadMentorshipRequestRemoveMentee,
  isSocketPayloadCreateUser,
} from "./socket";

describe("Validation Functions", () => {
  test("isSocketPayloadMentorshipRequestSend", () => {
    expect(
      isSocketPayloadMentorshipRequestSend({ action: "send", mentorID: "123" })
    ).toBe(true);
    expect(
      isSocketPayloadMentorshipRequestSend({ action: "send", mentorID: 123 })
    ).toBe(false);
    expect(
      isSocketPayloadMentorshipRequestSend({ action: "accept", mentorID: "123" })
    ).toBe(false);
  });

  test("isSocketPayloadMentorshipRequestAccept", () => {
    expect(
      isSocketPayloadMentorshipRequestAccept({
        action: "accept",
        mentorshipRequestID: "456",
      })
    ).toBe(true);
    expect(
      isSocketPayloadMentorshipRequestAccept({
        action: "accept",
        mentorshipRequestID: 456,
      })
    ).toBe(false);
    expect(
      isSocketPayloadMentorshipRequestAccept({
        action: "send",
        mentorshipRequestID: "456",
      })
    ).toBe(false);
  });

  test("isSocketPayloadMentorshipRequestDecline", () => {
    expect(
      isSocketPayloadMentorshipRequestDecline({
        action: "decline",
        mentorshipRequestID: "789",
      })
    ).toBe(true);
    expect(
      isSocketPayloadMentorshipRequestDecline({
        action: "decline",
        mentorshipRequestID: 789,
      })
    ).toBe(false);
    expect(
      isSocketPayloadMentorshipRequestDecline({
        action: "send",
        mentorshipRequestID: "789",
      })
    ).toBe(false);
  });

  test("isSocketPayloadMentorshipRequestCancel", () => {
    expect(
      isSocketPayloadMentorshipRequestCancel({
        action: "cancel",
        mentorshipRequestID: "101",
      })
    ).toBe(true);
    expect(
      isSocketPayloadMentorshipRequestCancel({
        action: "cancel",
        mentorshipRequestID: 101,
      })
    ).toBe(false);
    expect(
      isSocketPayloadMentorshipRequestCancel({
        action: "send",
        mentorshipRequestID: "101",
      })
    ).toBe(false);
  });

  test("isSocketPayloadMentorshipRequestRemoveMentor", () => {
    expect(
      isSocketPayloadMentorshipRequestRemoveMentor({
        action: "removeMentor",
        mentorID: "202",
      })
    ).toBe(true);
    expect(
      isSocketPayloadMentorshipRequestRemoveMentor({
        action: "removeMentor",
        mentorID: 202,
      })
    ).toBe(false);
    expect(
      isSocketPayloadMentorshipRequestRemoveMentor({
        action: "send",
        mentorID: "202",
      })
    ).toBe(false);
  });

  test("isSocketPayloadMentorshipRequestRemoveMentee", () => {
    expect(
      isSocketPayloadMentorshipRequestRemoveMentee({
        action: "removeMentee",
        menteeID: "303",
      })
    ).toBe(true);
    expect(
      isSocketPayloadMentorshipRequestRemoveMentee({
        action: "removeMentee",
        menteeID: 303,
      })
    ).toBe(false);
    expect(
      isSocketPayloadMentorshipRequestRemoveMentee({
        action: "send",
        menteeID: "303",
      })
    ).toBe(false);
  });

  test("isSocketPayloadCreateUser", () => {
    // Valid payloads
    expect(
      isSocketPayloadCreateUser({
        fName: "John",
        lName: "Doe",
        username: "johndoe",
      })
    ).toBe(true);

    expect(
      isSocketPayloadCreateUser({
        fName: "Jane",
        mName: "A.",
        lName: "Smith",
        username: "janesmith",
      })
    ).toBe(true);

    // Invalid payloads
    expect(
      isSocketPayloadCreateUser({
        fName: "John",
        lName: "Doe",
        username: 123,
      })
    ).toBe(false);

    expect(
      isSocketPayloadCreateUser({
        fName: "John",
        mName: 42,
        lName: "Doe",
        username: "johndoe",
      })
    ).toBe(false);

    expect(
      isSocketPayloadCreateUser({
        fName: 123,
        lName: "Doe",
        username: "johndoe",
      })
    ).toBe(false);

    expect(
      isSocketPayloadCreateUser({
        lName: "Doe",
        username: "johndoe",
      })
    ).toBe(false);

    expect(
      isSocketPayloadCreateUser({
        fName: "John",
        username: "johndoe",
      })
    ).toBe(false);

    expect(
      isSocketPayloadCreateUser({
        fName: "John",
        lName: "Doe",
      })
    ).toBe(false);
  });
});


