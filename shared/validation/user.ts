import { UserObj } from "@shared/types/general";
import {
  isValidAssessmentPreviewMap,
  isValidGoalPreviewMap,
  isValidEducation,
  isValidExperience,
  isValidCertification,
  isValidProject,
  isValidSocial,
} from "./general";

export function isValidUserObj(obj: unknown): obj is UserObj {
  if (typeof obj !== "object" || obj === null) {
    throw new Error("UserObj must be a non-null object.");
  }

  const {
    fName,
    mName,
    lName,
    username,
    usernameLower,
    OAuthSubID,
    email,
    id,
    isMentee,
    isMentor,
    acceptingMentees,
    displayPictureURL,
    bio,
    assessments,
    menteeIDs,
    mentorIDs,
    mentorshipRequests,
    softSkills,
    goals,
    education,
    experience,
    certifications,
    projects,
    socials,
    testing,
    chats,
  } = obj as UserObj;

  if (OAuthSubID && typeof OAuthSubID !== "string") {
    throw new Error("OAuthSubID must be a string.");
  }

  if (fName && typeof fName !== "string") {
    throw new Error("fName must be a string.");
  }
  if (mName && typeof mName !== "string") {
    throw new Error("mName must be a string.");
  }
  if (lName && typeof lName !== "string") {
    throw new Error("lName must be a string.");
  }

  // note: does not check for uniqueness
  if (username && typeof username !== "string") {
    throw new Error("username must be a string.");
  }
  if (usernameLower && typeof usernameLower !== "string") {
    throw new Error("usernameLower must be a string.");
  }

  if (email && typeof email !== "string") {
    throw new Error("email must be a string.");
  }

  if (id && typeof id !== "string") {
    throw new Error("id must be a string.");
  }
  if (isMentee && typeof isMentee !== "boolean") {
    throw new Error("isMentee must be a boolean.");
  }
  if (isMentor && typeof isMentor !== "boolean") {
    throw new Error("isMentor must be a boolean.");
  }
  if (acceptingMentees && typeof acceptingMentees !== "boolean") {
    throw new Error("acceptingMentees must be a boolean.");
  }
  if (displayPictureURL && typeof displayPictureURL !== "string") {
    throw new Error("displayPictureURL must be a string.");
  }
  if (bio && typeof bio !== "string") {
    throw new Error("bio must be a string.");
  }

  if (assessments && !isValidAssessmentPreviewMap(assessments)) {
    throw new Error("Invalid assessments.");
  }
  if (menteeIDs && !Array.isArray(menteeIDs)) {
    throw new Error("menteeIDs must be an array.");
  }
  if (mentorIDs && !Array.isArray(mentorIDs)) {
    throw new Error("mentorIDs must be an array.");
  }
  if (mentorshipRequests && !Array.isArray(mentorshipRequests)) {
    throw new Error("mentorshipRequests must be an array.");
  }
  if (softSkills && !Array.isArray(softSkills)) {
    throw new Error("softSkills must be an array.");
  }
  if (goals && !isValidGoalPreviewMap(goals)) {
    throw new Error("Invalid goals.");
  }

  if (education) {
    if (!Array.isArray(education)) {
      throw new Error("education must be an array.");
    }
    education.forEach((edu) => isValidEducation(edu));
  }

  if (experience) {
    if (!Array.isArray(experience)) {
      throw new Error("experience must be an array.");
    }
    experience.forEach((exp) => isValidExperience(exp));
  }

  if (certifications) {
    if (!Array.isArray(certifications)) {
      throw new Error("certifications must be an array.");
    }
    certifications.forEach((cert) => isValidCertification(cert));
  }

  if (projects) {
    if (!Array.isArray(projects)) {
      throw new Error("projects must be an array.");
    }
    projects.forEach((proj) => isValidProject(proj));
  }

  if (socials) {
    if (!Array.isArray(socials)) {
      throw new Error("socials must be an array.");
    }
    socials.forEach((social) => isValidSocial(social));
  }

  if (testing && typeof testing !== "boolean") {
    throw new Error("testing must be a boolean.");
  }

  if (chats && !Array.isArray(chats)) {
    throw new Error("chats must be an array.");
  }

  return true;
}