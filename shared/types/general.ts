export type FunctionAny = (...args: any[]) => any;

// this function is to replace FunctionAny, which is deprecated
export type FunctionUnknown = (...args: any[]) => any;

export type SocialType =
  | "instagram"
  | "twitter"
  | "youtube"
  | "linkedIn"
  | "discord"
  | "github"
  | "stackOverflow"
  | "hackerrank"
  | "facebook"
  | "portfolio";
export const SocialTypes: SocialType[] = [
  "instagram",
  "twitter",
  "youtube",
  "linkedIn",
  "discord",
  "github",
  "stackOverflow",
  "hackerrank",
  "facebook",
  "portfolio",
];

export type AssessmentQuestion = {
  question?: string;
  inputType?: string;
  answer?: string;
  [key: string]: any;
};
export type Assessment = {
  questions?: AssessmentQuestion[];
  published?: boolean;
  userID?: string;
  date?: number;
  id?: string;
};

export const AssessmentQuestionInputTypes = ["text", "number", "boolean"];
export type AssessmentQuestionInputType =
  (typeof AssessmentQuestionInputTypes)[number];

export type Month =
  | "January"
  | "February"
  | "March"
  | "April"
  | "May"
  | "June"
  | "July"
  | "August"
  | "September"
  | "October"
  | "November"
  | "December";
export const Months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export type MentorshipRequestObj = {
  menteeID: string;
  mentorID: string;
  id?: string;
  status?: MentorshipRequestStatus;
  testing?: boolean;
};
export const MentorshipRequestStatuses = ["accepted", "declined", "cancelled"] as const;
export type MentorshipRequestStatus = (typeof MentorshipRequestStatuses)[number];

export type AssessmentPreviewMap = {
  [key: string]: AssessmentPreviewObj;
};

export type AssessmentPreviewObj = {
  /**  ID of assessment */
  date: number;
};

export type GoalPreviewMap = {
  [key: string]: GoalPreviewObj;
};

export type GoalPreviewObj = {
  name: string;
};

export type GoalObj = {
  name?: string;
  tasks?: TaskObj[];
  id?: string;
  testing?: boolean;
  userID?: string;
};

export type TaskObj = {
  name?: string;
  description?: string;
  completitionDate?: number;
};

export type SubmitGoalAction = (typeof SubmitGoalActions)[number];
export const SubmitGoalActions = ["create", "edit", "delete"] as const;

export type ChatObj = {
  users: ChatObjUserPreviewMap;
  messages: string[];
  lastMessage?: MessageObj;
  id: string;
};

type ChatObjUserPreviewMap = {
  [userID: string]: {
    username: string;
    fName: string;
    mName?: string;
    lName: string;
    displayPictureURL?: string;
  };
};

export type MessageObj = {
  contents: string;
  timestamp: number;
  sender: string;
  chatID: string;
  id?: string;
};

export type AssessmentAction =
  | "create"
  | "edit"
  | "publish"
  | "unpublish"
  | "delete";
export const AssessmentActions = [
  "create",
  "edit",
  "publish",
  "unpublish",
  "delete",
];

export type SendMessageAction = "send" | "create";
export const SendMessageActions = ["send", "create"];

export type ObjectAny = { [key: string]: any };

export type Experience = {
  company: string;
  position: string;
  description: string;
  range: MonthYearDateRange;
};

export type MonthYearDateRange = {
  start: [number, number];
  end?: [number, number];
};

export type Certification = {
  name: string;
  issuingOrg: string;
};

export type Project = {
  name: string;
  position: string;
  description: string;
  range: MonthYearDateRange;
};

export type SocialObj = {
  type: SocialType;
  url: string;
};

export type Education = {
  school: string;
  degree: string;
  fieldOfStudy: string;
  range: MonthYearDateRange;
};

// TODO: continue merging user types from frontend and backend
export type UserObj = {
  fName?: string;
  mName?: string;
  lName?: string;

  username?: string;
  usernameLower?: string;

  OAuthSubID?: string;
  email?: string;

  id?: string;
  isMentee?: boolean;
  isMentor?: boolean;
  acceptingMentees?: boolean;
  displayPictureURL?: string;
  bio?: string;
  assessments?: AssessmentPreviewMap;
  menteeIDs?: string[];
  mentorIDs?: string[];
  mentorshipRequests?: string[];
  softSkills?: string[];
  goals?: GoalPreviewMap;

  education?: Education[];
  experience?: Experience[];
  certifications?: Certification[];
  projects?: Project[];
  socials?: SocialObj[];

  testing?: boolean;

  chats?: string[];
};
