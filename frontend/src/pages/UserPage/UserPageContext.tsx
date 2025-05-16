import { createContext, ReactNode, useState } from "react";
import { ClientSocketUser } from "../../features/ClientSocket/ClientSocket";
import { MentorshipRequestObj } from "@shared/types/general";

type UserPageContextType = {
  user?: ClientSocketUser|undefined,
  setUser: (v: ClientSocketUser|undefined) => void
  changed: boolean,
  setChanged: (v: boolean) => void,
  saving: boolean,
  setSaving: (v: boolean) => void,
  existingIncomingMentorshipRequest: MentorshipRequestObj | "loading" | undefined,
  setExistingIncomingMentorshipRequest: (v: MentorshipRequestObj|'loading') => void
};

export const UserPageContext = createContext<UserPageContextType>({
  setUser: (_) => {},
  changed: false,
  setChanged: (_) => {},
  saving: false,
  setSaving: (_) => {},
  existingIncomingMentorshipRequest: undefined,
  setExistingIncomingMentorshipRequest: (_) => {}
});

export const UserPageContextProvider = ({ children }: { children?: ReactNode }) => {
  const [userPageUser, setUserPageUser] = useState<ClientSocketUser|undefined>(undefined);
  const [changed, setChanged] = useState(false);
  const [saving, setSaving] = useState(false);
  const [existingIncomingMentorshipRequest, setExistingIncomingMentorshipRequest] = useState<MentorshipRequestObj | "loading">('loading');
  return (
    <UserPageContext.Provider value={{ user: userPageUser, setUser: setUserPageUser, changed, setChanged, saving, setSaving, existingIncomingMentorshipRequest, setExistingIncomingMentorshipRequest }}>
      {children}
    </UserPageContext.Provider>
  )
}
