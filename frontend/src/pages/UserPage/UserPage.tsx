import { useDispatch, useSelector } from "react-redux";
import { ReduxRootState } from "../../store";
import { useNavigate, useSearchParams } from "react-router-dom";
import React, { useContext, useEffect, useRef, useState } from "react";
import {
  ClientSocketUser,
  MyClientSocket,
} from "../../features/ClientSocket/ClientSocket";
import {
  AnyFunction,
  MentorshipRequestObj,
  MentorshipRequestResponseAction,
  Months,
  ObjectAny,
  SocialType,
  SocialTypes,
} from "../../scripts/types";
import {
  ArrowBigDown,
  ArrowBigUp,
  Globe,
  Pencil,
  Trash,
  X,
  XIcon,
} from "lucide-react";
import { IoChatbubbleOutline } from "react-icons/io5";
import {
  closeDialog,
  DialogInput,
  setDialog,
} from "../../features/Dialog/DialogSlice";
import { FaDiscord, FaFacebook, FaGithub, FaHackerrank, FaInstagram, FaLinkedin, FaStackOverflow, FaTwitter, FaYoutube } from "react-icons/fa";
import { getMonthName, getMonthNumber, sleep } from "../../scripts/tools";
import MinimalisticInput from "../../components/MinimalisticInput/MinimalisticInput";
import MinimalisticButton from "../../components/MinimalisticButton/MinimalisticButton";
import { setAlert } from "../../features/Alert/AlertSlice";
import { useChangeUsernameWithDialog } from "../../hooks/UseChangeUsername";
import { isMentorshipRequestResponseAction } from "../../scripts/validation";
import { SaveButtonFixed } from "../../components/SaveButtonFixed/SaveButtonFixed";
import MinimalisticTextArea from "../../components/MinimalisticTextArea/MinimalisticTextArea";
import useChatWithUser from "../../hooks/UseChatWithUser/UseChatWithUser";
import { UserPageContext, UserPageContextProvider } from "./UserPageContext";
import { placeholderPreviewPicture } from "../../features/Chat/Chat";

export default function UserPage() {
  return (
    <UserPageContextProvider>
      <UserPageWithContext />
    </UserPageContextProvider>
  );
}

function UserPageWithContext() {
  const [params, _] = useSearchParams();
  const navigate = useNavigate();
  const id = params.get("id");

  // TODO: add changedValues state to upload only changed values.
  const originalUser = useRef<ClientSocketUser | undefined>();
  const { user, setUser, saving, setSaving, changed, setChanged } =
    useContext(UserPageContext);
  const { ready, user: self } = useSelector(
    (store: ReduxRootState) => store.ClientSocket
  );
  const dispatch = useDispatch();

  useEffect(() => {
    async function GetUser() {
      if (!id || !ready) {
        return;
      }
      setSaving(false);
      setChanged(false);
      setUser(undefined);
      MyClientSocket?.GetUser(id, (d: unknown) => {
        if (!d || typeof d != "object") {
          return;
        }
        setUser(d);
        originalUser.current = d;
      });
    }
    GetUser();
  }, [id, ready, self]);

  const { id: selfUserID } = self || {};
  const CanMakeChanges = selfUserID == id;

  function handleReset() {
    setChanged(false);
    setUser(originalUser.current);
  }

  function HandleSave() {
    if (!changed || saving || !user) {
      return;
    }

    dispatch(
      setDialog({
        title: "Update Profile",
        subtitle:
          "Saving overwrites current profile settings. Continue? (This cannot be undone)",
        buttons: [
          {
            text: "Yes",
            onClick: () => {
              setSaving(true);
              dispatch(closeDialog());
              MyClientSocket?.updateProfile(
                { ...user, username: undefined },
                (v: boolean) => {
                  setSaving(false);
                  if (!v) {
                    return;
                  }
                  setChanged(false);
                  dispatch(
                    setAlert({
                      title: "Saved",
                      body: "Successfully saved changes",
                    })
                  );
                  originalUser.current = user;
                }
              );
            },
          },
        ],
        buttonContainerStyle: {
          width: "100%",
          display: "flex",
          justifyContent: "end",
        },
      })
    );
  }

  function setSocials(newSocials: ObjectAny[]) {
    setUser({
      ...user,
      socials: newSocials,
    });
    setChanged(true);
  }

  function setBio(bio: string) {
    if (bio.length > 200) {
      bio = bio.substring(0, 200);
    }
    setUser({
      ...user,
      bio: bio,
    });
    setChanged(true);
  }

  function setEducation(newEducation: ObjectAny[]) {
    setUser({
      ...user,
      education: newEducation,
    });
    setChanged(true);
  }

  function setCertifications(newCertifications: ObjectAny[]) {
    setUser({
      ...user,
      certifications: newCertifications,
    });
    setChanged(true);
  }

  function setExperience(newExperience: ObjectAny[]) {
    setUser({
      ...user,
      experience: newExperience,
    });
    setChanged(true);
  }

  function setProjects(newProjects: ObjectAny[]) {
    setUser({
      ...user,
      projects: newProjects,
    });
    setChanged(true);
  }

  function setSoftSkills(newSoftSkills: string[]) {
    setUser({
      ...user,
      softSkills: newSoftSkills,
    });
    setChanged(true);
  }

  if (!self) {
    return <p>Waiting for your data...</p>;
  }

  if (!id) {
    return <p>Uh oh, no id</p>;
  }

  if (!user) {
    return <p>Loading...</p>;
  }

  const {
    socials,
    experience,
    education,
    certifications,
    projects,
    softSkills,
    bio,
  } = user;

  return (
    <div className={"pageBase"}>
      <MinimalisticButton
        style={{
          fontSize: "0.8rem",
        }}
        onClick={() => navigate(-1)}
      >
        {"<"} Back
      </MinimalisticButton>
      <div style={{ marginTop: "1rem" }} />
      <TopSection />
      <UserStuff />
      <BioSection bio={bio} setBio={setBio} disabled={!CanMakeChanges} />
      <SocialSection
        socials={socials}
        setSocials={setSocials}
        disabled={!CanMakeChanges}
      />
      <EducationSection
        education={education}
        setEducation={setEducation}
        disabled={!CanMakeChanges}
      />
      <CertificationSection
        certifications={certifications}
        setCertifications={setCertifications}
        disabled={!CanMakeChanges}
      />
      <ExperienceSection
        experience={experience}
        setExperience={setExperience}
        disabled={!CanMakeChanges}
      />
      <ProjectSection
        projects={projects}
        setProjects={setProjects}
        disabled={!CanMakeChanges}
      />
      <SoftSkillSection
        softSkills={softSkills}
        setSoftSkills={setSoftSkills}
        disabled={!CanMakeChanges}
      />
      <div style={{ height: "10vh" }} />
      {CanMakeChanges && (
        <SaveButtonFixed
          disabled={!CanMakeChanges}
          saving={saving}
          show={changed}
          onSave={HandleSave}
          onReset={handleReset}
        />
      )}
    </div>
  );
}

function UserStuff() {
  const navigate = useNavigate();
  const { user, existingIncomingMentorshipRequest } =
    useContext(UserPageContext);
  const { user: self } = useSelector(
    (store: ReduxRootState) => store.ClientSocket
  );

  if (!user) {
    return;
  }
  const allowedToViewAssessments =
    user.id == self?.id ||
    user.mentorID == self?.id ||
    (existingIncomingMentorshipRequest != "loading" &&
      existingIncomingMentorshipRequest);
  const { fName } = user;
  return (
    allowedToViewAssessments && (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "start",
          // backgroundColor: "#292929",
          // padding: "1rem",
          marginTop: "0.5rem",
          borderRadius: "0.5rem",
        }}
      >
        <span style={{ fontSize: "1.25rem" }}>
          {fName}
          {fName?.charAt(fName.length - 1) == "s" ? "'" : "'s"} Stuff
        </span>
        <div style={{ display: "flex", marginLeft: 10, paddingTop: 5 }}>
          {
            <MinimalisticButton
              style={{
                fontSize: "0.8rem",
              }}
              onClick={() =>
                navigate(`/app/assessments?id=${user.id}&origin=user`)
              }
            >
              Assessments {">"}
            </MinimalisticButton>
          }
          <MinimalisticButton
            style={{
              marginLeft: 10,
              fontSize: "0.8rem",
            }}
            onClick={() => navigate(`/app/goals?id=${user.id}&origin=user`)}
          >
            Goals {">"}
          </MinimalisticButton>
        </div>
      </div>
    )
  );
}

function NameSection({
  fName,
  mName,
  lName,
  setName,
  disabled = true,
}: {
  fName?: string;
  mName?: string;
  lName?: string;
  setName?: AnyFunction;
  disabled?: boolean;
}) {
  function handleNameChange(fN?: string, mN?: string, lN?: string) {
    if (disabled || !setName) {
      return;
    }
    setName(fN || "", mN, lN || "");
  }

  const fnameInputRef = useRef<HTMLInputElement>(null);

  const handlePencilClick = () =>{
    if (fnameInputRef.current){
      fnameInputRef.current.focus();
    }
  }
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {/* <p
      style={{
        color: "white",
        fontSize: "1.5rem",
        margin: 0,
        marginBottom: -5,
      }}
    >
      {fName} {mName} {lName}
    </p> */}
      <MinimalisticInput
        ref={fnameInputRef}
        onChange={(val) => handleNameChange(val, mName, lName)}
        disabled={disabled}
        style={{
          fontSize: "1.5rem",
          minWidth: "1.25rem",
          marginRight: "0.5rem",
        }}
        value={fName}
      />
      {(mName?.trim() || !disabled) && (
        <MinimalisticInput
          onChange={(val) => handleNameChange(fName, val, lName)}
          disabled={disabled}
          value={mName}
          style={{
            fontSize: "1.5rem",
            minWidth: "1.25rem",
            marginRight: "0.5rem",
          }}
        />
      )}
      <MinimalisticInput
        onChange={(val) => handleNameChange(fName, mName, val)}
        disabled={disabled}
        value={lName}
        style={{ fontSize: "1.5rem", minWidth: "1.25rem" }}
      />
      {!disabled && (
        <Pencil 
        size={"1.25rem"} 
        style={{ marginLeft: "0.5rem", cursor:"pointer" }}
        onClick={handlePencilClick}
         />
      )}
    </div>
  );
}

function SoftSkillSection({
  softSkills,
  setSoftSkills,
  disabled = true,
}: {
  softSkills?: string[];
  setSoftSkills: AnyFunction;
  disabled?: boolean;
}) {
  const [inputSS, setInputSS] = useState("");
  const dispatch = useDispatch();
  function handleAddSoftSkill() {
    let softSkill = inputSS;
    softSkill = softSkill.trim();
    if (softSkill.length < 3) {
      dispatch(
        setAlert({
          title: "Invalid soft skill",
          body: "Soft skill is too short",
        })
      );
      return;
    }
    const newSoftSkills = [...(softSkills || [])];
    newSoftSkills.push(softSkill);
    setSoftSkills(newSoftSkills);
    setInputSS("");
  }

  function handleRemoveSoftSkill(sIndex: number) {
    if (!softSkills || softSkills.length == 0) {
      return;
    }
    const newSoftSkills = [...softSkills];
    newSoftSkills.splice(sIndex, 1);
    setSoftSkills(newSoftSkills);
  }

  return (
    <>
      <div style={{ display: "flex", alignItems: "center" }}>
        <p style={{ color: "white", fontSize: "1.25rem", margin: 0 }}>
          Soft Skills
        </p>
        {!disabled && <Pencil style={{ marginLeft: 5 }} size={"1rem"} />}
      </div>
      <div
        style={{
          marginLeft: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "start",
        }}
      >
        {softSkills && softSkills.length > 0 && (
          <div
            style={{
              display: "flex",
              padding: 5,
              border: "1px solid #fff4",
              borderRadius: 15,
              marginBottom: 10,
              flexWrap: "wrap",
              maxWidth: "80vw",
            }}
          >
            {softSkills?.map((softSkill, sIndex) => {
              return (
                <SoftSkill
                  onClose={() => handleRemoveSoftSkill(sIndex)}
                  key={`sS_${sIndex}`}
                  style={{ margin: 5 }}
                  disabled={disabled}
                >
                  {softSkill}
                </SoftSkill>
              );
            })}
          </div>
        )}
        {(!softSkills || softSkills.length == 0) && (
          <p style={{ margin: 0, opacity: 0.5 }}>No soft skills</p>
        )}
        {!disabled && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddSoftSkill();
            }}
            style={{ marginTop: 5, display: "flex" }}
          >
            <input
              style={{
                backgroundColor: "transparent",
                fontSize: "1rem",
                border: "1px solid #fffd",
                padding: 5,
                paddingLeft: 10,
                width: "10rem",
                borderRadius: 10,
                color: "white",
              }}
              placeholder="Add soft skill"
              value={inputSS}
              onChange={(e) => setInputSS(e.target.value)}
            />
            <MinimalisticButton
              style={{ marginLeft: "0.5rem", fontSize: "0.8rem" }}
            >
              Add Soft Skill +
            </MinimalisticButton>
          </form>
        )}
      </div>
    </>
  );
}

function TopSection() {
  const changeUsernameWithDialog = useChangeUsernameWithDialog();
  const { user, setUser, setChanged } = useContext(UserPageContext);
  const { user: self } = useSelector(
    (store: ReduxRootState) => store.ClientSocket
  );
  if (!user || !self) {
    return;
  }
  const CanMakeChanges = self.id == user.id;
  function setName(fName: string, mName: string | undefined, lName: string) {
    setUser({
      ...user,
      fName: fName.trim(),
      mName: mName?.trim(),
      lName: lName.trim(),
    });
    setChanged(true);
  }

  function HandleChangeUsername() {
    if (!CanMakeChanges) {
      return;
    }
    changeUsernameWithDialog((v?: boolean, newUsername?: string) => {
      if (!v || !newUsername) {
        return;
      }
      setUser({
        ...user,
        username: newUsername,
      });
    });
  }

  const { fName, mName, lName, displayPictureURL, username } = user;
  return (
    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
      <img
        src={displayPictureURL || placeholderPreviewPicture}
        style={{
          borderRadius: "50%",
          width: "8rem",
          height: "8rem",
          border: "1px solid #fff3",
        }}
      />
      <div>
        <NameSection
          fName={fName}
          mName={mName}
          lName={lName}
          setName={setName}
          disabled={!CanMakeChanges}
        />
        <div style={{ display: "flex", alignItems: "center" }}>
          <span
            onClick={HandleChangeUsername}
            style={{ marginLeft: "0.5rem", opacity: 0.5, cursor: "pointer" }}
          >
            @{username}
          </span>
          {CanMakeChanges && (
            <Pencil 
            onClick={HandleChangeUsername}
            style={{ marginLeft: "0.5rem", cursor:"pointer" }} 
            size={"1rem"}
            />
          )}
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <ChatButton />
          <RequestMentorButton />
          <MenteeButton />
        </div>
      </div>
    </div>
  );
}

function ChatButton() {
  const chatWithuser = useChatWithUser();
  const { user } = useContext(UserPageContext);
  const { user: self } = useSelector(
    (store: ReduxRootState) => store.ClientSocket
  );
  if (!user || !self || user.id == self.id) {
    return;
  }
  function handleChatClick() {
    if (!user || !user.id) {
      return;
    }
    chatWithuser(user.id);
  }
  return (
    <MinimalisticButton
      style={{ fontSize: "1rem", display: "flex", alignItems: "center" }}
      onClick={handleChatClick}
    >
      Chat{" "}
      <IoChatbubbleOutline
        style={{ marginLeft: 5 }}
        strokeWidth={4}
        size={"1rem"}
      />
    </MinimalisticButton>
  );
}

const RequestMentorButtonStyle: React.CSSProperties = {
  fontSize: "1rem",
  display: "flex",
  alignItems: "center",
};

function RequestMentorButton() {
  const dispatch = useDispatch();
  const { user } = useContext(UserPageContext);
  const { user: self } = useSelector(
    (store: ReduxRootState) => store.ClientSocket
  );
  const [existingMentorshipRequestObj, setExistingMentorshipRequestObj] =
    useState<MentorshipRequestObj | "loading">("loading");

  useEffect(() => {
    if (
      !MyClientSocket ||
      !user ||
      !user.id ||
      !self ||
      !self.id ||
      self.id == user.id
    ) {
      return;
    }
    MyClientSocket.GetMentorshipRequestBetweenMentorMentee(
      user?.id,
      self.id,
      (v) => {
        if (typeof v == "boolean") {
          return;
        }
        setExistingMentorshipRequestObj(v);
      }
    );
  }, [self, user]);

  if (!user || !self || self.id == user.id) {
    return;
  }

  if (!user.isMentor) {
    return;
  }

  if (existingMentorshipRequestObj == "loading") {
    return;
  }

  // TODO: Refactor structure of request mentor and mentee section
  function handleRemoveMentor() {
    if (!UserIsOurMentor) {
      return;
    }

    dispatch(
      setDialog({
        title: "Remove Mentor",
        subtitle:
          "This will remove this person as your mentor. Are you sure you want to do that?",
        buttons: [
          {
            text: "Remove Mentor",
            useDisableTill: true,
            onClick: (_, cb) => {
              if (!MyClientSocket) {
                cb && cb();
                return;
              }
              MyClientSocket.RemoveMentor((_: boolean) => {
                cb && cb();
                dispatch(closeDialog());
              });
            },
          },
        ],
      })
    );
  }

  function handleCancelMentorshipRequest() {
    if (
      !existingMentorshipRequestObj ||
      existingMentorshipRequestObj == "loading"
    ) {
      return;
    }

    dispatch(
      setDialog({
        title: "Cancel Mentorship request",
        subtitle: "This will cancel your mentorship request",
        buttons: [
          {
            text: "Cancel Request",
            useDisableTill: true,
            onClick: (_, cb) => {
              if (
                !MyClientSocket ||
                !existingMentorshipRequestObj ||
                !existingMentorshipRequestObj.id
              ) {
                cb && cb();
                return;
              }
              MyClientSocket.DoMentorshipRequestAction(
                existingMentorshipRequestObj.id,
                "cancel",
                (_: boolean) => {
                  cb && cb();
                  dispatch(closeDialog());
                }
              );
            },
          },
        ],
      })
    );
  }

  function handleRequestMentorshipClick() {
    if (!user || !self) {
      return;
    }
    dispatch(
      setDialog({
        title: `Request Mentorship from ${user.fName}`,
        subtitle: `You sure you want to send a mentorship request to ${user.fName} ${user.lName}?`,
        buttons: [
          {
            text: "Yes",
            useDisableTill: true,
            onClick: (_, enableCallback) => {
              if (!MyClientSocket || !user || !user.id) {
                return;
              }
              dispatch(closeDialog());
              MyClientSocket.SendMentorshipRequest(user.id, (v: boolean) => {
                enableCallback && enableCallback();
                if (v) {
                  setTimeout(() => {
                    dispatch(
                      setAlert({
                        title: "Request Sent!",
                        body: `Your request has been set to ${user?.fName}`,
                      })
                    );
                  }, 250);
                }
              });
            },
          },
        ],
      })
    );
  }

  const UserIsOurMentor = self.mentorID == user.id;
  let buttonElement: JSX.Element | undefined;

  if (self.mentorID && self.mentorID != user.id) {
    buttonElement = (
      <MinimalisticButton
        style={RequestMentorButtonStyle}
        disabled={true}
        // onClick={handleChatClick}
      >
        You have a mentor
      </MinimalisticButton>
    );
  } else if (UserIsOurMentor) {
    buttonElement = (
      <MinimalisticButton
        style={RequestMentorButtonStyle}
        onClick={handleRemoveMentor}
      >
        Remove Mentor{" "}
        <X
          style={{ marginLeft: "0.5rem", marginRight: "-0.3rem" }}
          size={"1.1rem"}
        />
      </MinimalisticButton>
    );
  } else if (!user.acceptingMentees) {
    buttonElement = (
      <MinimalisticButton
        style={RequestMentorButtonStyle}
        disabled={true}
        // onClick={handleChatClick}
      >
        Not Accepting Mentees
      </MinimalisticButton>
    );
  } else if (!existingMentorshipRequestObj) {
    buttonElement = (
      <MinimalisticButton
        style={RequestMentorButtonStyle}
        onClick={handleRequestMentorshipClick}
      >
        Request Mentorship
      </MinimalisticButton>
    );
  } else if (existingMentorshipRequestObj) {
    buttonElement = (
      <MinimalisticButton
        style={RequestMentorButtonStyle}
        onClick={handleCancelMentorshipRequest}
      >
        Cancel Mentorship Request
      </MinimalisticButton>
    );
  }

  return buttonElement;
}

function MenteeButton() {
  const {
    user,
    existingIncomingMentorshipRequest,
    setExistingIncomingMentorshipRequest,
  } = useContext(UserPageContext);
  const { user: self } = useSelector(
    (store: ReduxRootState) => store.ClientSocket
  );
  const dispatch = useDispatch();

  // fetches existing incoming mentorship request from user.
  useEffect(() => {
    if (
      !MyClientSocket ||
      !user ||
      !user.id ||
      !self ||
      !self.id ||
      self.id == user.id
    ) {
      return;
    }
    setExistingIncomingMentorshipRequest("loading");
    MyClientSocket.GetMentorshipRequestBetweenMentorMentee(
      self.id,
      user?.id,
      (v) => {
        if (typeof v == "boolean") {
          return;
        }
        setExistingIncomingMentorshipRequest(v);
      }
    );
  }, [self, user]);

  if (!user || !self || self.id == user.id) {
    return;
  }

  if (existingIncomingMentorshipRequest == "loading") {
    return;
  }

  function handleRemoveMentee() {
    if (!UserIsOurMentee) {
      return;
    }

    dispatch(
      setDialog({
        title: "Remove Mentee",
        subtitle: `${user?.fName} will no longer be your mentee`,
        buttons: [
          {
            text: "Remove Mentee",
            useDisableTill: true,
            onClick: (_, cb) => {
              if (!MyClientSocket || !user || !user.id) {
                cb && cb();
                return;
              }
              // TODO: add target menteeID
              MyClientSocket.RemoveMentee(user.id, (_: boolean) => {
                cb && cb();
                dispatch(closeDialog());
              });
            },
          },
        ],
      })
    );
  }

  function handleRespondToMentorshipRequest() {
    if (!existingIncomingMentorshipRequest) {
      return;
    }
    dispatch(
      setDialog({
        title: "Accept mentorship request",
        subtitle: `${user?.fName} ${user?.lName} is requesting your mentorship`,
        subTitleStyle: { minHeight: "3rem" },
        buttons: [
          {
            text: "Decline",
            onClick: (_, cb) => {
              handleRespondToRequest("decline", cb);
              dispatch(closeDialog());
            },
          },
          {
            text: "Accept",
            onClick: (_, cb) => {
              handleRespondToRequest("accept", cb);
              dispatch(closeDialog());
            },
          },
        ],
        buttonContainerStyle: {
          justifyContent: "space-between",
          width: "100%",
        },
      })
    );
  }

  function handleRespondToRequest(
    response: MentorshipRequestResponseAction,
    callback?: Function
  ) {
    if (
      !isMentorshipRequestResponseAction(response) ||
      !MyClientSocket ||
      !existingIncomingMentorshipRequest ||
      existingIncomingMentorshipRequest == "loading" ||
      !existingIncomingMentorshipRequest.id
    ) {
      callback && callback(false);
      setTimeout(() => {
        dispatch(
          setAlert({ title: "Action failed", body: "Couldn't do that." })
        );
      }, 250);
      return;
    }

    MyClientSocket.DoMentorshipRequestAction(
      existingIncomingMentorshipRequest.id,
      response
    );
  }

  const UserIsOurMentee = self.id == user.mentorID;
  let buttonElement: JSX.Element | undefined;

  if (existingIncomingMentorshipRequest) {
    buttonElement = (
      <MinimalisticButton
        style={RequestMentorButtonStyle}
        onClick={handleRespondToMentorshipRequest}
      >
        View Mentee Request
      </MinimalisticButton>
    );
  } else if (UserIsOurMentee) {
    buttonElement = (
      <MinimalisticButton
        style={RequestMentorButtonStyle}
        onClick={handleRemoveMentee}
      >
        Remove Mentee{" "}
        <X
          style={{ marginLeft: "0.5rem", marginRight: "-0.3rem" }}
          size={"1.1rem"}
        />
      </MinimalisticButton>
    );
  }

  return buttonElement;
}

function ExperienceSection({
  experience,
  setExperience,
  disabled = true,
}: {
  experience?: ObjectAny[];
  setExperience?: AnyFunction;
  disabled?: boolean;
}) {
  function handleExperienceChange(index: number, dat: ObjectAny) {
    if (!setExperience || !experience) {
      return;
    }
    const { title: company, subtitle: position, description, range } = dat;
    const newExp = [...experience];
    newExp[index] = { company, position, description, range };
    setExperience(newExp);
  }

  function addExperience() {
    if (!setExperience) {
      return;
    }
    const newExp = [...(experience || [])];
    newExp.push({
      company: "Company name",
      position: "position",
      description: "Here's a description of your experience",
      range: { start: [1, 2000], end: [1, 2004] },
    });
    setExperience(newExp);
  }

  function removeExperience(eIndex: number) {
    if (!setExperience || !experience) {
      return;
    }
    const newExp = [...experience];
    newExp.splice(eIndex, 1);
    setExperience(newExp);
  }

  function moveExperience(index: number, up: boolean) {
    if (!experience || !setExperience) {
      return;
    }
    if ((index == experience.length - 1 && !up) || (index == 0 && up)) {
      return;
    }
    let targetIndex = index + (up ? -1 : 1);
    const newAssessment = [...experience];
    const temp = newAssessment[targetIndex];
    newAssessment[targetIndex] = newAssessment[index];
    newAssessment[index] = temp;
    setExperience(newAssessment);
  }

  return (
    <>
      <div style={{ display: "flex", alignItems: "center" }}>
        <p style={{ color: "white", fontSize: "1.25rem", margin: 0 }}>
          Experience
        </p>

        {!disabled && <Pencil style={{ marginLeft: 5 }} size={"1rem"} />}
      </div>
      <div style={{ marginLeft: 10 }}>
        {experience?.map((currentExperience, eIndex) => {
          const { company, position, description, range } = currentExperience;
          return (
            <ExperienceLikeSection
              key={`exp_${eIndex}`}
              title={company}
              subtitle={position}
              description={description}
              range={range}
              onChange={(dat: ObjectAny) => handleExperienceChange(eIndex, dat)}
              onMove={moveExperience}
              disabled={disabled}
              onDelete={() => removeExperience(eIndex)}
              index={eIndex}
              sectionSize={experience.length}
            />
          );
        })}
        {(!experience || experience.length == 0) && (
          <p style={{ margin: 0, opacity: 0.5 }}>No experience</p>
        )}
      </div>
      {!disabled && (
        <MinimalisticButton
          style={{ fontSize: "0.8rem", marginLeft: 10, marginTop: 5 }}
          onClick={addExperience}
        >
          Add Experience +
        </MinimalisticButton>
      )}
    </>
  );
}

function ProjectSection({
  projects,
  setProjects,
  disabled = true,
}: {
  projects?: ObjectAny[];
  setProjects?: AnyFunction;
  disabled?: boolean;
}) {
  function handleProjectChange(index: number, dat: ObjectAny) {
    if (!setProjects || !projects) {
      return;
    }
    const { title: name, subtitle: position, description, range } = dat;
    const newExp = [...projects];
    newExp[index] = { name, position, description, range };
    setProjects(newExp);
  }

  function addProject() {
    if (!setProjects) {
      return;
    }
    const newExp = [...(projects || [])];
    newExp.push({
      name: "Project name",
      position: "position",
      description: "Here's a description of your project",
      range: { start: [1, 2000], end: [1, 2004] },
    });
    setProjects(newExp);
  }

  function deleteProject(cIndex: number) {
    if (!setProjects || !projects) {
      return;
    }
    const newProjects = [...projects];
    newProjects.splice(cIndex, 1);
    setProjects(newProjects);
  }

  function moveProject(index: number, up: boolean) {
    if (!projects || !setProjects) {
      return;
    }
    if ((index == projects.length - 1 && !up) || (index == 0 && up)) {
      return;
    }
    let targetIndex = index + (up ? -1 : 1);
    const newAssessment = [...projects];
    const temp = newAssessment[targetIndex];
    newAssessment[targetIndex] = newAssessment[index];
    newAssessment[index] = temp;
    setProjects(newAssessment);
  }

  return (
    <>
      <div style={{ display: "flex", alignItems: "center" }}>
        <p style={{ color: "white", fontSize: "1.25rem", margin: 0 }}>
          Projects
        </p>
        {!disabled && <Pencil style={{ marginLeft: 5 }} size={"1rem"} />}
      </div>
      <div style={{ marginLeft: 10 }}>
        {projects?.map((project, pIndex) => {
          const { name, position, description, range } = project;
          return (
            <ExperienceLikeSection
              key={`project_${pIndex}`}
              title={name}
              subtitle={position}
              description={description}
              index={pIndex}
              sectionSize={projects.length}
              range={range}
              onMove={moveProject}
              onChange={(dat: ObjectAny) => handleProjectChange(pIndex, dat)}
              disabled={disabled}
              onDelete={() => deleteProject(pIndex)}
            />
          );
        })}
        {(!projects || projects.length == 0) && (
          <p style={{ margin: 0, opacity: 0.5 }}>No projects</p>
        )}
      </div>
      {!disabled && (
        <MinimalisticButton
          style={{ fontSize: "0.8rem", marginLeft: 10, marginTop: 5 }}
          onClick={addProject}
        >
          Add Project +
        </MinimalisticButton>
      )}
    </>
  );
}

function CertificationSection({
  certifications,
  setCertifications,
  disabled = true,
}: {
  certifications?: ObjectAny[];
  setCertifications?: AnyFunction;
  disabled?: boolean;
}) {
  function handleCertificationChange(
    cIndex: number,
    newCertificationData: ObjectAny
  ) {
    if (!certifications || !setCertifications) {
      return;
    }
    const newCerts = [...certifications];
    const { title, subtitle } = newCertificationData;
    newCerts[cIndex] = { name: title, issuingOrg: subtitle };
    setCertifications(newCerts);
  }

  function handleAddCertification() {
    if (!setCertifications) {
      return;
    }
    const newCerts = [...(certifications || [])];
    newCerts.push({
      name: "New Certification",
      issuingOrg: "Issuing Organization",
    });
    setCertifications && setCertifications(newCerts);
  }

  function deleteCertification(cIndex: number) {
    if (!setCertifications || !certifications) {
      return;
    }
    const newCerts = [...certifications];
    newCerts.splice(cIndex, 1);
    setCertifications(newCerts);
  }

  function moveCertification(index: number, up: boolean) {
    if (!certifications || !setCertifications) {
      return;
    }
    if ((index == certifications.length - 1 && !up) || (index == 0 && up)) {
      return;
    }
    let targetIndex = index + (up ? -1 : 1);
    const newAssessment = [...certifications];
    const temp = newAssessment[targetIndex];
    newAssessment[targetIndex] = newAssessment[index];
    newAssessment[index] = temp;
    setCertifications(newAssessment);
  }

  return (
    <>
      <div style={{ display: "flex", alignItems: "center" }}>
        <p style={{ color: "white", fontSize: "1.25rem", margin: 0 }}>
          Certifications
        </p>
        {!disabled && <Pencil style={{ marginLeft: 5 }} size={"1rem"} />}
      </div>
      <div style={{ marginLeft: 10 }}>
        {certifications?.map((cert, cIndex) => {
          const { name, issuingOrg } = cert;
          return (
            <ExperienceLikeSection
              key={`cert_${cIndex}`}
              title={name}
              subtitle={issuingOrg}
              onChange={(dat: ObjectAny) =>
                handleCertificationChange(cIndex, dat)
              }
              index={cIndex}
              sectionSize={certifications.length}
              onMove={moveCertification}
              hideRange={true}
              hideDescription={true}
              disabled={disabled}
              onDelete={() => deleteCertification(cIndex)}
            />
          );
        })}
        {(!certifications || certifications.length == 0) && (
          <p style={{ margin: 0, opacity: 0.5 }}>No certifications</p>
        )}
      </div>
      {!disabled && (
        <MinimalisticButton
          style={{ fontSize: "0.8rem", marginLeft: 10, marginTop: 5 }}
          onClick={handleAddCertification}
        >
          Add Certification +
        </MinimalisticButton>
      )}
    </>
  );
}

function EducationSection({
  education,
  setEducation,
  disabled = true,
}: {
  education?: ObjectAny[];
  setEducation: AnyFunction;
  disabled?: boolean;
}) {
  function handleEducationOnChange(index: number, newEduObjRaw: ObjectAny) {
    if (!education) {
      return;
    }

    const { title, description, subtitle, range } = newEduObjRaw;
    if (!title || !description || !subtitle || !range) {
      return;
    }
    if (education.length <= index || index < 0) {
      return;
    }
    const newEducation = [...education];
    newEducation[index] = {
      school: title,
      degree: subtitle,
      fieldOfStudy: description,
      range,
    };
    setEducation(newEducation);
  }

  function handleAddEducationClick() {
    const newEducation = [...(education || [])];
    newEducation.push({
      school: "Your school",
      degree: "Your Degree",
      fieldOfStudy: "Major, description, etc.",
      range: { start: [1, 2000], end: [1, 2004] },
    });
    setEducation(newEducation);
  }

  function deleteEducation(eduIndex: number) {
    if (!education || !setEducation) {
      return;
    }
    const newEducation = [...education];
    newEducation.splice(eduIndex, 1);
    setEducation(newEducation);
  }

  function moveEducation(index: number, up: boolean) {
    if (!education || !setEducation) {
      return;
    }
    if ((index == education.length - 1 && !up) || (index == 0 && up)) {
      return;
    }
    let targetIndex = index + (up ? -1 : 1);
    const newEducation = [...education];
    const temp = newEducation[targetIndex];
    newEducation[targetIndex] = newEducation[index];
    newEducation[index] = temp;
    setEducation(newEducation);
  }

  return (
    <>
      <div style={{ display: "flex", alignItems: "center" }}>
        <p style={{ color: "white", fontSize: "1.25rem", margin: 0 }}>
          Education
        </p>
        {!disabled && <Pencil style={{ marginLeft: 5 }} size={"1rem"} />}
      </div>
      <div style={{ marginLeft: 10 }}>
        {education?.map((edu, eduIndex) => {
          const { school, degree, fieldOfStudy, range } = edu;
          return (
            <ExperienceLikeSection
              key={`edu_${eduIndex}`}
              title={school}
              subtitle={degree}
              description={fieldOfStudy}
              range={range}
              index={eduIndex}
              sectionSize={education.length}
              onMove={moveEducation}
              onChange={(dat: ObjectAny) =>
                handleEducationOnChange(eduIndex, dat)
              }
              onDelete={() => deleteEducation(eduIndex)}
              disabled={disabled}
            />
          );
        })}
        {/* <ExperienceLikeSection
          title={"University of Houston Downtown"}
          subtitle={"B.S."}
          description={"Computer Science"}
          range={{ start: [2, 2022], end: undefined }}
          onChange={(dat: ObjectAny) => handleEducationOnChange(0, dat)}
        /> */}
        {(!education || education.length == 0) && (
          <p style={{ margin: 0, opacity: 0.5 }}>No education</p>
        )}
      </div>
      {!disabled && (
        <MinimalisticButton
          style={{ marginLeft: 10, fontSize: "0.8rem", marginTop: 5 }}
          onClick={handleAddEducationClick}
        >
          Add Education +
        </MinimalisticButton>
      )}
    </>
  );
}

function SocialSection({
  socials,
  setSocials,
  disabled = true,
}: {
  socials?: ObjectAny[];
  setSocials: AnyFunction;
  disabled?: boolean;
}) {
  const dispatch = useDispatch();
  function handleAddSocialClick() {
    dispatch(
      setDialog({
        title: "Add Social",
        subtitle: "Choose an icon type and enter a url.",
        inputs: [
          {
            name: "icon",
            label: "Icon",
            type: "select",
            selectOptions: SocialTypes,
            initialValue: SocialTypes[0],
          },
          {
            name: "url",
            label: "Url",
            type: "text",
          },
        ],
        buttons: [
          {
            text: "Cancel",
          },
          {
            text: "Add",
            onClick: (params) => {
              handleAddSocialSubmit(params);
              dispatch(closeDialog());
            },
          },
        ],
      })
    );
  }

  async function handleEditSocialClick(sIndex: number) {
    await sleep(100);
    if (!socials) {
      return;
    }
    const currentSocial = socials[sIndex];
    if (!currentSocial) {
      return;
    }
    dispatch(
      setDialog({
        title: "Edit Social",
        inputs: [
          {
            name: "icon",
            label: "Icon",
            type: "select",
            selectOptions: SocialTypes,
            initialValue: currentSocial.type,
          },
          {
            name: "url",
            label: "Url",
            type: "text",
            initialValue: currentSocial.url,
          },
        ],
        buttons: [
          {
            text: "Cancel",
          },
          {
            text: "Confirm Changes",
            onClick: (params) => {
              handleEditSocialSubmit(params, sIndex);
              dispatch(closeDialog());
            },
          },
        ],
      })
    );
  }

  function handleAddSocialSubmit(payload: ObjectAny) {
    if (typeof payload != "object") {
      return;
    }
    const { url, icon } = payload;
    if (!url || !icon) {
      dispatch(
        setAlert({
          title: "Invalid Social",
          body: "Your social is missing a url or icon."
        })
      );
      return;
    }
    const newSocial = { type: icon, url };
    setSocials(socials ? [...socials, newSocial] : [newSocial]);
  }

  function handleEditSocialSubmit(payload: ObjectAny, index: number) {
    if (!socials || index < 0 || socials.length <= index) {
      dispatch(
        setAlert({
          title: "Operation failed",
          body: "That social does not exist.",
        })
      );
      return;
    }
    const newSocials = [...socials];
    const { url, icon } = payload;
    const newSocial = { type: icon, url };
    newSocials[index] = newSocial;
    setSocials(newSocials);
  }

  function handleRemoveSocial(index: number) {
    if (!socials || index < 0 || socials.length <= index) {
      dispatch(
        setAlert({
          title: "Operation failed",
          body: "That social does not exist.",
        })
      );
      return;
    }
    const newSocials = [...socials];
    newSocials.splice(index, 1);
    setSocials(newSocials);
  }

  return (
    <>
      <div style={{ display: "flex", alignItems: "center" }}>
        <p style={{ color: "white", fontSize: "1.25rem", margin: 0 }}>
          Socials
        </p>
        {!disabled && <Pencil style={{ marginLeft: 5 }} size={"1rem"} />}
      </div>
      <div style={{ marginLeft: 10, display: 'flex' }}>
        {socials?.map((social, socialIndex) => {
          const { type, url } = social;
          return (
            <SocialTile
              key={`social_${socialIndex}`}
              canRemove={!disabled}
              onRemove={() => handleRemoveSocial(socialIndex)}
              canEdit={!disabled}
              onEdit={() => handleEditSocialClick(socialIndex)}
              social={{ type: type, url: url }}
            />
          );
        })}
        {(!socials || socials.length == 0) && (
          <p style={{ margin: 0, opacity: 0.5 }}>No socials</p>
        )}
      </div>
      {!disabled && (
        <MinimalisticButton
          onClick={handleAddSocialClick}
          style={{ marginTop: 5, marginLeft: 10, fontSize: "0.8rem" }}
        >
          Add Social +
        </MinimalisticButton>
      )}
    </>
  );
}

function BioSection({
  bio,
  setBio,
  disabled = true,
}: {
  bio?: string;
  setBio?: AnyFunction;
  disabled?: boolean;
}) {
  return (
    <>
      <div style={{ borderRadius: "0.5rem", marginTop: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <p style={{ color: "white", fontSize: "1.25rem", margin: 0 }}>Bio</p>
          {!disabled && <Pencil style={{ marginLeft: 5 }} size={"1rem"} />}
        </div>
        {bio || !disabled ? (
          <MinimalisticTextArea
            placeholder={disabled ? "No bio" : "Your bio"}
            value={bio}
            onChange={(v) => setBio && setBio(v)}
            disabled={disabled}
          />
        ) : (
          <p
            style={{
              fontSize: "1rem",
              margin: 0,
              marginLeft: 10,
              opacity: 0.5,
            }}
          >
            No bio
          </p>
        )}
      </div>
    </>
  );
}

function SoftSkill({
  children,
  style,
  onClose,
  disabled = true,
}: {
  children?: React.ReactNode;
  style?: React.CSSProperties;
  onClose?: AnyFunction;
  disabled?: boolean;
}) {
  return (
    <span
      style={{
        padding: 5,
        paddingLeft: 10,
        paddingRight: 10,
        backgroundColor: "#444",
        borderRadius: 10,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        ...style,
      }}
    >
      <span
        style={{
          fontSize: "0.8 rem",
        }}
      >
        {children}
      </span>
      {!disabled && (
        <XIcon size={"1.25rem"} onClick={onClose} cursor={"pointer"} />
      )}
    </span>
  );
}

const CreateDateRangeDialogInputs = (
  startMonthIndex: number,
  startYear: number,
  endMonthIndex: number,
  endYear: number
): DialogInput[] => [
  {
    name: "startMonth",
    label: "Start Month",
    type: "select",
    selectOptions: Months,
    initialValue: getMonthName(startMonthIndex) || Months[0],
    inputStyle: { width: "10rem" },
  },
  {
    name: "startYear",
    label: "Start Year",
    type: "number",
    initialValue: startYear || 2000,
    containerStyle: { marginBottom: 30 },
    inputStyle: { width: "10rem" },
  },
  {
    name: "endMonth",
    label: "End Month",
    type: "select",
    selectOptions: Months,
    initialValue: getMonthName(endMonthIndex) || Months[0],
    inputStyle: { width: "10rem" },
  },
  {
    name: "endYear",
    label: "End Year",
    type: "number",
    initialValue: endYear || 2000,
    inputStyle: { width: "10rem" },
  },
  {
    name: "endIsCurrent",
    label: "End is Current?",
    type: "toggle",
    initialValue: !endYear,
    containerStyle: { marginBottom: 10 },
    inputStyle: { marginRight: 20 },
  },
];
function ExperienceLikeSection({
  title,
  subtitle,
  description,
  range,
  hideTitle,
  hideSubtitle,
  hideDescription,
  hideRange,
  onChange,
  disabled = true,
  onDelete,
  onMove,
  index,
  sectionSize
}: {
  title?: string;
  subtitle?: string;
  description?: string;
  range?: ObjectAny;
  onChange?: AnyFunction;
  disabled?: boolean;
  hideTitle?: boolean;
  hideSubtitle?: boolean;
  hideDescription?: boolean;
  hideRange?: boolean;
  onDelete: AnyFunction;
  onMove: (i: number, up: boolean) => void,
  index: number,
  sectionSize: number
}) {
  const dispatch = useDispatch();
  const { start, end } = range || {};

  const [startMonthIndex, startYear] = start || [null, null];
  const [endMonthIndex, endYear] = end || [null, null];

  function handleChangeSubmit(newExperienceLikeData: ObjectAny) {
    if (disabled) {
      return;
    }
    onChange && onChange(newExperienceLikeData);
  }

  function handleChangeRange() {
    if (disabled) {
      return;
    }
    dispatch(
      setDialog({
        title: `Change date range`,
        subtitle: `${title} ${subtitle}`,
        inputs: CreateDateRangeDialogInputs(
          startMonthIndex,
          startYear,
          endMonthIndex,
          endYear
        ),
        buttons: [
          {
            text: "Submit change",
            onClick: (params: ObjectAny) => {
              function AlertRangeError(msg: string) {
                dispatch(
                  setAlert({
                    title: "Invalid date range",
                    body: msg,
                  })
                );
              }
              const {
                startMonth,
                startYear: startYearRaw,
                endMonth,
                endYear: endYearRaw,
                endIsCurrent,
              } = params;

              const startYear = Number(startYearRaw);
              const endYear = Number(endYearRaw);

              const startMonthIndex = getMonthNumber(startMonth);

              let newObj: ObjectAny = {
                title,
                subtitle,
                description,
                range: {},
              };
              if (
                !startMonth ||
                !startYear ||
                typeof startMonthIndex != "number" ||
                typeof startYear != "number"
              ) {
                AlertRangeError("Start year or month is invalid");
                return;
              }

              newObj.range.start = [startMonthIndex, startYear];

              if (!endIsCurrent) {
                const endMonthIndex = getMonthNumber(endMonth);
                if (
                  !endMonthIndex ||
                  !endYear ||
                  typeof endMonthIndex != "number" ||
                  typeof endYear != "number"
                ) {
                  AlertRangeError("End year or month is invalid");
                  return;
                }
                newObj.range.end = [endMonthIndex, endYear];
              }
              dispatch(closeDialog());
              handleChangeSubmit(newObj);
            },
          },
        ],
      })
    );
  }

  function handleChangeTitle(newTitle: string) {
    if (disabled) {
      return;
    }
    onChange && onChange({ title: newTitle, subtitle, description, range });
  }

  function handleChangeSubtitle(newSub: string) {
    if (disabled) {
      return;
    }
    onChange && onChange({ title, subtitle: newSub, description, range });
  }

  function handleChangeDescription(newDesc: string) {
    if (disabled) {
      return;
    }
    onChange && onChange({ title, subtitle, description: newDesc, range });
  }

  return (
    <div style={{display: 'flex', justifyContent: 'start', alignItems: 'center', marginTop: '0.5rem'}}>
      {
              !disabled && 
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginRight: "0.25rem",
                gap: "0.2rem",
              }}
            >
              {index != 0 && (
                <div
                  onClick={() => onMove(index, true)}
                  style={{
                    padding: "0.25rem",
                    border: "1px solid #fff2",
                    backgroundColor: "#333",
                    borderTopLeftRadius: "0.5rem",
                    borderTopRightRadius: "0.5rem",
                    cursor: "pointer",
                  }}
                >
                  {<ArrowBigUp size={"1.5rem"} />}
                </div>
              )}
              {index != sectionSize - 1 && (
                <div
                  onClick={() => onMove(index, false)}
                  style={{
                    padding: "0.25rem",
                    border: "1px solid #fff2",
                    backgroundColor: "#333",
                    borderBottomLeftRadius: "0.5rem",
                    borderBottomRightRadius: "0.5rem",
                    cursor: "pointer",
                  }}
                >
                  {<ArrowBigDown size={"1.5rem"} />}
                </div>
              )}
            </div>
      }
    <div>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {!hideTitle && (
          <MinimalisticInput
            value={title}
            onChange={handleChangeTitle}
            style={{ fontWeight: "bold", minWidth: "0.5rem" }}
            disabled={disabled}
          />
        )}
        {!hideSubtitle && (
          <>
            <span style={{ marginLeft: "0.5rem", marginRight: "0.5rem" }}>
              |
            </span>
            <MinimalisticInput
              onChange={handleChangeSubtitle}
              style={{ minWidth: "1rem" }}
              value={subtitle}
              disabled={disabled}
            />
          </>
        )}
        {!hideRange && (
          <>
            <span style={{ marginLeft: "0.5rem", marginRight: "0.5rem" }}>
              |
            </span>
            <div
              style={{
                borderBottom: disabled ? "none" : "1px solid #fff4",
                cursor: !disabled ? "pointer" : "text",
              }}
              onClick={handleChangeRange}
            >
              {start && (
                <span>
                  {getMonthName(start[0])} {Math.abs(start[1])}{" "}
                  {start[1] < 0 ? "B.C." : start[1] < 1776 ? "A.D." : ""}
                </span>
              )}
              <span style={{ marginRight: "0.2rem" }}>-</span>
              <span>
                {end
                  ? `${getMonthName(end[0])} ${Math.abs(end[1])} ${
                      end[1] < 0 ? "B.C." : end[1] < 1700 ? "A.D." : ""
                    }`
                  : "Current"}
              </span>
            </div>
          </>
        )}

        {!disabled && (
          <Trash
            style={{ marginLeft: 5, cursor: "pointer" }}
            size={"1.5rem"}
            onClick={onDelete}
          />
        )}
      </div>
      {!hideDescription && (
        <div style={{ marginLeft: 0 }}>
          <MinimalisticTextArea
            placeholder="Your Experience"
            value={description}
            onChange={(v) =>
              handleChangeDescription && handleChangeDescription(v)
            }
            disabled={disabled}
          />
        </div>
      )}
    </div>
    </div>
  );
}

// "instagram",
// "twitter",
// "youtube",
// "linkedIn",
// "discord",
function SocialTile({
  social,
  canRemove,
  onRemove,
  canEdit,
  onEdit,
}: {
  social: ObjectAny;
  canRemove?: boolean;
  onRemove?: AnyFunction;
  canEdit?: boolean;
  onEdit?: AnyFunction;
}) {
  const { type, url }: { type?: SocialType, url?: string } = social;
  const dispatch = useDispatch();
  function HandleOpenSocial() {
    const btns: ObjectAny[] = [
      {
        text: "Go",
        onClick: () => {
          window.open(url, "_blank");
          dispatch(closeDialog());
        },
      },
    ];
    if (canRemove && onRemove) {
      btns.unshift({
        text: "Remove",
        style: { color: "white", backgroundColor: "#f33", marginRight: 10 },
        onClick: () => {
          onRemove();
          dispatch(closeDialog());
        },
      });
    }

    if (canEdit && onEdit) {
      btns.unshift({
        text: "Edit",
        onClick: () => {
          onEdit();
          dispatch(closeDialog());
        },
        style: { marginRight: 10 },
      });
    }
    dispatch(
      setDialog({
        title: `Opening ${canRemove || canEdit ? "or Editing" : ""} Social`,
        subtitle: `You to go to: \"${url}\".`,
        containerStyle: { minWidth: 400 },
        buttons: btns,
        buttonContainerStyle: {
          justifyContent: "end",
        },
      })
    );
  }
  const defaultIconStyle = { cursor: "pointer", marginRight: 5 };
  return (
    <>
      {type == "instagram" && (
        <FaInstagram
          size={30}
          onClick={HandleOpenSocial}
          style={defaultIconStyle}
        />
      )}
      {type == "twitter" && (
        <FaTwitter
          size={30}
          onClick={HandleOpenSocial}
          style={defaultIconStyle}
        />
      )}
      {type == "youtube" && (
        <FaYoutube
          size={30}
          strokeWidth={1.5}
          onClick={HandleOpenSocial}
          style={defaultIconStyle}
        />
      )}
      {type == "linkedIn" && (
        <FaLinkedin
          size={30}
          onClick={HandleOpenSocial}
          style={defaultIconStyle}
        />
      )}
      {type == "discord" && (
        <FaDiscord
          size={30}
          onClick={HandleOpenSocial}
          style={defaultIconStyle}
        />
      )}
      {type == "github" && (
        <FaGithub
          size={30}
          onClick={HandleOpenSocial}
          style={defaultIconStyle}
        />
      )}
      {type == "facebook" && (
        <FaFacebook
          size={30}
          onClick={HandleOpenSocial}
          style={defaultIconStyle}
        />
      )}
      {type == "hackerrank" && (
        <FaHackerrank
          size={30}
          onClick={HandleOpenSocial}
          style={defaultIconStyle}
        />
      )}
      {type == "portfolio" && (
        <Globe
          size={30}
          onClick={HandleOpenSocial}
          style={defaultIconStyle}
        />
      )}
      {type == "stackOverflow" && (
        <FaStackOverflow
          size={30}
          onClick={HandleOpenSocial}
          style={defaultIconStyle}
        />
      )}
    </>
  );
}
