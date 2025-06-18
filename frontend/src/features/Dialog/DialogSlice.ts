// written in JS because typing is such an issue with redux
import { createSlice, Draft, PayloadAction } from "@reduxjs/toolkit";
import { ReactNode } from "react";

export type DialogInputType = 'number' | 'text' | 'email' | 'select' | 'toggle' | 'file';
export type DialogInput = {
  label: string,
  type: DialogInputType,
  name?: string,
  selectOptions?: string[] | boolean[] | number[],
  inputStyle?: React.CSSProperties,
  labelStyle?: React.CSSProperties,
  accept?: string,
  containerStyle?: React.CSSProperties,
  initialValue?: string | number | undefined | boolean,
  placeholder?: string,
  disabled?: boolean
}

export type DialogButton = {
  text?: string,
  onClick?: (DialogFormParams: Object, enableCallback: Function) => any,
  style?: React.CSSProperties,

  /**
   * If true, the onClick will receive all the input states + am enable button function.
   * 
   * Useful if you want button to be disabled until something happens.
   */
  useDisableTill?: boolean
};

export interface SetDialogObject {
  showDelay?: number,
  containerStyle?: React.CSSProperties,
  overlayStyle?: React.CSSProperties,
  title?: string,
  titleStyle?: React.CSSProperties,
  subtitle?: string,
  subTitleStyle?: React.CSSProperties,
  buttons?: DialogButton[],
  buttonContainerStyle?: React.CSSProperties,
  inputs?: DialogInput[],
  showComponent?: ReactNode
};

interface DialogState extends SetDialogObject {
  active?: boolean,
  dialogQueue?: SetDialogObject[]
};

const initialState: DialogState = {};

const DialogSlice = createSlice({
  name: "ServerConnection",
  initialState: initialState,
  reducers: {
    addDialog(state: Draft<DialogState>, action: PayloadAction<SetDialogObject>) {
      // pushes dialog to queue
      state.dialogQueue = [...(state.dialogQueue || []), action.payload];
    },
    addDialogImmediate(state: Draft<DialogState>, action: PayloadAction<SetDialogObject>) {
      // pushes dialog to front of queue
      state.dialogQueue = [action.payload, ...(state.dialogQueue || [])];
    },
    closeDialog(state: Draft<DialogState>) {
        state.active = false;
    },
    showNextDialog(state: Draft<DialogState>) {
      if (!state.dialogQueue || state.dialogQueue.length === 0) {
        state.active = false;
        return;
      }

      const nextDialog = state.dialogQueue[0];
      return { dialogQueue: state.dialogQueue.slice(1), ...nextDialog, active: true };
    }
  },
});

export const { addDialog, addDialogImmediate, closeDialog, showNextDialog } = DialogSlice.actions;
export default DialogSlice.reducer;
