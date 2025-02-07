export type CardinalDirection = 'down' | 'left' | 'up' | 'right';
export type AnyFunction = (...args: any[]) => any;
export type ObjectAny = {
  [key: string]: any
};
export type AssessmentQuestion = {
  question?: string,
  inputType?: string,
  answer?: string,
  [key: string]: any
};

export type AssessmentQuestionInputType = 'string' | 'number' | 'boolean';
export const AssessmentQuestionInputTypes = ['string', 'number', 'boolean'];
export type Assessment = {
  questions?: AssessmentQuestion[],
  published?: boolean,
  userID?: string,
  date?: number
};
