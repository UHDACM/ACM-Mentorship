import { useDispatch, useSelector } from "react-redux";
import { ReduxRootState } from "../../store";
import * as DialogRadix from "@radix-ui/react-dialog";
import { closeDialog, DialogButton, DialogInput } from "./DialogSlice";
import { useEffect, useState } from "react";
import { ObjectAny } from "@shared/types/general";
import { XIcon } from "lucide-react";
// import { Checkbox } from "@radix-ui/react-checkbox";
import { Checkbox } from "radix-ui";

const DialogInputDefaultStyling: React.CSSProperties = {
  fontSize: "1rem",
  padding: 10,
  paddingLeft: 15,
  width: "15rem",
  boxSizing: "border-box",
  borderRadius: 10,
  border: "1px solid #0002",
  backgroundColor: "#222",
  color: "white",
};

const DialogToggleDefaultStyling: React.CSSProperties = {
  backgroundColor: "#222",
  width: '2rem',
  height: '2rem',
  padding: 0,
  display: 'flex', 
  justifyContent: 'center',
  alignItems: 'center'
};
export default function Dialog() {
  const {
    title,
    titleStyle,
    subtitle,
    subTitleStyle,
    buttons,
    buttonContainerStyle,
    inputs,
    active,
    containerStyle,
    overlayStyle,
    showComponent
  } = useSelector((store: ReduxRootState) => store.Dialog);
  const [inputVals, setInputVals] = useState<ObjectAny>({});
  const [disabledButtons, setDisabledButtons] = useState(
    Array.from({ length: buttons?.length || 0 }, () => false)
  );
  const dispatch = useDispatch();

  // used to set initial values
  useEffect(() => {
    if (!inputs) {
      return;
    }
    const initialInputVals: ObjectAny = {};
    for (let input of inputs) {
      if (!input.initialValue) {
        continue;
      }
      const { label, name } = input;
      const key = name || label;
      if (!key) {
        return;
      }
      initialInputVals[key] = input.initialValue;
    }
    setInputVals(initialInputVals);
  }, [inputs]);

  function updateInputVal(key: string, val: unknown) {
    setInputVals({ ...inputVals, [key]: val });
  }

  function setButtonDisabled(btnIndex: number, disabled: boolean) {
    const disabledButtonsClone = [...disabledButtons];
    disabledButtonsClone[btnIndex] = disabled;
    setDisabledButtons(disabledButtonsClone);
  }

  function HandleForceClose() {
    dispatch(closeDialog());
  }

  // const dispatch = useDispatch();
  // function HandleCloseDialog() {
  //   dispatch(closeAlert());
  // }

  // const { title, body } = message;
  return (
    <DialogRadix.Root open={active}>
      <DialogRadix.Portal>
        <DialogRadix.Overlay
          style={{
            inset: 0,
            backgroundColor: "#0004",
            backdropFilter: "blur(2px)",
            position: "fixed",
            ...overlayStyle,
            zIndex: 10,
          }}
        />
        <DialogRadix.Content
          className="DialogContent"
          style={{
            top: "50%",
            left: "50%",
            position: "fixed",
            transform: "translate(-50%, -50%)",
            backgroundColor: "#333",
            padding: '2.5rem',
            borderRadius: 10,
            minWidth: 200,
            width: '92vw',
            maxWidth: 600,
            border: "1px solid #0004",
            zIndex: 11,
            ...containerStyle,
          }}
        >
          <XIcon
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              cursor: "pointer",
            }}
            onClick={HandleForceClose}
          />
          <DialogRadix.Title
            className="DialogTitle"
            style={{ margin: 0, fontSize: '1.5rem', ...titleStyle }}
          >
            {title}
          </DialogRadix.Title>
          <DialogRadix.Description
            className="DialogDescription"
            style={{ margin: 0, ...subTitleStyle }}
          >
            {subtitle}
          </DialogRadix.Description>
          {showComponent}
          {inputs?.map((DialogInput: DialogInput, index: number) => {
            const {
              inputStyle,
              containerStyle,
              labelStyle,
              placeholder,
              disabled,
              name,
              label,
              type,
            } = DialogInput;
            const typeIsSelect = type == "select";
            const typeIsToggle = type == "toggle";
            const typeIsInput = !(typeIsSelect || typeIsToggle);
            const OVRALL_Key = `DialogInput_${index}`;
            const DI_Key = name || label;
            const DI_Type = DialogInput.type;
            return (
              <div
                style={{ display: "flex", flexDirection: "column" }}
                key={OVRALL_Key}
              >
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "right",
                    alignItems: "center",
                    marginTop: 10,
                    marginBottom: 5,
                    ...containerStyle,
                  }}
                >
                  <p style={{ margin: 0, marginRight: 20, ...labelStyle }}>
                    {label}
                  </p>
                  {typeIsInput && (
                    <input
                      value={inputVals[DI_Key] || ""}
                      onChange={(e) => updateInputVal(DI_Key, e.target.value)}
                      style={{
                        ...DialogInputDefaultStyling,
                        ...inputStyle,
                      }}
                      type={DI_Type}
                      placeholder={placeholder ? placeholder : DI_Key}
                      disabled={disabled}
                    />
                  )}
                  {typeIsSelect && (
                    <select
                      value={inputVals[DI_Key]}
                      onChange={(e) => updateInputVal(DI_Key, e.target.value)}
                      style={{
                        ...DialogInputDefaultStyling,
                        ...inputStyle,
                      }}
                      disabled={disabled}
                    >
                      {DialogInput.selectOptions?.map((option: any, index) => {
                        return (
                          <option
                            value={`${option}`}
                            key={`${OVRALL_Key}_SelectOption_${index}`}
                          >
                            {option}
                          </option>
                        );
                      })}
                    </select>
                  )}
                  {typeIsToggle && (
                    <Checkbox.Root
                      style={{ ...DialogToggleDefaultStyling, ...inputStyle }}
                      onClick={() => updateInputVal(DI_Key, !inputVals[DI_Key])}
                    >
                        {inputVals[DI_Key] && <XIcon style={{lineHeight: 0}} strokeWidth={3} color={'#ddd'} size={'1.5rem'} />}
                    </Checkbox.Root>
                  )}
                </div>
              </div>
            );
          })}

          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              marginTop: 5,
              ...buttonContainerStyle,
            }}
          >
            {buttons?.map((DialogButton: DialogButton, btnIndex: number) => {
              if (Object.keys(DialogButton).length == 0) {
                return null;
              }

              const { useDisableTill } = DialogButton;
              const buttonDisabled = disabledButtons[btnIndex];
              return (
                <button
                  aria-label="Close"
                  style={{
                    border: "1px solid #0004",
                    backgroundColor: "#ddd",
                    color: "#333",
                    ...DialogButton.style,
                    opacity: buttonDisabled ? 0.5 : 1,
                  }}
                  disabled={buttonDisabled}
                  onClick={() => {
                    // disables the button
                    useDisableTill && setButtonDisabled(btnIndex, true);

                    // calls the onclick + sends a enable callback if dialog button requires it.
                    DialogButton.onClick &&
                      DialogButton.onClick(
                        inputVals,
                        useDisableTill
                          ? () => setButtonDisabled(btnIndex, false)
                          : undefined
                      );
                  }}
                  key={`DialogButton_${btnIndex}`}
                >
                  {DialogButton.text}
                </button>
              );
            })}
          </div>
        </DialogRadix.Content>
      </DialogRadix.Portal>
      {/* </Transition> */}
    </DialogRadix.Root>
  );
}
