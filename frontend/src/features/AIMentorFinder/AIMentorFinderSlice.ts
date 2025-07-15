import { createSlice } from "@reduxjs/toolkit";
import { LocalStorageKeys } from "@shared/data/localStorage";

interface AIMentorFinderState {
  timeoutEnd?: number;
};

const initialState: AIMentorFinderState = {
  timeoutEnd: undefined,
};

export const AIMentorFinderSlice = createSlice({
  name: "AIMentorFinder",
  initialState,
  reducers: {
    setAIMentorFinderTimeoutEnd: (state, action) => {
      const timeoutEnd = action.payload;
      state.timeoutEnd = timeoutEnd;
      localStorage.setItem(LocalStorageKeys.MentorFinderTimeoutEnd, timeoutEnd ? timeoutEnd.toString() : "");
    },
  },
});

export const { setAIMentorFinderTimeoutEnd } = AIMentorFinderSlice.actions;
export default AIMentorFinderSlice.reducer;
