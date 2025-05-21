import { ReactNode, createContext, useState, useRef } from "react";
import { AssessmentQuestion, Assessment, UserObj } from "@shared/types/general";

// types
type AssessmentPageType = {
  saving: boolean;
  setSaving: (v: boolean) => void;
  changed: boolean;
  setChanged: (v: boolean) => void;
  assessmentObj: Assessment;
  setAssessmentObj: (v: Assessment) => void;
  originalAssessment: React.MutableRefObject<AssessmentQuestion[]>;
  assessment: AssessmentQuestion[];
  setAssessment: (v: AssessmentQuestion[]) => void;
  assessmentUser: UserObj;
  setAssessmentUser: (v: UserObj) => void;
};

// createContext
export const AssessmentPageContext = createContext<AssessmentPageType>({
  saving: false,
  setSaving: (_) => {},
  changed: false,
  setChanged: (_) => {},
  assessmentObj: {},
  setAssessmentObj: (_) => {},
  // please check if this is correct
  originalAssessment: { current: [] },
  assessment: [],
  setAssessment: (_) => {},
  assessmentUser: {},
  setAssessmentUser: (_) => {},
});

// context provider
export const AssessmentPageProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [saving, setSaving] = useState(false);
  const [changed, setChanged] = useState(false);
  const [assessmentObj, setAssessmentObj] = useState<Assessment>({});
  const originalAssessment = useRef<AssessmentQuestion[]>([]);
  const [assessment, setAssessment] = useState<AssessmentQuestion[]>([]);
  const [assessmentUser, setAssessmentUser] = useState<UserObj>({});

  return (
    <AssessmentPageContext.Provider
      value={{
        saving,
        setSaving,
        changed,
        setChanged,
        assessmentObj,
        setAssessmentObj,
        originalAssessment,
        assessment,
        setAssessment,
        assessmentUser,
        setAssessmentUser,
      }}
    >
      {children}
    </AssessmentPageContext.Provider>
  );
};
