import { useDispatch } from "react-redux";
import MentorshipLogo from "../../components/MentorshipLogo/MentorshipLogo";
import { addDialog } from "../../features/Dialog/DialogSlice";
import useAuth from "../../hooks/UseAuth/useAuth";
import { useEffect } from "react";

export default function LandingPage() {
  const dispatch = useDispatch();
  const { loginWithRedirect, getAccessTokenSilently } = useAuth();

  function handleLearnMore() {
    dispatch(
      addDialog({
        title: "Nothing",
        subtitle: "Nothing else available yet",
      })
    );
  }

  function handleLogin() {
    loginWithRedirect();
  }

  return (
    <div
      className={"pageBase"}
      style={{ justifyContent: "center", alignItems: "center" }}
    >
      {/* Shift slightly left to please visually */}
      <div style={{ marginLeft: -10 }}>
        <MentorshipLogo hideText={false} />
      </div>
      <p
        style={{
          margin: 0,
          color: "white",
          fontSize: "1.1rem",
          fontWeight: 300,
          textAlign: "center",
        }}
      >
        Inspiring the next generation, one person at a time
      </p>
      <div style={{ marginTop: 20 }}>
        <button
          style={{
            border: "2px solid #fff",
            backgroundColor: "transparent",
            color: "white",
            borderRadius: 30,
          }}
          onClick={handleLearnMore}
        >
          Learn More
        </button>
        <button
          style={{
            border: "2px solid #fff",
            backgroundColor: "transparent",
            color: "white",
            borderRadius: 30,
            marginLeft: 30,
          }}
          onClick={handleLogin}
        >
          Login
        </button>
      </div>
    </div>
  );
}
