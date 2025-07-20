import { createSlice } from "@reduxjs/toolkit";
import { LocalStorageKeys } from "@shared/data/localStorage";

interface AIMentorFinderState {
  isSearching: boolean;
  timeoutEnd?: number;
};

const initialState: AIMentorFinderState = {
  isSearching: false,
  timeoutEnd: undefined,
};

export const AIMentorFinderSlice = createSlice({
  name: "AIMentorFinder",
  initialState,
  reducers: {
    setAIMentorFinderIsSearching: (state, action) => {
      state.isSearching = action.payload;
    },
    setAIMentorFinderTimeoutEnd: (state, action) => {
      const timeoutEnd = action.payload;
      state.timeoutEnd = timeoutEnd;
      localStorage.setItem(LocalStorageKeys.MentorFinderTimeoutEnd, timeoutEnd ? timeoutEnd.toString() : "");
    },
  },
});

export const { setAIMentorFinderIsSearching, setAIMentorFinderTimeoutEnd } = AIMentorFinderSlice.actions;
export default AIMentorFinderSlice.reducer;
