import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CreateClientSocketConnection } from "../features/ClientSocket/ClientSocket";
import { Outlet, useNavigate } from "react-router-dom";
import { ReduxRootState } from "../store";
import Chat from "../features/Chat/Chat";
import DesktopChatWidget from "../features/Chat/DesktopChatWidget";
import MobileChatWidget from "../features/Chat/MobileChatWidget";
import Navbar from "./Navbar/Navbar";
import MinimalisticButton from "./MinimalisticButton/MinimalisticButton";
import ConnectingPage from "../pages/ConnectingPage/ConnectingPage";

export default function App() {
  const { getAccessTokenSilently, isLoading, isAuthenticated } = useAuth0();

  const dispatch = useDispatch();
  const { state } = useSelector((store: ReduxRootState) => store.ClientSocket);
  const navigate = useNavigate();
  const path = window.location.pathname;

  async function connectToServer(reconnect?: boolean) {
    const userToken = await getAccessTokenSilently();
    CreateClientSocketConnection(userToken, dispatch, reconnect);
  }

  useEffect(() => {
    if (isAuthenticated) {
      connectToServer();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    async function CheckAuthenticated() {
      // await sleep(500);
      if (state == "authed_nouser") {
        navigate("./new-user");
      } else if (state == "authed_user") {
        if (path == "/app" || path == "/app/new-user") {
          navigate("./home");
        }
      }
      if (!isAuthenticated && !isLoading) {
        navigate("/");
      }
    }
    CheckAuthenticated();
  }, [state, isAuthenticated, isLoading]);

  if (isLoading) {
    return <p>Still Loading...</p>;
  }

  if (!isAuthenticated) {
    return <p>Not authed</p>;
  }

  if (!state || state == "connecting") {
    return <ConnectingPage />;
  }

  if (state == "disconnected") {
    return (
      <div
        className="pageBase"
        style={{ justifyContent: "center", alignItems: "center" }}
      >
        <span style={{ fontSize: "1.5rem" }}>
          You're not connected to server.
        </span>
        <span style={{ fontSize: "1.1rem" }}>Please try reconnecting.</span>
        <MinimalisticButton
          style={{ marginTop: "0.5rem" }}
          onClick={() => connectToServer(true)}
        >
          Reconnect
        </MinimalisticButton>
      </div>
    );
  }

  return (
    <>
      <Chat />
      <DesktopChatWidget />
      <MobileChatWidget />
      <Navbar />
      <Outlet />
    </>
  );
}
