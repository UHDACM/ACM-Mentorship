import { DBGet, DBGetWithID, DBSetWithID } from "../db/db";
import { generateText } from "./GenAI";
import { findMentors } from "./mentorFinder";
import { validateUserObj } from "@shared/validation/user";
import {
  CheckUserBelowAIResumeQuota,
  CheckUserHasAIResumeTimeout,
  GetUserAIResumeTimeoutEnd,
  CheckUserBelowMentorFinderQuota,
  CheckUserHasMentorFinderTimeout,
  GetUserMentorFinderTimeoutEnd,
} from "../db/check";
import { ObjectAny, UserObj } from "@shared/types/general";
import env from "../env/env";
import { isMetric } from "@shared/validation/metric";
import { Metric } from "@shared/types/metric";
import { MentorMatchResult } from "@shared/types/mentorFinder";
import { MAX_MENTOR_QUERY_LENGTH } from "@shared/data/mentorFinder";
import { DateUnixIsFromCurrentHour } from "src/tools";

interface GenerateUserObjParams {
  text?: string;
  combine?: boolean;
  userID?: string;
  OAuthSubID?: string;
}

export class GenerateUserObjError extends Error {
  timeoutEnd?: number;
  constructor(message: string, timeoutEnd?: number) {
    super(message);
    this.name = "GenerateUserObjError";
    this.timeoutEnd = timeoutEnd;
  }
}

// TODO: test this function
export async function generateUserObjHandler(params: GenerateUserObjParams) {
  const { combine, text, userID, OAuthSubID } = params;
  if (typeof combine !== "boolean") {
    throw new GenerateUserObjError("combine must be a boolean");
  }

  if (!text || typeof text !== "string") {
    throw new GenerateUserObjError("text is required and must be a string");
  }

  // approximate token count
  const tokenCount = Math.ceil(text.length / 4);
  if (tokenCount > env.AI_LIMITS.maxTokensPerRequest) {
    throw new GenerateUserObjError("Input text is too long " + tokenCount);
  }

  if (!userID || typeof userID !== "string") {
    throw new GenerateUserObjError("userID is required and must be a string");
  }

  if (!OAuthSubID || typeof OAuthSubID !== "string") {
    throw new GenerateUserObjError("Unauthorized");
  }

  // check if user is above quota
  // quick fail if user is in timeout cache
  if (CheckUserHasAIResumeTimeout(userID)) {
    throw new GenerateUserObjError(
      "User is above AI resume quota",
      GetUserAIResumeTimeoutEnd(userID)
    );
  }

  const userData = await DBGetWithID("user", userID);
  if (!userData) {
    throw new GenerateUserObjError("User not found");
  }

  try {
    validateUserObj(userData);
  } catch (error) {
    throw new GenerateUserObjError("Invalid user data");
  }

  if (userData.OAuthSubID !== OAuthSubID) {
    throw new GenerateUserObjError("Unauthorized");
  }

  if (!(await CheckUserBelowAIResumeQuota(userID))) {
    throw new GenerateUserObjError(
      "User is above AI resume quota",
      GetUserAIResumeTimeoutEnd(userID)
    );
  }

  const response = await generateText(
    text,
    combine ? JSON.stringify(userData) : undefined
  );

  if (!response) return;

  let metrics: Metric | undefined = await DBGetWithID("metrics", userID);

  if (!isMetric(metrics)) {
    metrics = {};
  }

  let AIResumeMetric = metrics.AIResume || {
    requestsMadeLastHour: { count: 0, timestamp: 0 },
    tokensUsedLastHour: { count: 0, timestamp: 0 },
  };

  // update metrics (reset counts if last request was from a past hour)
  if (DateUnixIsFromCurrentHour(AIResumeMetric.requestsMadeLastHour.timestamp)) {
    AIResumeMetric = {
      ...metrics.AIResume,
      requestsMadeLastHour: {
        count: (metrics.AIResume?.requestsMadeLastHour?.count || 0) + 1,
        timestamp: Date.now(),
      },
      tokensUsedLastHour: {
        count: (metrics.AIResume?.tokensUsedLastHour?.count || 0) + tokenCount,
        timestamp: Date.now(),
      },
    };
  } else {
    AIResumeMetric = {
      ...metrics.AIResume,
      requestsMadeLastHour: { count: 1, timestamp: Date.now() },
      tokensUsedLastHour: { count: tokenCount, timestamp: Date.now() },
    };
  }

  metrics.AIResume = AIResumeMetric;

  await DBSetWithID("metrics", userID, metrics);

  // doesn't return full user obj, only parts that are expected to be updated from resume
  const partialUserObj: UserObj = {
    fName: response.fName,
    mName: response.mName,
    lName: response.lName,

    bio: response.bio,
    softSkills: response.softSkills,

    education: response.education,
    experience: response.experience,
    certifications: response.certifications,
    projects: response.projects,
    socials: response.socials,
  };
  return { partialUserObj, successNotes: (response as ObjectAny).successNotes };
}

interface FindMentorsParams {
  query?: string;
  userID?: string;
  OAuthSubID?: string;
}

export class FindMentorsError extends Error {
  timeoutEnd?: number;
  constructor(message: string, timeoutEnd?: number) {
    super(message);
    this.name = "FindMentorsError";
    this.timeoutEnd = timeoutEnd;
  }
}

// getAllMentors on the backend sends everything, we don't want to do that here
function TrimMentorForClient(mentor: UserObj): UserObj {
  return {
    id: mentor.id,
    fName: mentor.fName,
    mName: mentor.mName,
    lName: mentor.lName,
    username: mentor.username,
    displayPictureURL: mentor.displayPictureURL,
    bio: mentor.bio,
    softSkills: mentor.softSkills,
    isMentor: mentor.isMentor,
    acceptingMentees: mentor.acceptingMentees,
  };
}

export async function findMentorsHandler(params: FindMentorsParams) {
  const { query, userID, OAuthSubID } = params;

  if (!query || typeof query !== "string") {
    throw new FindMentorsError("query is required and must be a string");
  }

  if (query.length > MAX_MENTOR_QUERY_LENGTH) {
    throw new FindMentorsError(
      `query must be ${MAX_MENTOR_QUERY_LENGTH} characters or less`
    );
  }

  const tokenCount = Math.ceil(query.length / 4);
  if (tokenCount > env.AI_LIMITS.maxTokensPerRequest) {
    throw new FindMentorsError("Query is too long " + tokenCount);
  }

  if (!userID || typeof userID !== "string") {
    throw new FindMentorsError("userID is required and must be a string");
  }

  if (!OAuthSubID || typeof OAuthSubID !== "string") {
    throw new FindMentorsError("Unauthorized");
  }

  // quick fail if user is in timeout cache
  if (CheckUserHasMentorFinderTimeout(userID)) {
    throw new FindMentorsError(
      "User is above mentor finder quota",
      GetUserMentorFinderTimeoutEnd(userID)
    );
  }

  const userData = await DBGetWithID("user", userID);
  if (!userData) {
    throw new FindMentorsError("User not found");
  }

  try {
    validateUserObj(userData);
  } catch (error) {
    throw new FindMentorsError("Invalid user data");
  }

  if (userData.OAuthSubID !== OAuthSubID) {
    throw new FindMentorsError("Unauthorized");
  }

  if (!(await CheckUserBelowMentorFinderQuota(userID))) {
    throw new FindMentorsError(
      "User is above mentor finder quota",
      GetUserMentorFinderTimeoutEnd(userID)
    );
  }

  const mentorDocs = await DBGet(
    "user",
    [
      ["isMentor", "==", true],
      ["acceptingMentees", "==", true],
    ],
    "and"
  );

  const mentors: UserObj[] = [];
  for (const doc of mentorDocs) {
    if (doc.id == userID) {
      // a mentor searching for a mentor shouldn't get themselves back
      continue;
    }
    try {
      validateUserObj(doc);
    } catch {
      continue;
    }
    mentors.push(doc);
  }

  const matches = await findMentors(query, mentors);

  let metrics: Metric | undefined = await DBGetWithID("metrics", userID);

  if (!isMetric(metrics)) {
    metrics = {};
  }

  let MentorFinderMetric = metrics.MentorFinder || {
    requestsMadeLastHour: { count: 0, timestamp: 0 },
    tokensUsedLastHour: { count: 0, timestamp: 0 },
  };

  if (DateUnixIsFromCurrentHour(MentorFinderMetric.requestsMadeLastHour.timestamp)) {
    MentorFinderMetric = {
      requestsMadeLastHour: {
        count: MentorFinderMetric.requestsMadeLastHour.count + 1,
        timestamp: Date.now(),
      },
      tokensUsedLastHour: {
        count: MentorFinderMetric.tokensUsedLastHour.count + tokenCount,
        timestamp: Date.now(),
      },
    };
  } else {
    MentorFinderMetric = {
      requestsMadeLastHour: { count: 1, timestamp: Date.now() },
      tokensUsedLastHour: { count: tokenCount, timestamp: Date.now() },
    };
  }

  metrics.MentorFinder = MentorFinderMetric;

  await DBSetWithID("metrics", userID, metrics);

  // stitch the match info back onto the mentor
  const results: MentorMatchResult[] = [];
  for (const match of matches) {
    const mentor = mentors.find((m) => m.id == match.userID);
    if (!mentor) {
      // model made up an id
      continue;
    }
    results.push({
      mentor: TrimMentorForClient(mentor),
      reason: match.reason,
      score: match.score,
    });
  }

  return results;
}
