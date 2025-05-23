import { useSelector } from "react-redux";
import { ReduxRootState } from "../../store";
import { useEffect, useState } from "react";
import {
  MyClientSocket,
} from "../../features/ClientSocket/ClientSocketHandler";
import { useNavigate, useSearchParams } from "react-router-dom";
import { GoalPreviewObj, UserObj } from "@shared/types/general";
import MinimalisticButton from "../../components/MinimalisticButton/MinimalisticButton";
import { X } from "lucide-react";
import useDeleteGoalWithDialog from "../../hooks/UseDeleteGoalWithDialog/useDeleteGoalWithDialog";

export default function GoalsPage() {
  const navigate = useNavigate();
  const { ready, user: self } = useSelector((store: ReduxRootState) => store.ClientSocket);
  const [params, _] = useSearchParams();
  const [user, setUser] = useState<UserObj | undefined | false>();
  const deleteGoalWithDialog = useDeleteGoalWithDialog();

  const id = params.get("id");

  useEffect(() => {
    if (!id || !MyClientSocket) {
      return;
    }

    MyClientSocket.GetUser(id).then((v: boolean | UserObj) => {
      if (typeof v == "boolean") {
        setUser(false);
        return;
      }
      setUser(v);
    });
  }, [id, ready]);

  if (!id) {
    return <p>No ID.</p>;
  }

  if (!user) {
    return <p>Loading...</p>;
  } else if (typeof user == "boolean") {
    return <p>User does not exist.</p>;
  }

  function handleBackButton() {
    navigate(-1);
  }

  function handleDeleteGoal(id: string) {
    deleteGoalWithDialog(id);
  }

  const { fName, lName, goals } = user;
  const userOwnsGoals = id == self?.id;

  return (
    <div className={"pageBase"}>
      <MinimalisticButton
        style={{ fontSize: "0.8rem", marginBottom: 10 }}
        onClick={handleBackButton}
      >
        Back
      </MinimalisticButton>
      <p style={{ margin: 0, fontSize: "1.5rem" }}>
        {fName} {lName}'s Goals
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", marginTop: 10 }}>
        {goals &&
          Object.entries(goals).map(
            ([goalID, goalObj]: [string, GoalPreviewObj]) => {
              return (
                <GoalCard
                  key={`button_${goalID}`}
                  onClick={() => navigate(`/app/goal?id=${goalID}`)}
                  name={goalObj.name}
                  onDelete={() => handleDeleteGoal(goalID)}
                  canDelete={Object.keys(user?.goals || {}).length > 1}
                />
              );
            }
          )}
        {!goals && <p style={{ margin: 0, fontSize: "1.25rem" }}>No goals</p>}
      </div>
      {
        userOwnsGoals && <MinimalisticButton
          onClick={() => navigate("/app/goal?new=true&origin=user")}
          style={{ marginTop: 10 }}
        >
          New Goal +
        </MinimalisticButton>
      }
    </div>
  );
}

export function GoalCard({
  name,
  onClick,
  onDelete,
  canDelete = false,
}: {
  name: string;
  onClick: Function;
  onDelete: Function;
  canDelete: boolean;
}) {
  return (
    <div
      style={{
        borderRadius: 10,
        backgroundColor: "#222",
        border: "1px solid #fff1",
        overflow: "hidden",
        display: "flex",
        justifyContent: "end",
        padding: 10,
        boxShadow: "4px 4px 10px rgba(0, 0, 0, 0.6)",
        margin: 5,
        alignItems: "center",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: "1.5rem",
          fontWeight: "300",
          cursor: "pointer",
        }}
        onClick={() => onClick()}
      >
        {name}
      </p>
      {canDelete && (
        <X
          onClick={() => onDelete()}
          style={{ marginLeft: "0.5rem", cursor: "pointer" }}
          color={"#d33"}
        />
      )}
    </div>
  );
}
