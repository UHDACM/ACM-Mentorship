import { expect, describe, it } from "vitest";
import {
  isValidAssessmentQuestion,
  isValidEducation,
  isValidExperience,
  isValidMonthInteger,
  isValidMonthYearRange,
  isValidNames,
  isValidProject,
  isValidUsername,
  MAX_NAME_LENGTH,
  MAX_USERNAME_LENGTH,
  MIN_USERNAME_LENGTH,
  AnsweredAssessmentQuestionObj,
  isValidAnsweredAssessmentQuestion,
  isValidAnsweredAssessmentQuestions,
  isValidMonthYearRange_YearToo,
  isValidGoal,
  isSubmitGoalAction,
  isTaskObj,
} from '../../src/scripts/validation'
import {
  ObjectAny,
  SocialTypes,
  SubmitGoalActions,
} from "@shared/types/general";

console.log(SocialTypes);

describe("Tests validation script", () => {
  describe("isValidNames", () => {
    it("should fail if no names are provided", () => {
      expect(() => isValidNames("", "", "")).toThrowError();
    });

    const NameTooLong = "n".repeat(MAX_NAME_LENGTH + 1);
    const NameJustRight = "n".repeat(MAX_NAME_LENGTH - 1);
    it("should fail if any names are too long", () => {
      expect(() =>
        isValidNames(NameTooLong, NameJustRight, NameJustRight)
      ).toThrowError();
      expect(() =>
        isValidNames(NameJustRight, NameTooLong, NameJustRight)
      ).toThrowError();
      expect(() =>
        isValidNames(NameJustRight, NameJustRight, NameTooLong)
      ).toThrowError();
    });

    it("should pass without middle name", () => {
      expect(() =>
        isValidNames(NameJustRight, undefined, NameJustRight)
      ).not.toThrowError();
    });
  });

  const usernameTooLong = "n".repeat(MAX_USERNAME_LENGTH + 1);
  const usernameTooShort = "n".repeat(MIN_USERNAME_LENGTH - 1);
  const usernameMIN = "n".repeat(MIN_USERNAME_LENGTH);
  const usernameMAX = "n".repeat(MAX_USERNAME_LENGTH);
  describe("isValidUsername", () => {
    it("should fail if too long or too short", async () => {
      await expect(isValidUsername(usernameTooLong)).rejects.toThrowError();
      await expect(isValidUsername(usernameTooShort)).rejects.toThrowError();
    });

    it("should fail if username contains spaces", async () => {
      await expect(isValidUsername("hee mee")).rejects.toThrowError();
    });

    const illegalChars = ["^", "%", "!", "(", ")", "&", "#"];
    it("should fail if username includes illegal characters", async () => {
      for (let illegalChar of illegalChars) {
        await expect(
          isValidUsername("hee" + illegalChar + "mee")
        ).rejects.toThrowError();
      }
    });

    const highlyUnlikelyUsername = "xQ7pL2mR9vZ4tY8wK1oN3cF5gH6jU";
    it("should pass if just right", async () => {
      // this setup alerts dev if username is in use, as that's the only way this test will fail.
      try {
        isValidUsername(
          highlyUnlikelyUsername.substring(0, MAX_USERNAME_LENGTH)
        );
      } catch {
        throw new Error(
          "Highly unlikely username (" + highlyUnlikelyUsername + ") is in use."
        );
      }
    });
  });

  describe("isValidMonthInteger", () => {
    it("should return true for valid month integers (1-12)", () => {
      expect(isValidMonthInteger(1)).toBe(true);
      expect(isValidMonthInteger(6)).toBe(true);
      expect(isValidMonthInteger(12)).toBe(true);
    });

    it("should return false for invalid month integers (<= 0 or >= 13)", () => {
      expect(isValidMonthInteger(0)).toBe(false);
      expect(isValidMonthInteger(13)).toBe(false);
      expect(isValidMonthInteger(-1)).toBe(false);
    });
  });

  describe("isValidMonthYearRange", () => {
    it("should return true for valid month-year ranges", () => {
      expect(
        isValidMonthYearRange({
          start: [1, 2020],
          end: [12, 2021],
        })
      ).toBe(true);
      expect(
        isValidMonthYearRange({
          start: [6, 1995],
        })
      ).toBe(true);
    });

    it("should return false for invalid month-year ranges", () => {
      // Invalid month
      expect(() =>
        isValidMonthYearRange({
          start: [0, 2020],
          end: [12, 2021],
        })
      ).toThrowError();
      expect(() =>
        isValidMonthYearRange({
          start: [13, isValidMonthYearRange_YearToo],
          end: [12, isValidMonthYearRange_YearToo + 1],
        })
      ).toThrowError();

      // Invalid year
      expect(() =>
        isValidMonthYearRange({
          start: [1, isValidMonthYearRange_YearToo - 1],
          end: [12, 2021],
        })
      ).toThrowError();
      expect(() =>
        isValidMonthYearRange({
          start: [1, 2020],
          end: [12, isValidMonthYearRange_YearToo - 1],
        })
      ).toThrowError();
    });
  });

  describe("isValidExperience", () => {
    it("should not throw an error for valid experience objects", () => {
      const validExperience = {
        company: "Tech Corp",
        position: "Software Engineer",
        description: "Worked on cool projects",
        range: {
          start: [1, 2020],
          end: [12, 2021],
        },
      };
      expect(() => isValidExperience(validExperience)).not.toThrowError();
    });

    it("should throw an error if company is missing or invalid", () => {
      const invalidExperience1 = {
        position: "Software Engineer",
        description: "Worked on cool projects",
        range: {
          start: [1, 2020],
          end: [12, 2021],
        },
      };
      const invalidExperience2 = {
        company: "",
        position: "Software Engineer",
        description: "Worked on cool projects",
        range: {
          start: [1, 2020],
          end: [12, 2021],
        },
      };
      expect(() => isValidExperience(invalidExperience1)).toThrowError();
      expect(() => isValidExperience(invalidExperience2)).toThrowError();
    });

    it("should throw an error if range is missing or invalid", () => {
      const invalidExperience1 = {
        company: "Tech Corp",
        position: "Software Engineer",
        description: "Worked on cool projects",
      };
      const invalidExperience2 = {
        company: "Tech Corp",
        position: "Software Engineer",
        description: "Worked on cool projects",
        range: {
          start: [0, 2020],
          end: [12, 2021],
        }, // Invalid month
      };
      expect(() => isValidExperience(invalidExperience1)).toThrowError();
      expect(() => isValidExperience(invalidExperience2)).toThrowError();
    });
  });

  describe("isValidEducation", () => {
    it("should not throw an error for valid education objects", () => {
      const validEducation = {
        school: "Harvard University",
        degree: "Bachelor of Science",
        fieldOfStudy: "Computer Science",
        range: {
          start: [8, 2015],
          end: [5, 2019],
        },
      };
      expect(() => isValidEducation(validEducation)).not.toThrowError();
    });

    it("should throw an error if range is missing or invalid", () => {
      const invalidEducation1 = {
        school: "Harvard University",
        degree: "Bachelor of Science",
        fieldOfStudy: "Computer Science",
      };
      const invalidEducation2 = {
        school: "Harvard University",
        degree: "Bachelor of Science",
        fieldOfStudy: "Computer Science",
        range: {
          start: [0, 2015],
          end: [5, 2019],
        }, // Invalid month
      };
      expect(() => isValidEducation(invalidEducation1)).toThrowError();
      expect(() => isValidEducation(invalidEducation2)).toThrowError();
    });
  });

  describe("isValidProject", () => {
    it("should not throw an error for valid project objects", () => {
      const validProject = {
        name: "AI Chatbot",
        position: "Lead Developer",
        description: "Developed a chatbot using AI.",
        range: {
          start: [1, 2022],
          end: [12, 2022],
        },
      };
      expect(() => isValidProject(validProject)).not.toThrowError();
    });

    it("should throw an error if range is missing or invalid", () => {
      const invalidProject1 = {
        name: "AI Chatbot",
        position: "Lead Developer",
        description: "Developed a chatbot using AI.",
      };
      const invalidProject2 = {
        name: "AI Chatbot",
        position: "Lead Developer",
        description: "Developed a chatbot using AI.",
        range: {
          start: [0, 2022],
          end: [12, 2022],
        }, // Invalid month
      };
      expect(() => isValidProject(invalidProject1)).toThrowError();
      expect(() => isValidProject(invalidProject2)).toThrowError();
    });
  });

  describe("isValidAssessmentQuestion", () => {
    it("should return true for valid assessment question objects", () => {
      const validQuestion: ObjectAny = {
        question: "What is your name?",
        inputType: "text",
      };
      expect(isValidAssessmentQuestion(validQuestion)).toBe(true);
    });

    it("should return false if question is missing or not a string", () => {
      const invalidQuestion1: ObjectAny = {
        inputType: "text",
      };
      const invalidQuestion2: ObjectAny = {
        question: 123,
        inputType: "text",
      };
      expect(isValidAssessmentQuestion(invalidQuestion1)).toBe(false);
      expect(isValidAssessmentQuestion(invalidQuestion2)).toBe(false);
    });

    it("should return false if inputType is missing or invalid", () => {
      const invalidQuestion1 = {
        question: "What is your age?",
      };
      const invalidQuestion2 = {
        question: "What is your age?",
        inputType: "invalidType",
      };
      expect(isValidAssessmentQuestion(invalidQuestion1)).toBe(false);
      expect(isValidAssessmentQuestion(invalidQuestion2)).toBe(false);
    });
  });

  describe("isValidAnsweredAssessmentQuestion", () => {
    it("should return true for valid answered assessment questions", () => {
      const validTextAnswer: ObjectAny = {
        question: "What is your name?",
        inputType: "text",
        answer: "John Doe",
      };
      const validNumberAnswer: ObjectAny = {
        question: "What is your age?",
        inputType: "number",
        answer: 25,
      };
      const validBooleanAnswer: ObjectAny = {
        question: "Do you agree?",
        inputType: "boolean",
        answer: true,
      };

      expect(isValidAnsweredAssessmentQuestion(validTextAnswer)).toBe(true);
      expect(isValidAnsweredAssessmentQuestion(validNumberAnswer)).toBe(true);
      expect(isValidAnsweredAssessmentQuestion(validBooleanAnswer)).toBe(true);
    });

    it("should return false if answer does not match inputType", () => {
      const invalidTextAnswer: ObjectAny = {
        question: "What is your name?",
        inputType: "text",
        answer: 123, // Should be a string
      };
      const invalidNumberAnswer: ObjectAny = {
        question: "What is your age?",
        inputType: "number",
        answer: "twenty-five", // Should be a number
      };
      const invalidBooleanAnswer: ObjectAny = {
        question: "Do you agree?",
        inputType: "boolean",
        answer: "yes", // Should be a boolean
      };

      expect(isValidAnsweredAssessmentQuestion(invalidTextAnswer)).toBe(false);
      expect(isValidAnsweredAssessmentQuestion(invalidNumberAnswer)).toBe(
        false
      );
      expect(isValidAnsweredAssessmentQuestion(invalidBooleanAnswer)).toBe(
        false
      );
    });

    it("should return false if the object is missing required properties", () => {
      const missingAnswer: AnsweredAssessmentQuestionObj = {
        question: "What is your name?",
        inputType: "text",
      };
      const missingQuestion: AnsweredAssessmentQuestionObj = {
        inputType: "text",
        answer: "John Doe",
      };
      const missingInputType: AnsweredAssessmentQuestionObj = {
        question: "What is your name?",
        answer: "John Doe",
      };

      expect(isValidAnsweredAssessmentQuestion(missingAnswer)).toBe(false);
      expect(isValidAnsweredAssessmentQuestion(missingQuestion)).toBe(false);
      expect(isValidAnsweredAssessmentQuestion(missingInputType)).toBe(false);
    });
  });

  describe("isValidAnsweredAssessmentQuestions", () => {
    it("should return true for an array of valid answered assessment questions", () => {
      const validQuestions: ObjectAny[] = [
        {
          question: "What is your name?",
          inputType: "text",
          answer: "John Doe",
        },
        {
          question: "What is your age?",
          inputType: "number",
          answer: 25,
        },
        {
          question: "Do you agree?",
          inputType: "boolean",
          answer: true,
        },
      ];

      expect(isValidAnsweredAssessmentQuestions(validQuestions)).toBe(true);
    });

    it("should return false if at least one object has an invalid answer type", () => {
      const invalidQuestions: ObjectAny[] = [
        {
          question: "What is your name?",
          inputType: "text",
          answer: "John Doe",
        },
        {
          question: "What is your age?",
          inputType: "number",
          answer: "twenty-five", // Invalid type, should be a number
        },
        {
          question: "Do you agree?",
          inputType: "boolean",
          answer: true,
        },
      ];

      expect(isValidAnsweredAssessmentQuestions(invalidQuestions)).toBe(false);
    });

    it("should return false if at least one object is missing required properties", () => {
      const missingProperties: ObjectAny[] = [
        {
          question: "What is your name?",
          inputType: "text",
          answer: "John Doe",
        },
        {
          question: "What is your age?",
          answer: 25, // Missing inputType
        },
        {
          question: "Do you agree?",
          inputType: "boolean",
          answer: true,
        },
      ];

      expect(isValidAnsweredAssessmentQuestions(missingProperties)).toBe(false);
    });

    it("should return true for an empty array", () => {
      expect(isValidAnsweredAssessmentQuestions([])).toBe(true);
    });

    it("should return false if the input is not an array", () => {
      const notAnArray: any = {
        question: "What is your name?",
        inputType: "text",
        answer: "John Doe",
      };

      expect(isValidAnsweredAssessmentQuestions(notAnArray)).toBe(false);
    });

    it("should return false if the array contains a non-object element", () => {
      const mixedArray: any[] = [
        {
          question: "What is your name?",
          inputType: "text",
          answer: "John Doe",
        },
        "invalid string",
      ];

      expect(isValidAnsweredAssessmentQuestions(mixedArray)).toBe(false);
    });
  });

  describe("isValidGoal", () => {
    it("should not throw an error for a valid goal", () => {
      const validGoal = {
        name: "Learn TypeScript",
        tasks: [
          {
            name: "Read docs",
            description: "Read TypeScript documentation",
            completitionDate: Date.now(),
          },
          { name: "Practice", description: "Build a project using TypeScript" },
        ],
      };
      expect(() => isValidGoal(validGoal)).not.toThrowError();
    });

    it("should throw an error for invalid goal objects", () => {
      const invalidGoals = [
        null,
        "invalid",
        123,
        {},
        { tasks: [] },
        { name: "", tasks: [] },
        { name: "a", tasks: [] },
        { name: "Valid Name" },
        { name: "Valid Name", tasks: "notAnArray" },
        {
          name: "Learn TypeScript",
          tasks: [{ name: "Read docs", description: "" }],
        },
      ];

      invalidGoals.forEach((goal) => {
        expect(() => isValidGoal(goal)).toThrowError();
      });
    });
  });
  describe("isSubmitGoalAction", () => {
    it("should return true for valid submit goal actions", () => {
      SubmitGoalActions.forEach((action) => {
        expect(isSubmitGoalAction(action)).toBe(true);
      });
    });

    it("should return false for invalid submit goal actions", () => {
      const invalidActions = [null, "invalidAction", 123, {}, []];
      invalidActions.forEach((action) => {
        expect(isSubmitGoalAction(action)).toBe(false);
      });
    });
  });
  describe("isTaskObj", () => {
    it("should not throw an error for a valid task object", () => {
      const validTask = {
        name: "Read docs",
        description: "Read TypeScript documentation",
        completitionDate: Date.now(),
      };
      expect(() => isTaskObj(validTask)).not.toThrowError();
    });

    it("should throw an error for invalid task objects", () => {
      const invalidTasks = [
        null,
        "invalid",
        123,
        {},
        { description: "Some description" },
        { name: "Task name" },
        { name: "a", description: "Valid description" },
        { name: "Valid Name", description: "a" },
        { name: 123, description: "Valid description" },
        { name: "Valid Name", description: 123 },
        {
          name: "Valid Task",
          description: "Valid Description",
          completitionDate: "invalidDate",
        },
        {
          name: "Valid Task",
          description: "Valid Description",
          completitionDate: NaN,
        },
        {
          name: "Valid Task",
          description: "Valid Description",
          completitionDate: {},
        },
      ];

      invalidTasks.forEach((task) => {
        console.log(task);
        expect(() => isTaskObj(task)).toThrowError();
      });
    });

    it("should not throw an error if completionDate is undefined", () => {
      const validTask = {
        name: "Valid Task",
        description: "Valid Description",
      };
      expect(() => isTaskObj(validTask)).not.toThrowError();
    });

    it("should not throw an error if completionDate is a valid timestamp", () => {
      const validTask = {
        name: "Valid Task",
        description: "Valid Description",
        completitionDate: Date.now(),
      };
      expect(() => isTaskObj(validTask)).not.toThrowError();
    });
  });
});
