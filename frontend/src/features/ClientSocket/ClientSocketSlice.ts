// written in JS because typing is such an issue with redux
import { createSlice, Draft, PayloadAction } from "@reduxjs/toolkit";
import { AssessmentQuestion, MentorshipRequestObj, UserObj } from "@shared/types/general";
import { ClientSocketState } from "@shared/types/socket";

type ClientSocketMentorshipRequestMap = {
  [key: string]: MentorshipRequestObj;
};

interface ClientSocketRootState {
  /**
   * True when socket is authed and ready to be used.
   */
  ready?: boolean;
  state?: ClientSocketState;
  user?: UserObj;
  assessments?: string[]; // redundant, kept in user.assessments
  mentorshipRequests?: ClientSocketMentorshipRequestMap; // unused
  availableAssessmentQuestions?: AssessmentQuestion[];
};

const initialState: ClientSocketRootState = {};

const ClientSocketSlice = createSlice({
  name: "ClientSocket",
  initialState: initialState,
  reducers: {
    setClientReady(
      s: Draft<ClientSocketRootState>,
      action: PayloadAction<boolean>
    ) {
      s.ready = action.payload;
    },
    setClientState(
      s: Draft<ClientSocketRootState>,
      action: PayloadAction<ClientSocketState>
    ) {
      s.state = action.payload;
    },
    setClientUser(
      s: Draft<ClientSocketRootState>,
      action: PayloadAction<UserObj>
    ) {
      s.user = { ...action.payload };
    },
    setClientAssessments(
      s: Draft<ClientSocketRootState>,
      action: PayloadAction<string[]>
    ) {
      s.assessments = action.payload;
    },
    setMentorshipRequests(
      s: Draft<ClientSocketRootState>,
      action: PayloadAction<ClientSocketMentorshipRequestMap>
    ) {
      s.mentorshipRequests = action.payload;
    },
    setAvailableAssessmentQuestions(
      s: Draft<ClientSocketRootState>,
      action: PayloadAction<AssessmentQuestion[]>
    ) {
      s.availableAssessmentQuestions = action.payload;
    },
    resetClientSocketState(s: Draft<ClientSocketRootState>) {
      s = { ...initialState };
    }
  },
});

export const {
  setClientState,
  setClientUser,
  setClientAssessments,
  setMentorshipRequests,
  setAvailableAssessmentQuestions,
  setClientReady,
  resetClientSocketState
} = ClientSocketSlice.actions;

export default ClientSocketSlice.reducer;
