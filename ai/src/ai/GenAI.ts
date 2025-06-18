import { GoogleGenAI } from "@google/genai";
import { Certification, Education, Experience, Project, SocialTypes, UserObj } from "@shared/types/general";
import { validateUserObj } from "@shared/validation/user";
import env from "../env/env";
import { MAX_BIO_LENGTH } from "@shared/data/user";

const genAI = new GoogleGenAI({
  apiKey: env.AI_API_KEY,
});

interface ExampleUserObj extends UserObj {
  education: (Education & { noteDoNotIncludeInOutput?: string })[];
  experience: (Experience & { noteDoNotIncludeInOutput?: string })[];
  certifications: (Certification & { noteDoNotIncludeInOutput?: string })[];
  projects: (Project & { noteDoNotIncludeInOutput?: string })[];
  successNotes: string;
}

const ExampleUserObj: ExampleUserObj = {
  fName: "Jane",
  mName: "Optional (Return empty string if none)",
  lName: "Doe",
  bio: `AI engineer. MAX LENGTH 30 WORDS and ${MAX_BIO_LENGTH} CHARACTERS`,
  softSkills: ["communication"],
  education: [
    {
      degree: "B.Sc. CS",
      school: "Tech Univ",
      fieldOfStudy: "AI (fieldOfStudy)",
      range: { start: [9, 2020], end: [6, 2024] },
      noteDoNotIncludeInOutput: "ALL FIELDS ARE REQUIRED if not all can be provided, omit the entire entry. For range: Start and End are [number (month), number (year)]. Use end: null for ongoing. [null, null] is not valid, neither is [null, 2024] or [9, null]",
    },
  ],
  experience: [
    {
      position: "Intern",
      company: "Innovatech",
      description: "Web dev.",
      range: { start: [1, 2022], end: null },
      noteDoNotIncludeInOutput: "ALL FIELDS ARE REQUIRED if not all can be provided, omit the entire entry. For range: Start and End are [number (month), number (year)]. Use end: null for ongoing. [null, null] is not valid, neither is [null, 2024] or [9, null]",
    },
  ],
  certifications: [
    {
      name: "AWS Cloud",
      issuingOrg: "Amazon",
      noteDoNotIncludeInOutput: "ALL FIELDS ARE REQUIRED if not all can be provided, omit the entire entry.",
    },
  ],
  projects: [
    {
      name: "Mentorship Platform",
      description: "Mentor app.",
      position: "Lead Dev",
      range: { start: [3, 2023], end: [12, 2023] },
      noteDoNotIncludeInOutput: "ALL FIELDS ARE REQUIRED if not all can be provided, omit the entire entry. For range: Start and End are [number (month), number (year)]. Use end: null for ongoing. [null, null] is not valid, neither is [null, 2024] or [9, null]",
    },
  ],
  socials: [{ type: "github", url: "https://github.com/janedoe" }],
  successNotes: "e.g.: Many changes were made to your profile (reason). e.g.2: Very few changes were made to your profile (reason). e.g.3: No changes were made to your profile (reason).",
};

const maxRetries = 3;
export const generateText = async (
  userResumeData: string,
  combineWithData?: string
): Promise<UserObj | undefined> => {
  // Build prompt// Build prompt for AI
  const TotalPrompt = [
    `\n\n
    Example User Profile Structure:\n${JSON.stringify(ExampleUserObj)}`,
    combineWithData
      ? `Combine this profile with additional existing user data:\n${combineWithData}`
      : "",
    userResumeData ? `This is the user's resume data:\n${userResumeData}` : "",
    `social profiles should use the following types: ${Object.values(
      SocialTypes
    ).join(", ")}. If a type is not applicable, omit it.`,
    "IMPORTANT: Return only a valid JSON object. Do not include any markdown, explanations, or extra text. Include success note the user will see, noting if significant changes were made.",
  ]
    .filter(Boolean)
    .join("\n\n");
  // const TotalPrompt = `${env.AI_SYSTEM_PROMPT}\n${ExampleUserObj}\n${ImportantPoints}\n${combineWithData ? `Combine with ${combineWithData}\n` : ''}${userResumeData}`;
  let currentPromptStart = env.AI_SYSTEM_PROMPT;
  let response = "";
  let attempts = 0;
  let satisfied = false;
  while (attempts < maxRetries && !satisfied) {
    try {
      const contents = currentPromptStart + TotalPrompt;
      console.log("AI Prompt Attempt:", attempts + 1);
      console.log("Prompt Content:", contents);
      response =
        (
          await genAI.models.generateContent({
            model: env.AI_MODEL_NAME,
            contents: contents,
          })
        ).text || "";
      response = response.replace(/```json|```/g, "").trim();
      validateUserObj(JSON.parse(response));
      satisfied = true; // If validation passes, we are satisfied
    } catch (error) {
      currentPromptStart = `The previous response was invalid because: ${
        (error as Error).message
      }\nPrevious Response: ${response}\nPlease provide a valid UserObj in JSON format. Here is the original prompt:\n`;
      attempts++;
      if (attempts >= maxRetries) {
        throw new Error(
          "Failed to generate valid UserObj after multiple attempts"
        );
      }
    }
  }

  if (!satisfied) {
    return undefined;
  }

  try {
    return JSON.parse(response);
  } catch {
    return undefined;
  }
};
