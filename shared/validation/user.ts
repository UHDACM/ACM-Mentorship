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
import { MAX_BIO_LENGTH } from "@shared/data/user";

export function validateUserObj(obj: unknown): asserts obj is UserObj {
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

  const errors: string[] = [];

  if (OAuthSubID && typeof OAuthSubID !== "string") {
    errors.push("OAuthSubID must be a string.");
  }

  if (fName && typeof fName !== "string") {
    errors.push("fName must be a string.");
  }
  if (mName && typeof mName !== "string") {
    errors.push("mName must be a string.");
  }
  if (lName && typeof lName !== "string") {
    errors.push("lName must be a string.");
  }

  // note: does not check for uniqueness
  if (username && typeof username !== "string") {
    errors.push("username must be a string.");
  }
  if (usernameLower && typeof usernameLower !== "string") {
    errors.push("usernameLower must be a string.");
  }

  if (email && typeof email !== "string") {
    errors.push("email must be a string.");
  }

  if (id && typeof id !== "string") {
    errors.push("id must be a string.");
  }
  if (isMentee && typeof isMentee !== "boolean") {
    errors.push("isMentee must be a boolean.");
  }
  if (isMentor && typeof isMentor !== "boolean") {
    errors.push("isMentor must be a boolean.");
  }
  if (acceptingMentees && typeof acceptingMentees !== "boolean") {
    errors.push("acceptingMentees must be a boolean.");
  }
  if (displayPictureURL && typeof displayPictureURL !== "string") {
    errors.push("displayPictureURL must be a string.");
  }
  if (bio) {
    if (typeof bio !== "string") {
      errors.push("bio must be a string.");
    } else if (bio.length > MAX_BIO_LENGTH) {
      errors.push("bio is too long. Max length is " + MAX_BIO_LENGTH + " characters.");
    }
  }

  if (assessments && !isValidAssessmentPreviewMap(assessments)) {
    errors.push("Invalid assessments.");
  }
  if (menteeIDs && !Array.isArray(menteeIDs)) {
    errors.push("menteeIDs must be an array.");
  }
  if (mentorIDs && !Array.isArray(mentorIDs)) {
    errors.push("mentorIDs must be an array.");
  }
  if (mentorshipRequests && !Array.isArray(mentorshipRequests)) {
    errors.push("mentorshipRequests must be an array.");
  }
  if (softSkills && !Array.isArray(softSkills)) {
    errors.push("softSkills must be an array.");
  }
  if (goals && !isValidGoalPreviewMap(goals)) {
    errors.push("Invalid goals.");
  }

  if (education) {
    if (!Array.isArray(education)) {
      errors.push("education must be an array.");
    } else {
      education.forEach((edu, idx) => {
        try {
          isValidEducation(edu);
        } catch (e: any) {
          errors.push(`education[${idx}]: ${e.message}`);
        }
      });
    }
  }

  if (experience) {
    if (!Array.isArray(experience)) {
      errors.push("experience must be an array.");
    } else {
      experience.forEach((exp, idx) => {
        try {
          isValidExperience(exp);
        } catch (e: any) {
          errors.push(`experience[${idx}]: ${e.message}`);
        }
      });
    }
  }

  if (certifications) {
    if (!Array.isArray(certifications)) {
      errors.push("certifications must be an array.");
    } else {
      certifications.forEach((cert, idx) => {
        try {
          isValidCertification(cert);
        } catch (e: any) {
          errors.push(`certifications[${idx}]: ${e.message}`);
        }
      });
    }
  }

  if (projects) {
    if (!Array.isArray(projects)) {
      errors.push("projects must be an array.");
    } else {
      projects.forEach((proj, idx) => {
        try {
          isValidProject(proj);
        } catch (e: any) {
          errors.push(`projects[${idx}]: ${e.message}`);
        }
      });
    }
  }

  if (socials) {
    if (!Array.isArray(socials)) {
      errors.push("socials must be an array.");
    } else {
      socials.forEach((social, idx) => {
        try {
          isValidSocial(social);
        } catch (e: any) {
          errors.push(`socials[${idx}]: ${e.message}`);
        }
      });
    }
  }

  if (testing && typeof testing !== "boolean") {
    errors.push("testing must be a boolean.");
  }

  if (chats && !Array.isArray(chats)) {
    errors.push("chats must be an array.");
  }

  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }
}