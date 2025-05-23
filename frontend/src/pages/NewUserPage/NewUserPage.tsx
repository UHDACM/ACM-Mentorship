import { FormEvent, useState } from "react";
import MentorshipLogo from "../../components/MentorshipLogo/MentorshipLogo";
import { MyClientSocket } from "../../features/ClientSocket/ClientSocketHandler";
import { useSelector } from "react-redux";
import { useAuth0 } from "@auth0/auth0-react";
import MinimalisticButton from "../../components/MinimalisticButton/MinimalisticButton";
import { ReduxRootState } from "../../store";
import { useNavigate } from "react-router-dom";
import useTutorialWithDialog from "../../hooks/UseTutorialWithDialog/useTutorialWithDialog";

export default function NewUserPage() {
  const ShowTutorial = useTutorialWithDialog();
  const navigate = useNavigate();
  const { user } = useSelector((store: ReduxRootState) => store.ClientSocket);
  const { logout } = useAuth0();
  const [fName, setFName] = useState("");
  const [mName, setMName] = useState("");
  const [lName, setLName] = useState("");
  const [username, setUsername] = useState("");

  // if (!MyClientSocket) {
  //   return <p>Connecting...</p>;
  // }

  function handleSubmit(e: FormEvent) {
    if (user) {
      navigate('/app/home');
      ShowTutorial('getStarted');
    }
    e.preventDefault();
    MyClientSocket?.CreateAccount({ fName, mName, lName, username }).then((v: boolean) => {
      if (!v) {
        return;
      }
      ShowTutorial('getStarted');
    });
  }

  return (
    <div className={"pageBase"} style={{ alignItems: "center" }}>
      <MentorshipLogo />
      <p
        style={{
          fontSize: "2rem",
          color: "white",
          textAlign: "center",
          margin: 0,
          marginBottom: 5,
        }}
      >
        Looks like you're new around here
      </p>
      <p
        style={{
          fontSize: "1.75rem",
          color: "#fffa",
          textAlign: "center",
          margin: 0,
        }}
      >
        Let's get you setup
      </p>
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          marginTop: 10,
          alignItems: "start",
        }}
      >
        <div>
          <p style={{ margin: 0, color: "white", fontSize: "1rem" }}>
            First Name
          </p>
          <input
            value={fName}
            onChange={(e) => setFName(e.target.value)}
            style={{ padding: 10, borderRadius: 5, 
              backgroundColor: '#333', color: 'white' }}
          />
        </div>

        <div>
          <p style={{ margin: 0, color: "white", fontSize: "1rem" }}>
            Middle Name
          </p>
          <input
            value={mName}
            onChange={(e) => setMName(e.target.value)}
            style={{ padding: 10, 
              backgroundColor: '#333',borderRadius: 5, color: 'white' }}
          />
        </div>

        <div>
          <p style={{ margin: 0, color: "white", fontSize: "1rem" }}>
            Last Name
          </p>
          <input
            value={lName}
            onChange={(e) => setLName(e.target.value)}
            style={{ padding: 10, 
              backgroundColor: '#333',borderRadius: 5, color: 'white' }}
          />
        </div>

        <div style={{ marginTop: 20 }}>
          <p style={{ margin: 0, color: "white", fontSize: "1rem" }}>
            Username
          </p>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ padding: 10, 
              backgroundColor: '#333',borderRadius: 5, color: 'white' }}
          />
        </div>
        <div style={{ width: "100%", display: 'flex', justifyContent: "end" }}>
          <MinimalisticButton style={{ marginTop: 10, fontSize: "1rem" }}>
            Submit
          </MinimalisticButton>
        </div>
      </form>
      <span
        onClick={() =>
          logout({ logoutParams: { returnTo: window.location.origin } })
        }
        style={{marginTop: '1rem', borderBottom: '1px solid #fff6', cursor: 'pointer'}}
      >
        Logout
      </span>
    </div>
  );
}
