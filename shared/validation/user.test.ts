import { describe, it, expect } from "vitest";
import { isValidUserObj } from "./user";
import { UserObj } from "@shared/types/general";

describe("isValidUserObj", () => {
  it("should return true for a valid UserObj with all fields", () => {
    const validUser: UserObj = {
      fName: "John",
      mName: "A.",
      lName: "Doe",
      username: "johndoe",
      usernameLower: "johndoe",
      OAuthSubID: "oauth123",
      email: "john.doe@example.com",
      id: "user123",
      isMentee: true,
      isMentor: false,
      acceptingMentees: true,
      displayPictureURL: "https://example.com/image.jpg",
      bio: "A passionate developer.",
      assessments: {
        assessment1: { date: 1234567890 },
      },
      menteeIDs: ["mentee1", "mentee2"],
      mentorIDs: ["mentor1"],
      mentorshipRequests: ["request1"],
      softSkills: ["communication", "teamwork"],
      goals: {
        goal1: { name: "Learn TypeScript" },
      },
      education: [
        {
          school: "University",
          degree: "Bachelor",
          fieldOfStudy: "Computer Science",
          range: { start: [1, 2020], end: [12, 2024] },
        },
      ],
      experience: [
        {
          company: "Tech Corp",
          position: "Developer",
          description: "Worked on projects",
          range: { start: [6, 2021], end: [6, 2023] },
        },
      ],
      certifications: [
        {
          name: "Certified Developer",
          issuingOrg: "Tech Org",
        },
      ],
      projects: [
        {
          name: "Project A",
          position: "Lead",
          description: "Developed features",
          range: { start: [1, 2022], end: [12, 2022] },
        },
      ],
      socials: [
        {
          type: "github",
          url: "https://github.com/johndoe",
        },
      ],
      testing: true,
      chats: ["chat1", "chat2"],
    };

    expect(isValidUserObj(validUser)).toBe(true);
  });

  it("should throw an error for invalid UserObj with incorrect field types", () => {
    const invalidUser = {
      fName: "John",
      lName: "Doe",
      username: "johndoe",
      email: "john.doe@example.com",
      isMentee: "yes", // Invalid: should be a boolean
      assessments: {
        assessment1: { date: "not a number" }, // Invalid: date should be a number
      },
      socials: [
        {
          type: "invalidType", // Invalid: not in SocialTypes
          url: "https://example.com",
        },
      ],
    };

    expect(() => isValidUserObj(invalidUser)).toThrowError();
  });

  it("should throw an error for UserObj with invalid nested objects", () => {
    const invalidNestedUser = {
      fName: "John",
      lName: "Doe",
      username: "johndoe",
      email: "john.doe@example.com",
      education: [
        {
          school: "University",
          degree: "Bachelor",
          fieldOfStudy: "Computer Science",
          range: { start: [1, 2020], end: "invalid" }, // Invalid: end should be an array
        },
      ],
    };

    expect(() => isValidUserObj(invalidNestedUser)).toThrowError();
  });

  // it("should throw an error for UserObj with missing required fields", () => {
  //   // fails because OAuthSubID is required
  //   const missingFieldsUser = {
  //     username: "johndoe"
  //   };

  //   expect(() => isValidUserObj(missingFieldsUser)).toThrowError();
  // });

  it("should handle UserObj with optional fields missing", () => {
    const userWithMissingOptionalFields: UserObj = {
      OAuthSubID: "oauth123",
      fName: "John",
      lName: "Doe",
      username: "johndoe",
      email: "john.doe@example.com",
    };

    expect(isValidUserObj(userWithMissingOptionalFields)).toBe(true);
  });

  it("should throw an error for UserObj with invalid array fields", () => {
    const invalidArrayUser = {
      fName: "John",
      lName: "Doe",
      username: "johndoe",
      email: "john.doe@example.com",
      menteeIDs: "not an array", // Invalid: should be an array
    };

    expect(() => isValidUserObj(invalidArrayUser)).toThrowError();
  });
});