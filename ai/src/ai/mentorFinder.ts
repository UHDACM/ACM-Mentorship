import { UserObj } from "@shared/types/general";
import { MentorMatch } from "@shared/types/mentorFinder";
import { isMentorMatch } from "@shared/validation/mentorFinder";
import { genAI } from "./GenAI";
import env from "../env/env";

const MaxMatches = 6;

const MentorFinderPrompt = `You are helping a student on a university mentorship platform find a mentor.
You will be given the student's request and a list of available mentors.
Pick the mentors that best fit the request and rank them.

Rules:
- Only pick mentors from the list. Never invent an id.
- Return at most ${MaxMatches} mentors, best first.
- If nobody is a decent fit, return an empty array. Do not pad the list.
- score is 0-100, how well the mentor fits the request.
- reason is one short sentence (max 25 words) said to the student, explaining why this mentor fits. Talk about the mentor, not the student.

Return only a valid JSON array shaped like:
[{"id": "mentorIdHere", "score": 88, "reason": "why they fit"}]
Do not include markdown, explanations, or any extra text.`;

// the full user obj is way more than the model needs, so trim it down
function summarizeMentor(mentor: UserObj) {
  const { education, experience, projects, certifications } = mentor;
  return {
    id: mentor.id,
    name: [mentor.fName, mentor.lName].filter(Boolean).join(" "),
    bio: mentor.bio,
    softSkills: mentor.softSkills,
    education: (education || []).map(
      (e) => `${e.degree} in ${e.fieldOfStudy} at ${e.school}`
    ),
    experience: (experience || []).map(
      (e) => `${e.position} at ${e.company}: ${e.description}`
    ),
    projects: (projects || []).map(
      (p) => `${p.name} (${p.position}): ${p.description}`
    ),
    certifications: (certifications || []).map(
      (c) => `${c.name} from ${c.issuingOrg}`
    ),
  };
}

export async function findMentors(
  query: string,
  mentors: UserObj[]
): Promise<MentorMatch[]> {
  if (mentors.length == 0) {
    return [];
  }

  const candidates = mentors.map(summarizeMentor);
  const contents = [
    MentorFinderPrompt,
    `Student request:\n${query}`,
    `Available mentors:\n${JSON.stringify(candidates)}`,
  ].join("\n\n");

  const response =
    (
      await genAI.models.generateContent({
        model: env.AI_MODEL_NAME,
        contents: contents,
      })
    ).text || "";

  // model likes to wrap the array in a ```json block even though we told it not to
  const cleaned = response.replace(/```json|```/g, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.error("Mentor finder got back invalid json:", cleaned);
    return [];
  }

  if (!Array.isArray(parsed)) {
    return [];
  }

  // model sometimes uses "id" instead of "userID", normalize before validating
  const matches = parsed
    .map((m) => ({
      userID: m?.id || m?.userID,
      reason: m?.reason,
      score: Number(m?.score),
    }))
    .filter(isMentorMatch);

  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, MaxMatches);
}
