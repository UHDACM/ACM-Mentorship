import { createSlice } from '@reduxjs/toolkit';

export interface NotificationManagerState {
  notificationsAllowed: boolean | undefined;
};

const initialState: NotificationManagerState = {
  notificationsAllowed: undefined, // default to true until we check browser permission
};

const notificationManagerSlice = createSlice({
  name: 'notificationManager',
  initialState,
  reducers: {
    setNotificationsAllowed(state, action) {
      state.notificationsAllowed = action.payload;
    },
  },
});

export const { setNotificationsAllowed } = notificationManagerSlice.actions;

export default notificationManagerSlice.reducer;
