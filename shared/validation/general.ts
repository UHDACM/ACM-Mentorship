import {
  Certification,
  Education,
  Experience,
  MonthYearDateRange,
  Project,
  SocialObj,
  SocialTypes,
  AssessmentPreviewMap,
  GoalPreviewMap,
  MentorshipRequestObj,
  MessageObj,
  ChatObj,
  AssessmentQuestion,
  AssessmentQuestionInputTypes,
  SubmitGoalAction,
  SubmitGoalActions,
  GoalObj,
  TaskObj,
  Assessment,
} from "../types/general";

export function isValidSocial(social: unknown): social is SocialObj {
  if (typeof social != "object") {
    throw new Error("A social was not formatted correctly.");
  }
  const { type, url } = social as SocialObj;
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

export function isValidExperience(
  experience: unknown
): experience is Experience {
  if (typeof experience != "object") {
    throw new Error("Experience format was unexpected");
  }
  const { company, position, description, range } = experience as Experience;
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
    throw new Error(validExperienceErrorHeader + (err as Error).message);
  }

  return true;
}

export const isValidMonthYearRange_YearToo = -100000;
const isValidMonthYearRange_YearTooOldError = `Oh imortal one, please reach out to HR, we've been meaning to speak with you`;
export function isValidMonthYearRange(
  range: unknown
): range is MonthYearDateRange {
  if (!range || typeof range !== "object") {
    throw new Error("Invalid range format");
  }

  const { start, end } = range as MonthYearDateRange;

  if (!start || !Array.isArray(start) || start.length !== 2) {
    throw new Error("Start date format does not make sense.");
  }

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

export function isValidMonthInteger(monthInteger: number) {
  return monthInteger > 0 && monthInteger < 13;
}

export function isValidProject(project: unknown): project is Project {
  if (typeof project != "object") {
    throw new Error("Project format was unexpected");
  }
  const { name, position, description, range } = project as Project;
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
    throw new Error(validProjectErrorHeader + (err as Error).message);
  }
  return true;
}

export function isValidEducation(education: unknown): education is Education {
  if (typeof education != "object") {
    throw new Error("Experience format was unexpected");
  }
  const { school, degree, fieldOfStudy, range } = education as Education;
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
    throw new Error(educationErrorHeader + (err as Error).message);
  }
  return true;
}

export function isValidCertification(
  certification: unknown
): certification is Certification {
  if (typeof certification != "object") {
    throw new Error("Certification format was unexpected");
  }
  const { name, issuingOrg } = certification as Certification;
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

export function isValidAssessmentPreviewMap(
  map: unknown
): map is AssessmentPreviewMap {
  if (typeof map !== "object" || map === null) {
    throw new Error("AssessmentPreviewMap must be an object.");
  }

  for (const val of Object.values(map)) {
    if (
      typeof val !== "object" ||
      val === null ||
      typeof val.date !== "number"
    ) {
      throw new Error(`Invalid assessment preview object: ${JSON.stringify(val)}`);
    }
  }

  return true;
}

export function isValidGoalPreviewMap(map: unknown): map is GoalPreviewMap {
  if (typeof map !== "object" || map === null) {
    throw new Error("GoalPreviewMap must be an object.");
  }

  for (const val of Object.values(map)) {
    if (
      typeof val !== "object" ||
      val === null ||
      typeof val.name !== "string"
    ) {
      throw new Error(`Invalid goal preview object: ${JSON.stringify(val)}`);
    }
  }

  return true;
}

export function isValidMentorshipRequestObj(
  obj: unknown
): obj is MentorshipRequestObj {
  if (typeof obj !== "object" || obj === null) {
    throw new Error("MentorshipRequestObj must be an object.");
  }
  const { menteeID, mentorID, id, status, testing } = obj as MentorshipRequestObj;

  // required
  if (!menteeID || (typeof menteeID !== "string" || menteeID.trim().length < 1)) {
    throw new Error("menteeID must be a non-empty string if provided.");
  }
  if (!mentorID || (typeof mentorID !== "string" || mentorID.trim().length < 1)) {
    throw new Error("mentorID must be a non-empty string if provided.");
  }

  // optional
  if (id !== undefined && (typeof id !== "string" || id.trim().length < 1)) {
    throw new Error("id must be a non-empty string if provided.");
  }
  if (status !== undefined && typeof status !== "string") {
    throw new Error("status must be a string if provided.");
  }
  if (testing !== undefined && typeof testing !== "boolean") {
    throw new Error("testing must be a boolean if provided.");
  }

  return true;
}


export function isValidMessageObj(obj: unknown): obj is MessageObj {
  if (typeof obj !== "object" || obj === null) {
    throw new Error("MessageObj must be an object.");
  }
  const { contents, timestamp, sender, chatID, id } = obj as MessageObj;

  if (!contents || typeof contents !== "string" || contents.trim().length < 1) {
    throw new Error("contents must be a non-empty string.");
  }
  if (typeof timestamp !== "number" || !Number.isFinite(timestamp)) {
    throw new Error("timestamp must be a valid number.");
  }
  if (!sender || typeof sender !== "string" || sender.trim().length < 1) {
    throw new Error("sender must be a non-empty string.");
  }
  if (!chatID || typeof chatID !== "string" || chatID.trim().length < 1) {
    throw new Error("chatID must be a non-empty string.");
  }
  if (id !== undefined && (typeof id !== "string" || id.trim().length < 1)) {
    throw new Error("id must be a non-empty string if provided.");
  }
  return true;
}

export function isValidChatObj(obj: unknown): obj is ChatObj {
  if (typeof obj !== "object" || obj === null) {
    throw new Error("ChatObj must be an object.");
  }
  const { users, messages, lastMessage, id } = obj as ChatObj;

  if (!users || typeof users !== "object" || users === null) {
    throw new Error("users must be a valid ChatObjUserPreviewMap object.");
  }
  if (!Array.isArray(messages)) {
    throw new Error("messages must be an array.");
  }
  for (const msg of messages) {
    if (typeof msg !== "string" || msg.trim().length < 1) {
      throw new Error("Each message must be a non-empty string.");
    }
  }
  if (lastMessage && !isValidMessageObj(lastMessage)) {
    throw new Error("lastMessage must be a valid MessageObj.");
  }
  if (!id || typeof id !== "string" || id.trim().length < 1) {
    throw new Error("id must be a non-empty string.");
  }
  return true;
}


export function isValidAssessmentQuestion(q: object): q is AssessmentQuestion {
  if (!q || typeof q != "object") {
    return false;
  }

  const { question, inputType } = q as AssessmentQuestion;
  if (!question || typeof question != "string") {
    return false;
  } else if (!inputType || !AssessmentQuestionInputTypes.includes(inputType)) {
    return false;
  }
  return true;
}

export function isSubmitGoalAction(s: unknown): s is SubmitGoalAction {
  if (!s || typeof s != "string") {
    return false;
  }
  return SubmitGoalActions.includes(s as SubmitGoalAction);
}


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

  if (!tasks || !(tasks instanceof Array)) {
    throw new Error("Format of tasks array is invalid");
  }

  for (let item of tasks) {
    try {
      isTaskObj(item);
    } catch (err) {
      throw new Error(`For task: ${name}: ${(err as Error).message}.`);
    }
    item.name = item.name?.trim() || '';
    item.description = item.description?.trim() || '';
  }
  return true;
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

export function isAssessmentQuestion(q: object): q is AssessmentQuestion {
  if (!q || typeof q != "object") {
    return false;
  }
  const qAny = q as AssessmentQuestion;
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
    if (!isAssessmentQuestion(q)) {
      return false;
    }
  }
  return true;
}

export function isAssessment(s: object): s is Assessment {
  if (!s || typeof s != "object") {
    return false;
  }
  const { date, published, questions, userID } = s as Assessment;
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
