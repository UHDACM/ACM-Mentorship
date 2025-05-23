import { describe, it, expect } from "vitest";
import { generateValidName, generateValidUniqueUsername } from "./testHelperFunctions";
import { MAX_NAME_LENGTH, MIN_USERNAME_LENGTH, MAX_USERNAME_LENGTH, isValidUsername } from "./validation";

describe("Test Helper Functions", () => {
  describe("generateValidName", () => {
    it("should generate a name with length between 1 and MAX_NAME_LENGTH", () => {
      for (let i = 0; i < 100; i++) {
        const name = generateValidName();
        expect(name.length).toBeGreaterThanOrEqual(1);
        expect(name.length).toBeLessThanOrEqual(MAX_NAME_LENGTH);
      }
    });

    it("should generate a name containing only valid characters", () => {
      const validChars = /^[a-zA-Z]+$/;
      for (let i = 0; i < 100; i++) {
        const name = generateValidName();
        expect(validChars.test(name)).toBe(true);
      }
    });
  });

  describe("generateValidUniqueUsername", () => {
    it("should generate a username with length between MIN_USERNAME_LENGTH and MAX_USERNAME_LENGTH", async () => {
      for (let i = 0; i < 100; i++) {
        const username = await generateValidUniqueUsername();
        expect(username.length).toBeGreaterThanOrEqual(MIN_USERNAME_LENGTH);
        expect(username.length).toBeLessThanOrEqual(MAX_USERNAME_LENGTH);
      }
    });

    it("should generate a username containing only valid characters", async () => {
      const validUsernameChars = /^[a-z0-9_.-]+$/;
      for (let i = 0; i < 100; i++) {
        const username = await generateValidUniqueUsername();
        expect(validUsernameChars.test(username)).toBe(true);
      }
    });


    it("should generate a username that is unused in the database", async () => {
      // tests 5 times to ensure uniqueness (will never fail, as generateValidUniqueUsername checks db each time)
      for (let i = 0; i < 5; i++) {
        const username = await generateValidUniqueUsername(true);
        expect(await isValidUsername(username)).toBe(true);
      }
    });

    // it("should generate a lowercase username", async () => {
    //   for (let i = 0; i < 100; i++) {
    //     const username = await generateValidUniqueUsername();
    //     expect(username).toBe(username.toLowerCase());
    //   }
    // });
  });
});