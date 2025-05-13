import { useDispatch, useSelector } from "react-redux";
import { ReduxRootState } from "../../store";
import { useEffect, useState } from "react";
import {
  ClientSocketUser,
  MyClientSocket,
} from "../../features/ClientSocket/ClientSocket";
import { closeDialog, setDialog } from "../../features/Dialog/DialogSlice";
import { useNavigate } from "react-router-dom";
import MinimalisticButton from "../../components/MinimalisticButton/MinimalisticButton";
import FileTabContainer from "../../components/FileTabContainer/FileTabContainer";
import { IoChatbubbleOutline } from "react-icons/io5";
import useChatWithUser from "../../hooks/UseChatWithUser/UseChatWithUser";
import {
  MentorshipRequestObj,
  MentorshipRequestResponseAction,
} from "../../scripts/types";
import { Check, HelpCircle } from "lucide-react";
import useTutorialWithDialog from "../../hooks/UseTutorialWithDialog/useTutorialWithDialog";

export default function MyMenteesPage() {
  const { user, ready } = useSelector(
    (store: ReduxRootState) => store.ClientSocket
  );

  if (!user || !MyClientSocket || !ready) {
    return <p>Loading...</p>;
  }

  return (
    <div className={"pageBase"}>
      <MyMentorPageHeader />
      <MyMenteePageDashboard />
    </div>
  );
}

function MyMenteePageDashboard() {
  const { user } = useSelector((store: ReduxRootState) => store.ClientSocket);
  const isMentor = user?.isMentor ? true : false;
  return (
    <>
      <FileTabContainer
        tabs={[
          {
            name: "Mentees",
            children: (
              <>
                {isMentor && <CurrentMentorInfo />}
                {!isMentor && <BecomeMentorSection />}
              </>
            ),
          },
          {
            name: "Mentee Requests",
            children: <MenteeRequests />,
          },
        ]}
      />
      <div style={{ height: "5rem" }} />
    </>
  );
}

function MenteeRequests() {
  const { user } = useSelector((store: ReduxRootState) => store.ClientSocket);

  if (!user) {
    return;
  }

  const { mentorshipRequests } = user;
  const mentorshipRequestTiles = mentorshipRequests?.map(
    (mentorshipRequestID) => {
      const tile = (
        <MentorshipRequestTile
          mentorshipRequestID={mentorshipRequestID}
          renderIfRole="mentor"
        />
      );
      if (!tile) {
        return null;
      }
      return (
        <div
          className="w-full xss:w-3/3 sm:w-1/2 lg:w-1/3 xl:1/5"
          style={{ margin: "0.1rem" }}
          key={`mr_${mentorshipRequestID}`}
        >
          {tile}
        </div>
      );
    }
  );
  return (
    <>
      {(!mentorshipRequestTiles || mentorshipRequestTiles.length == 0) && (
        <span style={{ fontSize: "1.5rem" }}>No mentee requests yet.</span>
      )}
      <div style={{ width: "100%", display: "flex" }}>
        {mentorshipRequestTiles}
      </div>
    </>
  );
}

type MentorshipRequestRole = "mentor" | "mentee";
function MentorshipRequestTile({
  mentorshipRequestID,
  renderIfRole,
}: {
  mentorshipRequestID: string;
  renderIfRole?: MentorshipRequestRole;
}) {
  const dispatch = useDispatch();
  const { ready, user } = useSelector(
    (store: ReduxRootState) => store.ClientSocket
  );
  const navigate = useNavigate();
  const [otherUserObj, setOtherUserObj] = useState<ClientSocketUser>();

  useEffect(() => {
    if (!ready || !MyClientSocket || !user) {
      return;
    }
    MyClientSocket.GetMentorshipRequest(
      mentorshipRequestID,
      (v: MentorshipRequestObj | boolean) => {
        if (typeof v == "boolean") {
          return;
        }
        const { mentorID, menteeID } = v;
        if (!mentorID || !menteeID) {
          return;
        }

        if (renderIfRole) {
          const userRole: MentorshipRequestRole =
            mentorID == user.id ? "mentor" : "mentee";
          if (userRole != renderIfRole) {
            return;
          }
        }
        const otherUserID = user.id == mentorID ? menteeID : mentorID;
        MyClientSocket!.GetUser(
          otherUserID,
          (v: boolean | ClientSocketUser) => {
            if (typeof v == "boolean") {
              return;
            }
            setOtherUserObj(v);
          }
        );
      }
    );
  }, [ready]);

  if (!otherUserObj) {
    return;
  }

  function AcceptDeclineRequestAction() {
    if (!otherUserObj) {
      return;
    }

    function handleMentorshipRequestAction(
      action: MentorshipRequestResponseAction,
      callback: Function
    ) {
      if (!MyClientSocket) {
        return;
      }
      MyClientSocket.DoMentorshipRequestAction(
        mentorshipRequestID,
        action,
        () => {
          callback();
        }
      );
    }

    dispatch(
      setDialog({
        title: `Mentor ${otherUserObj.fName}?`,
        subtitle: `Do you wish to mentor ${otherUserObj.fName}?`,
        containerStyle: { minWidth: "20rem" },
        buttons: [
          {
            text: "Decline",
            useDisableTill: true,
            onClick: (_, cb) => {
              if (!mentorshipRequestID || !otherUserObj || !MyClientSocket) {
                cb && cb();
                return;
              }
              const callback = () => {
                cb && cb();
                dispatch(closeDialog());
              };
              handleMentorshipRequestAction("decline", callback);
            },
          },
          {
            text: "Accept",
            useDisableTill: true,
            onClick: (_, cb) => {
              if (!mentorshipRequestID || !otherUserObj || !MyClientSocket) {
                cb && cb();
                return;
              }
              const callback = () => {
                cb && cb();
                dispatch(closeDialog());
              };
              handleMentorshipRequestAction("accept", callback);
            },
          },
        ],
      })
    );
  }

  const {
    username, // @ts-ignore
    fName, // @ts-ignore
    mName, // @ts-ignore
    lName, // @ts-ignore
    bio,
    id,
    displayPictureURL,
  } = otherUserObj;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: "0.5rem",
        borderRadius: "0.5rem",
        border: "1px solid #fff3",
        backgroundColor: "#333",
        boxSizing: "border-box",
        width: "100%",
      }}
    >
      <div style={{ display: "flex" }}>
        <img
          style={{
            width: "20%",
            aspectRatio: 1 / 1,
            height: "30%",
            objectFit: "cover",
            borderRadius: "50%",
          }}
          src={displayPictureURL}
        />
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            marginLeft: "0.5rem",
          }}
        >
          <span
            style={{
              fontSize: "1.25rem",
              lineHeight: "1.25rem",
              marginTop: "0.25rem",
            }}
          >
            {fName} {mName} {lName}
          </span>
          <span
            style={{ fontSize: "0.8rem", opacity: 0.6, marginLeft: "0.5rem" }}
          >
            @{username}
          </span>
          <span style={{ marginLeft: "0.5rem" }}>{bio || "No bio"}</span>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          marginTop: "0.25rem",
          width: "100%",
          justifyContent: "end",
          flexWrap: "wrap",
          gap: "0.25rem",
        }}
      >
        <MinimalisticButton
          style={{ fontSize: "0.9rem" }}
          onClick={() => (id ? navigate(`/app/user?id=${id}`) : undefined)}
        >
          View Profile
        </MinimalisticButton>
        <MinimalisticButton
          style={{
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
          }}
          onClick={() => (id ? AcceptDeclineRequestAction() : undefined)}
        >
          Accept/Decline Request
        </MinimalisticButton>
      </div>
    </div>
  );
}

function MyMentorPageHeader() {
  const navigate = useNavigate();
  const { user } = useSelector((store: ReduxRootState) => store.ClientSocket);

  function handleHelpClick() {
    navigate("/app/help");
  }
  // if (!user) {
  //   return <p>Waiting for user data...</p>;
  // }

  const { fName } = user || {};
  const {lName} = user || {};

  return (
    <div
      style={{
        display: "flex",
        paddingLeft: "0.75rem",
        alignItems: "center",
        paddingTop: "2rem",
        paddingBottom: 30,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "start",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <p style={{ color: "white", fontSize: "2rem", margin: 0 }}>
            Welcome {fName || "NoFName"} {lName || "NoLName"}
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: "1.75rem", fontWeight: 300 }}>
            My Mentees
          </span>
          <div style={{ height: "0.5rem" }} />
          <AcceptingMenteesIndicator />
        </div>
        <div style={{ display: "flex", marginTop: "1rem" }}>
          <MinimalisticButton
            onClick={() => navigate("/app/mentor-guidelines")}
          >
            Mentor Guidelines
          </MinimalisticButton>

          <MinimalisticButton
            onClick={handleHelpClick}
            style={{ marginLeft: "0.5rem" }}
          >
            Help{" "}
            <HelpCircle style={{ marginLeft: "0.25rem" }} size={"0.8rem"} />
          </MinimalisticButton>
        </div>
      </div>
    </div>
  );
}

function AcceptingMenteesIndicator() {
  const { user } = useSelector((store: ReduxRootState) => store.ClientSocket);
  const dispatch = useDispatch();
  if (!user || !user.isMentor) {
    return;
  }

  const { acceptingMentees } = user;

  function handleToggleAcceptingMentees() {
    dispatch(
      setDialog({
        title: `${
          acceptingMentees ? "Stop accepting" : "Start accepting"
        } mentees?`,
        subtitle: acceptingMentees
          ? `Turning this off means new mentees cannot send you mentorship requests`
          : `Turning this off means new mentees can start sending you mentorship requests`,
        buttonContainerStyle: {
          width: "100%",
          justifyContent: "end",
          marginTop: "1rem",
        },
        buttons: [
          {
            text: `${acceptingMentees ? "Stop" : "Start"} accepting mentees`,
            useDisableTill: true,
            onClick: (_, cb) => {
              MyClientSocket?.updateProfile(
                { acceptingMentees: !acceptingMentees },
                () => {
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

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: "0.5rem",
        paddingLeft: "0.5rem",
      }}
    >
      <div
        onClick={handleToggleAcceptingMentees}
        style={{
          backgroundColor: "#292929",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          borderRadius: "0.5rem",
          width: "2rem",
          height: "2rem",
          border: "1px solid #fff2",
          cursor: "pointer",
        }}
      >
        {acceptingMentees && <Check color={"#2d2"} />}
      </div>
      <span style={{ fontSize: "1.1rem" }}>Accepting Mentees</span>
    </div>
  );
}

const MAX_FILLED_SECTIONS = 5;
function BecomeMentorSection() {
  const { user } = useSelector((store: ReduxRootState) => store.ClientSocket);

  const dispatch = useDispatch();

  if (!user) {
    return <p>Waiting for user data...</p>;
  }

  const { experience, education, certifications, projects, softSkills } = user;
  const filledSections =
    (experience ? 1 : 0) +
    (education ? 1 : 0) +
    (certifications ? 1 : 0) +
    (projects ? 1 : 0) +
    (softSkills ? 1 : 0);

  const percentageSectionsFilled = filledSections / MAX_FILLED_SECTIONS;

  function HandleBecomeMentorClick() {
    let title = "Before you become a mentor";
    let message = "";
    if (percentageSectionsFilled < 0.5) {
      message =
        "We recommend completing more of your profile first. It will help your mentees pick you with confidence.";
    } else {
      message = "You will become visible to mentees after this.";
    }

    dispatch(
      setDialog({
        title,
        subtitle: message,
        buttons: [
          {
            text: "Nevermind",
            onClick: () => {
              dispatch(closeDialog());
            },
          },
          {
            text: "Become mentor",
            useDisableTill: true,
            onClick: (_, enableCallback) => {
              dispatch(closeDialog());
              BecomeMentor(enableCallback);
            },
          },
        ],
        buttonContainerStyle: {
          width: "100%",
          justifyContent: "space-between",
        },
      })
    );
  }

  function BecomeMentor(cb?: Function) {
    MyClientSocket?.BecomeMentor(cb);
  }

  return (
    <div
      style={{
        maxWidth: "25rem",
      }}
    >
      <p style={{ color: "white", margin: 0, fontSize: "1.5rem" }}>
        Want to become a mentor?
      </p>
      {percentageSectionsFilled < 0.5 && (
        <div>
          <p
            style={{
              color: "white",
              margin: 0,
              fontSize: "1.25rem",
              marginBottom: 5,
            }}
          >
            We recommend adding some information to your profile first.
          </p>
          <div style={{ height: 10, width: "25rem", backgroundColor: "#777" }}>
            <div
              style={{
                width: `${25 * Math.max(percentageSectionsFilled, 0.025)}rem`,
                height: "100%",
                backgroundColor: "green",
              }}
            />
          </div>
          <p style={{ margin: 0 }}>
            Profile Completion: {(100 * percentageSectionsFilled).toFixed(0)}%
          </p>
        </div>
      )}

      <button
        style={{
          border: "2px solid #fff",
          backgroundColor: "transparent",
          color: "white",
          borderRadius: 30,
          marginTop: 5,
          fontSize: "1rem",
        }}
        onClick={HandleBecomeMentorClick}
      >
        Become Mentor
      </button>
    </div>
  );
}

function CurrentMentorInfo() {
  const { user, ready } = useSelector(
    (store: ReduxRootState) => store.ClientSocket
  );
  const ShowTutorial = useTutorialWithDialog();

  if (!user || !MyClientSocket || !ready) {
    return <p>Loading...</p>;
  }

  if (!user.isMentor) {
    return;
  }

  const { menteeIDs } = user;

  return (
    <div style={{ width: "100%", display: 'flex', flexDirection: 'column', alignItems: 'start' }}>
      <span
        style={{
          marginLeft: "1rem",
          fontSize: "1.25rem",
          borderBottom: "1px #fff6 solid",
          cursor: "pointer",
        }}
        onClick={() => ShowTutorial('mentoring')}
      >
        How does this work?
      </span>
      <span style={{ fontSize: "1.5rem" }}>Mentees</span>
      {menteeIDs && (
        <div style={{ width: "100%", display: "flex", flexWrap: "wrap", boxSizing: 'border-box' }}>
          {menteeIDs.map((menteeID) => {
            return (
              <div
                className="w-full xss:w-3/3 sm:w-1/2 lg:w-1/3 xl:1/5"
                style={{ padding: "0.25rem", boxSizing: 'border-box' }}
                key={`mentee_${menteeID}`}
              >
                <MenteeTile menteeID={menteeID} />
              </div>
            );
          })}
        </div>
      )}
      {(!menteeIDs || menteeIDs.length == 0) && (
        <span style={{ fontSize: "1.5rem" }}>No mentees yet</span>
      )}
    </div>
  );
}

function MenteeTile({ menteeID }: { menteeID: string }) {
  const chatWithUser = useChatWithUser();
  const navigate = useNavigate();
  const { ready } = useSelector((store: ReduxRootState) => store.ClientSocket);
  const [menteeObj, setMenteeObj] = useState<ClientSocketUser>();

  useEffect(() => {
    if (!ready || !MyClientSocket) {
      return;
    }
    MyClientSocket.GetUser(menteeID, (v: ClientSocketUser) => {
      setMenteeObj(v);
    });
  }, [ready]);

  if (!menteeObj) {
    return;
  }

  const {
    username, // @ts-ignore
    fName, // @ts-ignore
    mName, // @ts-ignore
    lName, // @ts-ignore
    bio,
    id,
    displayPictureURL,
  } = menteeObj;
  return (
    <div
      style={{
        display: "flex",
        padding: "0.5rem",
        borderRadius: "0.5rem",
        border: "1px solid #fff3",
        backgroundColor: "#333",
        boxSizing: "border-box",
        width: "100%",
      }}
    >
      <img
        style={{
          width: "20%",
          aspectRatio: 1 / 1,
          height: "30%",
          objectFit: "cover",
          borderRadius: "50%",
        }}
        src={displayPictureURL}
      />
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          marginLeft: "0.5rem",
        }}
      >
        <span
          style={{
            fontSize: "1.25rem",
            lineHeight: "1.25rem",
            marginTop: "0.25rem",
          }}
        >
          {fName} {mName} {lName}
        </span>
        <span
          style={{ fontSize: "0.8rem", opacity: 0.6, marginLeft: "0.5rem" }}
        >
          @{username}
        </span>
        <span style={{ marginLeft: "0.5rem" }}>{bio || "No bio"}</span>
        <div
          style={{
            display: "flex",
            marginTop: "0.25rem",
            width: "100%",
            justifyContent: "end",
            flexWrap: "wrap",
            gap: "0.25rem",
          }}
        >
          <MinimalisticButton
            style={{ fontSize: "0.8rem" }}
            onClick={() => (id ? navigate(`/app/user?id=${id}`) : undefined)}
          >
            View Profile
          </MinimalisticButton>
          <MinimalisticButton
            style={{
              fontSize: "0.8rem",
              display: "flex",
              alignItems: "center",
            }}
            onClick={() => (id ? chatWithUser(id) : undefined)}
          >
            Chat{" "}
            <IoChatbubbleOutline
              size={"1rem"}
              style={{ marginLeft: "0.25rem" }}
            />
          </MinimalisticButton>
        </div>
      </div>
    </div>
  );
}
