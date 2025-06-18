
// list of all collection names
export const collectionNames = ["user", "assessment", "mentorshipRequest", 'assessmentQuestion', 'goal', 'metrics', 'chat', 'message', 'userPushSubscriptions', 'userSettings'] as const;
export type collectionName = (typeof collectionNames)[number];
