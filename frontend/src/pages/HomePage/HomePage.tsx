import { useSelector } from "react-redux";
import { ReduxRootState } from "../../store";
import { Fragment } from "react";
import { MyClientSocket } from "../../features/ClientSocket/ClientSocketHandler";
import FileTabContainer from "../../components/FileTabContainer/FileTabContainer";
import { GoalCard } from "../GoalsPage/GoalsPage";
import UseRecommendTodos from "../../hooks/UseRecommendTodos/UseRecommendTodos";
import MinimalisticButton from "../../components/MinimalisticButton/MinimalisticButton";
import { HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { NothingFunction, unixToDateString } from "../../scripts/tools";
import useDeleteAssessmentWithDialog from "../../hooks/UseDeleteAssessmentWithDialog/useDeleteAssessmentWithDialog";
import useDeleteGoalWithDialog from "../../hooks/UseDeleteGoalWithDialog/useDeleteGoalWithDialog";
import useTutorialWithDialog from "../../hooks/UseTutorialWithDialog/useTutorialWithDialog";

export default function HomePage() {
  const { user, ready } = useSelector(
    (store: ReduxRootState) => store.ClientSocket
  );

  if (!user || !MyClientSocket || !ready) {
    return <p>Loading...</p>;
  }

  return (
    <div className={"pageBase"}>
      <HomePageHeader />
      <div style={{}} />
      <HomePageDashboard />
    </div>
  );
}

function HomePageDashboard() {
  const { recommendTodoCard, recommendTodos } = UseRecommendTodos();
  const recommendedTodos = recommendTodos();
  return (
    <FileTabContainer
      tabs={[
        {
          name: "Todo",
          children: (
            <>
              {recommendedTodos.map((rec, index) => {
                return (
                  <Fragment key={`ToDo_${index}`}>
                    {recommendTodoCard(...rec)}
                  </Fragment>
                );
              })}
              {recommendedTodos.length == 0 && (
                <div
                  style={{
                    display: "flex",
                    padding: "1rem",
                    flexDirection: "column",
                  }}
                >
                  <span style={{ fontSize: "1.5rem" }}>Nothing to do...</span>
                  <span style={{ fontSize: "1rem" }}>Yeah</span>
                </div>
              )}
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
    ></FileTabContainer>
  );
}

export function PreviewGoalsPage() {
  const { user } = useSelector((store: ReduxRootState) => store.ClientSocket);
  const { recommendTodoCard } = UseRecommendTodos();
  const userGoals = Object.entries(user?.goals || {});
  const navigate = useNavigate();
  const deleteGoalWithDialog = useDeleteGoalWithDialog();
  const ShowTutorial = useTutorialWithDialog();

  function handleDeleteGoal(id: string) {
    deleteGoalWithDialog(id);
  }

  return (
    <>
      <div style={{ width: "100%" }}>
        {userGoals.length != 0 && (
          <>
            <span
              style={{
                marginLeft: "1rem",
                fontSize: "1.25rem",
                borderBottom: "1px #fff6 solid",
                cursor: "pointer",
              }}
              onClick={() => ShowTutorial('goals')}
            >
              How do goals work?
            </span>
            <div
              style={{
                width: "100%",
                display: "flex",
                flexWrap: "wrap",
                marginTop: "1rem",
              }}
            >
              {userGoals.map(([goalID, goalPreviewObj]) => {
                return (
                  <GoalCard
                    key={`goal_${goalID}`}
                    onClick={() => navigate(`/app/goal?id=${goalID}`)}
                    name={goalPreviewObj.name}
                    onDelete={() => handleDeleteGoal(goalID)}
                    canDelete={true}
                  />
                );
              })}
              <GoalCard
                onClick={() => navigate("/app/goal?new=true")}
                name={"New Goal +"}
                canDelete={false}
                onDelete={NothingFunction}
              />
            </div>
          </>
        )}
        {userGoals.length == 0 && recommendTodoCard("CreateFirstGoal")}
      </div>
    </>
  );
}

export function PreviewAssessmentsPage() {
  const { user } = useSelector((store: ReduxRootState) => store.ClientSocket);
  const { recommendTodoCard } = UseRecommendTodos();
  const userGoals = Object.entries(user?.assessments || {});
  const navigate = useNavigate();
  const deleteAssessmentWithDialog = useDeleteAssessmentWithDialog();
  const ShowTutorial = useTutorialWithDialog();

  function handleDeleteAssessment(id: string) {
    deleteAssessmentWithDialog(id);
  }

  return (
    <>
      <div style={{ width: "100%" }}>
        {userGoals.length != 0 && (
          <>
            <span
              style={{
                marginLeft: "1rem",
                fontSize: "1.25rem",
                borderBottom: "1px #fff6 solid",
                cursor: "pointer",
              }}
              onClick={() => ShowTutorial('selfAssessments')}
            >
              How do assessment work?
            </span>

            <div
              style={{
                width: "100%",
                display: "flex",
                flexWrap: "wrap",
                marginTop: "1rem",
              }}
            >
              {userGoals.map(([assessmentID, assessmentPreviewObject]) => {
                return (
                  <GoalCard
                    key={`goal_${assessmentID}`}
                    onClick={() =>
                      navigate(`/app/assessment?id=${assessmentID}`)
                    }
                    onDelete={() => handleDeleteAssessment(assessmentID)}
                    name={unixToDateString(assessmentPreviewObject.date)}
                    canDelete={Object.keys(user?.assessments || []).length > 1}
                  />
                );
              })}
              <GoalCard
                onClick={() => navigate("/app/assessment?type=new")}
                name={"New Assessment +"}
                canDelete={false}
                onDelete={NothingFunction}
              />
            </div>
          </>
        )}
      </div>
      {userGoals.length == 0 && recommendTodoCard("CreateFirstGoal")}
    </>
  );
}

function HomePageHeader() {
  const { user } = useSelector((store: ReduxRootState) => store.ClientSocket);
  const navigate = useNavigate();

  function handleHelpClick() {
    navigate("/app/help");
  }

  // const { username } = user || {};
  const {fName} = user || {};
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
        <div>
          <span style={{ fontSize: "1.75rem", fontWeight: 300 }}>Home</span>
        </div>
        <div style={{ marginTop: "0.5rem" }}>
          <MinimalisticButton
            onClick={handleHelpClick}
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            Help <HelpCircle style={{ marginLeft: "0.25rem" }} size="1rem" />
          </MinimalisticButton>
        </div>
      </div>
    </div>
  );
}
