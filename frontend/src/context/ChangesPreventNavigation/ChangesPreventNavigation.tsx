import { createContext, useContext, useEffect, useState } from "react";
import { useBlocker } from "react-router-dom";

interface ChangesPreventNavigationContextType {
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (hasChanges: boolean) => void;

  warningText: string;
  setWarningText: (text: string) => void;
}

const defaultContextValue: ChangesPreventNavigationContextType = {
  hasUnsavedChanges: false,
  setHasUnsavedChanges: () => {},

  warningText: "You have unsaved changes. Are you sure you want to leave?",
  setWarningText: () => {},
};

const context = createContext<ChangesPreventNavigationContextType>(defaultContextValue);


export function ChangesPreventNavigationProvider({ children }: { children: React.ReactNode }) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [warningText, setWarningText] = useState('You have unsaved changes. Are you sure you want to leave?');

  const blocker = useBlocker(hasUnsavedChanges);
  useEffect(() => {
    // prevents 2 things, navigation in the app via react-router and browser/tab closing or refresh
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
      }
    };

    if (blocker.state === "blocked") {
      const confirmLeave = window.confirm(warningText);
      if (confirmLeave) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges, warningText, blocker]);

  return (
    <context.Provider
      value={{
        hasUnsavedChanges,
        setHasUnsavedChanges,
        warningText,
        setWarningText
      }}
    >
      {children}
    </context.Provider>
  );
}


export function useChangesPreventNavigation() {
  const contextValue = useContext(context);
  return contextValue;
}
