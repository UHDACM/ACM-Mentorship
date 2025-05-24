import { useSelector } from "react-redux";
import { ReduxRootState } from "../../store";
import { useEffect, useState } from "react";
import { MyClientSocket } from "../../features/ClientSocket/ClientSocketHandler";
import { useNavigate } from "react-router-dom";
import MinimalisticButton from "../../components/MinimalisticButton/MinimalisticButton";
import FileTabContainer from "../../components/FileTabContainer/FileTabContainer";
import UseRecommendTodos from "../../hooks/UseRecommendTodos/UseRecommendTodos";
import { IoChatbubbleOutline } from "react-icons/io5";
import useChatWithUser from "../../hooks/UseChatWithUser/UseChatWithUser";
import { PreviewAssessmentsPage, PreviewGoalsPage } from "../HomePage/HomePage";
import { HelpCircle } from "lucide-react";
import useTutorialWithDialog from "../../hooks/UseTutorialWithDialog/useTutorialWithDialog";
import { UserObj } from "@shared/types/general";

export default function MymentorPage() {
  const { user, ready } = useSelector(
    (store: ReduxRootState) => store.ClientSocket
  );

  if (!user || !MyClientSocket || !ready) {
    return <p>Loading...</p>;
  }

  return (
    <div className={"pageBase"}>
      <MyMentorPageHeader />
      <MyMentorPageDashboard />
    </div>
  );
}

function MyMentorPageDashboard() {
  const { user } = useSelector((store: ReduxRootState) => store.ClientSocket);
  const hasMentor = user?.mentorIDs && user.mentorIDs.length > 0 ? true : false;
  const isMentee = user?.isMentee || false;
  const { recommendTodoCard } = UseRecommendTodos();
  const ShowTutorial = useTutorialWithDialog();

  return (
    <>
      <FileTabContainer
        tabs={[
          {
            name: "Mentor",
            children: (
              <>
                {hasMentor && <CurrentMentorInfo />}
                {!hasMentor &&
                  (isMentee ? (
                    <div
                      style={{
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "start",
                      }}
                    >
                      <span
                        style={{
                          marginLeft: "1rem",
                          fontSize: "1.25rem",
                          borderBottom: "1px #fff6 solid",
                          cursor: "pointer",
                        }}
                        onClick={() => ShowTutorial("getAMentor")}
                      >
                        How does this work?
                      </span>
                      <MentorSearchTool />
                    </div>
                  ) : (
                    recommendTodoCard("TakeFirstAssessment")
                  ))}
              </>
            ),
          },
          {
            name: "Goals",
            children: (
              <>
                <PreviewGoalsPage />
              </>
            ),
          },
          {
            name: "Assessments",
            children: <PreviewAssessmentsPage />,
          },
        ]}
      />
      <div style={{ height: "5rem" }} />
    </>
  );
}

function MyMentorPageHeader() {
  const { user } = useSelector((store: ReduxRootState) => store.ClientSocket);
  const navigate = useNavigate();
  function handleHelpClick() {
    navigate("/app/help");
  }
  // if (!user) {
  //   return <p>Waiting for user data...</p>;
  // }

  const { fName } = user || {};
  const { lName } = user || {};

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
        <div>
          <span style={{ fontSize: "1.75rem", fontWeight: 300 }}>
            My Mentor
          </span>
        </div>
        <div style={{ marginTop: "0.5rem", gap: "0.5rem", display: "flex" }}>
          <MinimalisticButton
            onClick={() => navigate("/app/mentee-guidelines")}
          >
            Mentee Guidelines
          </MinimalisticButton>
          <MinimalisticButton onClick={handleHelpClick}>
            Help{" "}
            <HelpCircle style={{ marginLeft: "0.25rem" }} size={"0.8rem"} />
          </MinimalisticButton>
        </div>
      </div>
    </div>
  );
}

function CurrentMentorInfo() {
  const { user, ready } = useSelector(
    (store: ReduxRootState) => store.ClientSocket
  );
  const [mentorObjs, setMentorObjs] = useState<UserObj[]>([]);

  if (!user || !MyClientSocket || !ready) {
    return <p>Loading...</p>;
  }

  const { mentorIDs } = user;

  useEffect(() => {
    function getMentor() {
      if (!mentorIDs || !mentorIDs.length || !ready) {
        return;
      }
      Promise.all(mentorIDs.map((id) => MyClientSocket?.GetUser(id))).then(
        (mentors) => {
          setMentorObjs(mentors.filter((m) => m !== false && m !== undefined));
        }
      );
    }
    getMentor();
  }, [mentorIDs, ready]);

  if (!mentorObjs || mentorObjs.length === 0) {
    return (
      <p style={{ margin: 0, fontSize: "1.25rem" }}>You have no mentors</p>
    );
  }

  return (
    <div
      className="w-full xss:w-3/3 sm:w-1/2 lg:w-1/3 xl:1/5"
      style={{ margin: "0.1rem" }}
    >
      {mentorObjs.map((mentorObj) => (
        <MentorTile mentor={mentorObj} key={mentorObj.id} />
      ))}
    </div>
  );
}

function MentorTile({ mentor }: { mentor: UserObj }) {
  const chatWithUser = useChatWithUser();
  const navigate = useNavigate();
  const {
    username, // @ts-ignore
    fName, // @ts-ignore
    mName, // @ts-ignore
    lName, // @ts-ignore
    bio,
    id,
    displayPictureURL,
  } = mentor;
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
            Chat <IoChatbubbleOutline style={{ marginLeft: "0.25rem" }} />
          </MinimalisticButton>
        </div>
      </div>
    </div>
  );
}

function MentorSearchTool() {
  const [mentors, setMentors] = useState<UserObj[] | undefined>(undefined);

  useEffect(() => {
    if (!mentors) {
      MyClientSocket?.GetAllMentors().then((m: false | UserObj[]) => {
        if (typeof m == "boolean") {
          return;
        } else if (!(m instanceof Array)) {
          return;
        }
        setMentors(m);
      });
    }
  }, []);

  if (!mentors) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      {mentors.length != 0 && (
        <span style={{ fontSize: "1.5rem" }}>View Our Mentors</span>
      )}
      <div
        style={{
          borderRadius: 5,
          padding: "0.2rem",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "start",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {mentors.length == 0 && (
          <p style={{ margin: 0, fontSize: "1.25rem" }}>No mentors available</p>
        )}
        {mentors.map((mentor) => {
          return (
            <div
              className="w-full xss:w-3/3 sm:w-1/2 lg:w-1/3 xl:1/5"
              key={`user_${mentor.id}`}
              style={{ padding: "0.25rem" }}
            >
              <MentorTile mentor={mentor} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
