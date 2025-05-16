import { DBGet } from "../db";
import {
  GoalObj,
  TaskObj,
  SubmitGoalAction,
  SubmitGoalActions,
  AssessmentAction,
  AssessmentActions,
  MentorshipRequestAction,
  MentorshipRequestActions,
  SendMessageAction,
  SendMessageActions,
  ObjectAny,
  SocialTypes
} from "@shared/types/general";

export const MAX_NAME_LENGTH = 36;
/**
 * Validates the first name.
 * @param fName - The first name to validate.
 * @throws Error if the first name is invalid.
 */
export function isValidFirstName(fName: string): void {
  if (typeof fName !== "string") {
    throw new Error("First name must be a string.");
  }

  const fNameLength = fName.trim().length;

  if (fNameLength < 1) {
    throw new Error("First name is too short.");
  }
  if (fNameLength > MAX_NAME_LENGTH) {
    throw new Error("First name is too long.");
  }
}

/**
 * Validates the middle name (if provided).
 * @param mName - The middle name to validate.
 * @throws Error if the middle name is invalid.
 */
export function isValidMiddleName(mName: string | undefined): void {
  if (mName && typeof mName !== "string") {
    throw new Error("Middle name must be a string.");
  }

  if (mName) {
    const mNameLength = mName.trim().length;

    if (mNameLength > MAX_NAME_LENGTH) {
      throw new Error("Middle name is too long.");
    }
  }
}

/**
 * Validates the last name.
 * @param lName - The last name to validate.
 * @throws Error if the last name is invalid.
 */
export function isValidLastName(lName: string): void {
  if (typeof lName !== "string") {
    throw new Error("Last name must be a string.");
  }

  const lNameLength = lName.trim().length;

  if (lNameLength < 1) {
    throw new Error("Last name is too short.");
  }
  if (lNameLength > MAX_NAME_LENGTH) {
    throw new Error("Last name is too long.");
  }
}

/**
 * Validates all names (first, middle, and last).
 * @param fName - The first name to validate.
 * @param mName - The middle name to validate (optional).
 * @param lName - The last name to validate.
 * @throws Error if any of the names are invalid.
 */
export function isValidNames(
  fName: string,
  mName: string | undefined,
  lName: string
): void {
  isValidFirstName(fName);
  isValidMiddleName(mName);
  isValidLastName(lName);
}

export const MIN_USERNAME_LENGTH = 2,
  MAX_USERNAME_LENGTH = 32;
const ALLOWED_USERNAME_CHARS = /^[a-zA-Z0-9_.-]+$/;

/**
 * Checks if username is valid. Cannot be too long, or too short, contain spaces inbetween, contains only a-Z, 0-9, underscores, periods, and dashes.
 *
 * **If any checks are failed, an `error` is thrown.**
 * @param usernameRaw
 * @returns
 */
export async function isValidUsername(usernameRaw: string) {
  if (typeof usernameRaw != "string") {
    throw new Error("Username type is not valid");
  }

  let username = usernameRaw.trim().toLowerCase();

  if (username.length < MIN_USERNAME_LENGTH) {
    throw new Error("Username is too short.");
  } else if (username.length > MAX_USERNAME_LENGTH) {
    throw new Error("Username is too long.");
  }

  if (!ALLOWED_USERNAME_CHARS.test(username)) {
    throw new Error(
      "Username can only contain letters, numbers, underscores, hyphens, and periods. (No spaces either)"
    );
  }

  if (username.includes(" ")) {
    throw new Error("Username cannot contain spaces.");
  }

  try {
    const res = await DBGet("user", [["usernameLower", "==", username]]);
    if (res.length > 0) {
      throw new Error("This username is not available");
    }
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(
      "There was a problem checking if this username is available. "
    );
  }
  return true;
}

export type Social = {
  type: string;
  url: string;
};
export function isValidSocial(social: ObjectAny): social is Social {
  if (typeof social != "object") {
    throw new Error("A social was not formatted correctly.");
  }
  const { type, url } = social;
  if (!type || !url) {
    throw new Error("Information was missing from a social.");
  }

  if (!SocialTypes.includes(type)) {
    throw new Error(`Social type ${type} is not valid.`);
  }

  if (typeof url != "string") {
    throw new Error(`URL is not valid.`);
  }
  return true;
}

/**
 * {
 *   company: string,
 *   position: string,
 *   description: string | undefined
 *   range: [[month, year], [month, year] | undefined]
 * }
 */

export type Experience = {
  company: string;
  position: string;
  description: string;
  range: MonthYearDateRange;
};
export function isValidExperience(
  experience: ObjectAny
): experience is Experience {
  if (typeof experience != "object") {
    throw new Error("Experience format was unexpected");
  }
  const { company, position, description, range } = experience;
  if (!company || typeof company != "string" || company.trim().length < 1) {
    throw new Error("Company name is missing from experience.");
  }

  const validExperienceErrorHeader = `Experience at ${company} | `;
  if (!position || typeof position != "string" || position.trim().length < 1) {
    throw new Error(validExperienceErrorHeader + " Position was not provided");
  } else if (
    (description && typeof description != "string") ||
    description.trim().length < 1
  ) {
    throw new Error(
      validExperienceErrorHeader +
        " Description was provided, but format was unexpected"
    );
  } else if (!range || !isValidMonthYearRange(range)) {
    throw new Error(validExperienceErrorHeader + " Range is not valid");
  }

  try {
    if (!range || !isValidMonthYearRange(range)) {
      throw new Error(validExperienceErrorHeader + " Range is not valid");
    }
  } catch (err) {
    throw new Error(validExperienceErrorHeader + err.message);
  }

  return true;
}

export type Project = {
  name: string;
  position: string;
  description: string;
  range: MonthYearDateRange;
};
export function isValidProject(project: ObjectAny): project is Project {
  if (typeof project != "object") {
    throw new Error("Project format was unexpected");
  }
  const { name, position, description, range } = project;
  if (!name || typeof name != "string" || name.trim().length < 1) {
    throw new Error("Project name is missing from experience.");
  }
  const validProjectErrorHeader = `Project name: ${name} | `;
  if (!position || typeof position != "string" || position.trim().length < 1) {
    throw new Error(validProjectErrorHeader + " Position was not provided");
  } else if (
    (description && typeof description != "string") ||
    description.trim().length < 1
  ) {
    throw new Error(
      validProjectErrorHeader +
        " Description was provided, but format was unexpected"
    );
  }

  try {
    if (!range || !isValidMonthYearRange(range)) {
      throw new Error(validProjectErrorHeader + " Range is not valid");
    }
  } catch (err) {
    throw new Error(validProjectErrorHeader + err.message);
  }
  return true;
}

export type Education = {
  school: string;
  degree: string;
  fieldOfStudy: string;
  range: MonthYearDateRange;
};
export function isValidEducation(education: ObjectAny): education is Education {
  if (typeof education != "object") {
    throw new Error("Experience format was unexpected");
  }
  const { school, degree, fieldOfStudy, range } = education;
  if (!school || typeof school != "string" || school.trim().length < 1) {
    throw new Error("Education school is missing from experience.");
  }
  const educationErrorHeader = `Error processing education "${school}":`;
  if (!degree || typeof degree != "string" || degree.trim().length < 1) {
    throw new Error(educationErrorHeader + " Position was not provided");
  } else if (
    !fieldOfStudy ||
    typeof fieldOfStudy != "string" ||
    fieldOfStudy.trim().length < 1
  ) {
    throw new Error(
      educationErrorHeader +
        " Description was provided, but format was unexpected"
    );
  }
  try {
    if (!range || !isValidMonthYearRange(range)) {
      throw new Error(educationErrorHeader + " Range is not valid");
    }
  } catch (err) {
    throw new Error(educationErrorHeader + err.message);
  }
  return true;
}

export function isValidMonthInteger(monthInteger: number) {
  return monthInteger > 0 && monthInteger < 13;
}

type MonthYearDateRange = { start: [number, number]; end?: [number, number] };
export const isValidMonthYearRange_YearToo = -100000;
const isValidMonthYearRange_YearTooOldError = `Oh imortal one, please reach out to HR, we've been meaning to speak with you`;
export function isValidMonthYearRange(
  range: ObjectAny
): range is MonthYearDateRange {
  if (
    !range ||
    typeof range !== "object" ||
    !range.start ||
    !Array.isArray(range.start) ||
    range.start.length !== 2
  ) {
    throw new Error("Invalid range format");
  }
  const { start, end } = range;

  // Validate the start date
  if (!isValidMonthInteger(start[0])) {
    throw new Error("Invalid start month");
  }

  if (start[1] < isValidMonthYearRange_YearToo) {
    throw new Error(isValidMonthYearRange_YearTooOldError);
  }

  // Validate the end date if provided
  if (end) {
    if (!Array.isArray(end) || end.length !== 2) {
      throw new Error("End date format does not make sense.");
    }

    if (!isValidMonthInteger(end[0])) {
      throw new Error("Invalid end month");
    }

    if (end[1] < isValidMonthYearRange_YearToo) {
      throw new Error(isValidMonthYearRange_YearTooOldError);
    }
  }
  return true;
}

export type Certification = {
  name: string;
  issuingOrg: string;
};
export function isValidCertification(
  certification: ObjectAny
): certification is Certification {
  if (typeof certification != "object") {
    throw new Error("Certification format was unexpected");
  }
  const { name, issuingOrg } = certification;
  if (!name || typeof name != "string" || name.trim().length < 1) {
    throw new Error("Name format was unexpected");
  } else if (
    !issuingOrg ||
    typeof issuingOrg != "string" ||
    issuingOrg.trim().length < 1
  ) {
    throw new Error('"Issuing Organization format was unexpected');
  }
  return true;
}

const AssessmentInputTypes = ["text", "number", "boolean"];
export type AssessmentInputType = "text" | "number" | "boolean";
export type AssessmentQuestionObj = {
  question?: string;
  inputType?: AssessmentInputType;
};
export function isValidAssessmentQuestion(
  AQO: ObjectAny
): AQO is AssessmentQuestionObj {
  if (!AQO || typeof AQO != "object") {
    return false;
  }
  const { question, inputType } = AQO;
  if (typeof question != "string") {
    return false;
  } else if (!AssessmentInputTypes.includes(inputType)) {
    return false;
  }
  return true;
}

export type AnsweredAssessmentQuestionObj = AssessmentQuestionObj & {
  answer?: unknown;
};
export function isValidAnsweredAssessmentQuestion(
  AAQO: ObjectAny
): AAQO is AnsweredAssessmentQuestionObj {
  if (!isValidAssessmentQuestion(AAQO)) {
    return false;
  }

  const { answer, inputType } = AAQO as ObjectAny;
  switch (inputType) {
    case "text":
      return typeof answer === "string";
    case "boolean":
      return typeof answer === "boolean";
    case "number":
      return typeof answer === "number";
    default:
      return false;
  }
}

export function isValidAnsweredAssessmentQuestions(
  AAQO: ObjectAny[]
): AAQO is AnsweredAssessmentQuestionObj[] {
  if (!(AAQO instanceof Array)) {
    return false;
  }
  for (let obj of AAQO) {
    if (!isValidAnsweredAssessmentQuestion(obj)) {
      return false;
    }
  }
  return true;
}

export function isValidAssessmentAction(s: string): s is AssessmentAction {
  return AssessmentActions.includes(s);
}

export function isValidMentorshipRequestAction(
  s: string
): s is MentorshipRequestAction {
  return MentorshipRequestActions.includes(s);
}

export const MAX_BIO_LENGTH = 200;

/**
 * Checks if a goal is valid.
 *
 * Throws error with message if invalid, true otherwise.
 *
 * mutates goal, trimming strings for space.
 * @param s
 * @returns
 */
export function isValidGoal(s: unknown): s is GoalObj {
  if (!s || typeof s != "object") {
    throw new Error("Goal object is invalid");
  }

  const { tasks, name } = s as GoalObj;
  if (!name) {
    throw new Error("Name is missing from goal");
  }

  if (typeof name != "string") {
    throw new Error("Name is invalid");
  }

  if (name.trim().length < 3) {
    throw new Error("Name is too short");
  }

  s["name"] = name.trim();

  if (!tasks || !(tasks instanceof Array)) {
    throw new Error("Format of tasks array is invalid");
  }

  for (let item of tasks) {
    try {
      isTaskObj(item);
    } catch (err) {
      throw new Error(`For task: ${name}: ${err.message}.`);
    }
    item.name = item.name.trim();
    item.description = item.description.trim();
  }
  return true;
}

export function isSubmitGoalAction(s: unknown): s is SubmitGoalAction {
  if (!s || typeof s != "string") {
    return false;
  }
  return SubmitGoalActions.includes(s);
}

export const MIN_TASK_NAME_LENGTH = 3;
export const MIN_DESCRIPTION_NAME_LENGTH = 3;
export function isTaskObj(s: unknown): s is TaskObj {
  if (!s || typeof s != "object") {
    throw new Error("Task object is invalid");
  }

  const { name, description, completitionDate } = s as TaskObj;

  if (!name || !description) {
    throw new Error("Name, description, or completitionDate is missing");
  }

  if (typeof name != "string") {
    throw new Error("Task Name is invalid");
  } else if (name.trim().length < MIN_TASK_NAME_LENGTH) {
    throw new Error("Task name is too short");
  }

  if (typeof description != "string") {
    throw new Error("Description is invalid");
  } else if (description.trim().length < MIN_DESCRIPTION_NAME_LENGTH) {
    throw new Error("Description is too short");
  }

  if (
    (completitionDate != undefined || completitionDate != null) &&
    (typeof completitionDate != "number" ||
      isNaN(new Date(completitionDate).getTime()))
  ) {
    throw new Error("Completion date is invalid");
  }

  return true;
}

export function isSendMessageAction(s: unknown): s is SendMessageAction {
  if (!s || typeof s != "string") {
    return false;
  }
  return SendMessageActions.includes(s);
}

/**
 * Checks s is valid message.
 *
 * Throws descriptive error if invalid. Returns true otherwise.
 * @param s
 * @returns
 */
export function isValidMessageContent(s: unknown): s is string {
  if (!s || typeof s != "string") {
    throw new Error("No message content was provided");
  }
  if (s.trim().length == 0) {
    throw new Error("Message content is too short");
  }
  return true;
}
