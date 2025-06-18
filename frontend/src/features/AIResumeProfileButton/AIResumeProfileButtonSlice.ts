import { createSlice } from "@reduxjs/toolkit";
import { LocalStorageKeys } from "@shared/data/localStorage";

interface AIResumeProfileButtonState {
  isGenerating: boolean;
  timeoutEnd?: number;
};

const initialState: AIResumeProfileButtonState = {
  isGenerating: false,
  timeoutEnd: undefined,
};

export const AIResumeProfileButtonSlice = createSlice({
  name: "AIResumeProfileButton",
  initialState,
  reducers: {
    setAIResumeProfileButtonIsGenerating: (state, action) => {
      state.isGenerating = action.payload;
    },
    setAIResumeProfileButtonTimeoutEnd: (state, action) => {
      const timeoutEnd = action.payload;
      state.timeoutEnd = timeoutEnd;
      localStorage.setItem(LocalStorageKeys.AIResumeTimeoutEnd, timeoutEnd ? timeoutEnd.toString() : "");
    },
  },
});

export const { setAIResumeProfileButtonIsGenerating, setAIResumeProfileButtonTimeoutEnd } = AIResumeProfileButtonSlice.actions;
export default AIResumeProfileButtonSlice.reducer;
