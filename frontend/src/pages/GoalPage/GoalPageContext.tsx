import { GoalObj, UserObj } from "@shared/types/general";
import { createContext, useState, ReactNode } from "react";

type GoalPageType = {
  saving: boolean;
  setSaving: (v: boolean) => void;
  changed: boolean;
  setChanged: (v: boolean) => void;
  goal: GoalObj | boolean | undefined;
  setGoal: (v: GoalObj | boolean | undefined) => void;
  goalOwner: UserObj | boolean | undefined;
  setGoalOwner: (v: UserObj | boolean | undefined) => void;
};

export const GoalPageContext = createContext<GoalPageType>({
  saving: false,
  setSaving: (_) => {},
  changed: false,
  setChanged: (_) => {},
  goal: undefined,
  setGoal: (_) => {},
  goalOwner: undefined,
  setGoalOwner: (_) => {},
});
export const GoalPageProvider = ({ children }: { children: ReactNode }) => {
  const [saving, setSaving] = useState(false);
  const [changed, setChanged] = useState(false);
  const [goal, setGoal] = useState<GoalObj | boolean | undefined>(undefined);
  const [goalOwner, setGoalOwner] = useState<UserObj | boolean>();

  return (
    <GoalPageContext.Provider
      value={{
        saving,
        setSaving,
        changed,
        setChanged,
        goal,
        setGoal,
        goalOwner,
        setGoalOwner,
      }}
    >
      {children}
    </GoalPageContext.Provider>
  );
};
