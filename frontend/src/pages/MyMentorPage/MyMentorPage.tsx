import { useDispatch, useSelector } from "react-redux";
import { ReduxRootState } from "../../store";
import { useEffect, useState } from "react";
import { MyClientSocket } from "../../features/ClientSocket/ClientSocketHandler";
import { useNavigate } from "react-router-dom";
import MinimalisticButton from "../../components/MinimalisticButton/MinimalisticButton";
import FileTabContainer from "../../components/FileTabContainer/FileTabContainer";
import { HelpCircle } from "lucide-react";
import useTutorialWithDialog from "../../hooks/UseTutorialWithDialog/useTutorialWithDialog";
import { UserObj } from "@shared/types/general";
import MentorTile from "../../components/MentorTile/MentorTile";
import { MentorMatchResult } from "@shared/types/mentorFinder";
import useAIMentorFinder from "../../features/AIMentorFinder/useAIMentorFinder";
import { addDialog } from "../../features/Dialog/DialogSlice";

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

  return (
    <>
      <FileTabContainer
        tabs={[
          {
            name: "Mentor",
            children: (
              <>
                {hasMentor && (
                  <>
                    <span style={{ fontSize: "1.5rem" }}>Your Mentors</span>
                    <CurrentMentorsInfo />
                    <div style={{ height: "2rem", width: "0.5rem" }} />
                  </>
                )}
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "start",
                  }}
                >
                  <AIMentorFinder />
                  <MentorSearchTool />
                </div>
              </>
            ),
          },
          // {
          //   name: "Goals",
          //   children: (
          //     <>
          //       <PreviewGoalsPage />
          //     </>
          //   ),
          // },
          // {
          //   name: "Assessments",
          //   children: <PreviewAssessmentsPage />,
          // },
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

function CurrentMentorsInfo() {
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
      style={{
        width: "100%",
        display: "flex",
        flexWrap: "wrap",
        boxSizing: "border-box",
      }}
    >
      {mentorObjs.map((mentorObj) => (
        <div
          className="w-full xss:w-3/3 sm:w-1/2 lg:w-1/3 xl:1/5"
          style={{ padding: "0.1rem", boxSizing: "border-box" }}
          key={mentorObj.id}
        >
          <MentorTile mentor={mentorObj} key={mentorObj.id} />
        </div>
      ))}
    </div>
  );
}

function AIMentorFinder() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MentorMatchResult[] | undefined>(
    undefined
  );
  const { FindMentors, isTimedOut } = useAIMentorFinder();
  const dispatch = useDispatch();

  async function handleFind() {
    if (!query.trim()) {
      return;
    }

    try {
      const res = await FindMentors(query);
      setResults(res);
    } catch (e) {
      dispatch(
        addDialog({ title: "Error", subtitle: (e as Error).message })
      );
    }
  }

  return (
    <div style={{ width: "100%", marginBottom: "1.5rem" }}>
      <span style={{ fontSize: "1.5rem" }}>AI Mentor Finder</span>
      <p
        style={{
          margin: 0,
          marginBottom: "0.5rem",
          opacity: 0.6,
          fontSize: "0.9rem",
        }}
      >
        Describe what you want help with and we'll pull out the mentors that fit
        best.
      </p>
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          width: "100%",
          flexWrap: "wrap",
        }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key == "Enter" && handleFind()}
          placeholder="ex: someone who does backend work and can help me prep for interviews"
          style={{
            flex: 1,
            minWidth: "15rem",
            fontSize: "1rem",
            padding: "0.5rem",
            borderRadius: "0.3rem",
            backgroundColor: "#333",
            border: "1px solid #fff3",
            color: "white",
          }}
        />
        <MinimalisticButton onClick={handleFind} disabled={isTimedOut}>
          Find Mentors
        </MinimalisticButton>
      </div>

      {results && results.length == 0 && (
        <p
          style={{
            margin: 0,
            marginTop: "0.5rem",
            fontSize: "1.1rem",
            opacity: 0.8,
          }}
        >
          Nothing matched that. Try describing what you want help with a
          different way.
        </p>
      )}

      {results && results.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", width: "100%" }}>
          {results.map((r) => (
            <div
              className="w-full xss:w-3/3 sm:w-1/2 lg:w-1/3 xl:1/5"
              style={{ padding: "0.25rem", boxSizing: "border-box" }}
              key={r.mentor.id}
            >
              <MentorTile mentor={r.mentor} />
              <span
                style={{
                  display: "block",
                  fontSize: "0.8rem",
                  opacity: 0.7,
                  padding: "0.25rem",
                }}
              >
                {r.reason}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MentorSearchTool() {
  const { user } = useSelector((store: ReduxRootState) => store.ClientSocket);
  const userMentorIDs = user?.mentorIDs || [];
  const [mentors, setMentors] = useState<UserObj[] | undefined>(undefined);
  const ShowTutorial = useTutorialWithDialog();

  useEffect(() => {
    if (!mentors) {
      MyClientSocket?.GetAllMentors().then((m: false | UserObj[]) => {
        if (typeof m == "boolean") {
          return;
        } else if (!(m instanceof Array)) {
          return;
        }

        // for (const mentor of m) {
        //   if (mentor.id == MyClientSocket?.user?.id) {
        //     // remove self from mentor list
        //     m.splice(m.indexOf(mentor), 1);
        //   }
        // }
        setMentors(m);
      });
    }
  }, []);

  if (!mentors) {
    return <p>Loading...</p>;
  }

  return (
    <div
      style={{
        borderRadius: 5,
        padding: "0.2rem",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "start",
        flexDirection: "column",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {mentors.length != 0 && (
        <div style={{
          display: 'flex', 
          alignItems: 'start',
          flexDirection: 'column',
          marginBottom: '0.25rem'
        }}>
          <span style={{ fontSize: "1.5rem" }}>View Our Mentors</span>
          <span
            style={{
              fontSize: "1.25rem",
              borderBottom: "1px #fff6 solid",
              cursor: "pointer",
            }}
            onClick={() => ShowTutorial("getAMentor")}
          >
            How does this work?
          </span>
        </div>
      )}

      {mentors.length == 0 && (
        <p style={{ margin: 0, marginLeft: "0.25rem", fontSize: "1.25rem" }}>
          No mentors available
        </p>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", width: "100%" }}>
        {mentors.map((mentor) => {
          if (userMentorIDs && mentor.id && userMentorIDs.includes(mentor.id)) {
            // skip mentors the user already has
            return null;
          }
          return (
            <div
              className="w-full xss:w-3/3 sm:w-1/2 lg:w-1/3 xl:1/5"
              style={{ padding: "0.25rem", boxSizing: "border-box" }}
              key={`user_${mentor.id}`}
            >
              <MentorTile mentor={mentor} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
