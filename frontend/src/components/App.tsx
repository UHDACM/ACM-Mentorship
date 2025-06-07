import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CreateClientSocketConnection, MyClientSocket } from "../features/ClientSocket/ClientSocketHandler";
import { Outlet, useNavigate } from "react-router-dom";
import { ReduxRootState } from "../store";
import Chat from "../features/Chat/Chat";
import DesktopChatWidget from "../features/Chat/DesktopChatWidget";
import MobileChatWidget from "../features/Chat/MobileChatWidget";
import Navbar from "./Navbar/Navbar";
import MinimalisticButton from "./MinimalisticButton/MinimalisticButton";
import ConnectingPage from "../pages/ConnectingPage/ConnectingPage";
import { setPreviousUserID } from "../features/ClientSocket/ClientSocketSlice";
import NotificationManager from "../features/NotificationManager/NotificationManager";
import { LocalStorageKeys } from "@shared/data/localStorage";
import useAuth from "../hooks/UseAuth/useAuth";
import NoficiationEncourageEnable from "../features/NotificationManager/NotificationEncourageEnable";

export default function App() {
  const { getAccessTokenSilently, isLoading, isAuthenticated, logout } = useAuth();

  const dispatch = useDispatch();
  const { state } = useSelector((store: ReduxRootState) => store.ClientSocket);
  const navigate = useNavigate();
  const path = window.location.pathname;

  async function connectToServer(reconnect?: boolean) {
    const userToken = await getAccessTokenSilently();
    CreateClientSocketConnection(userToken, { dispatch, navigate, logout }, reconnect);
  }

  // on mount, load previousUserID from localStorage if exists into redux, and replace it with current userID in 10 seconds
  const [loadedPrevID, setLoadedPrevID] = useState(false);
  useEffect(() => {
    if (loadedPrevID) return;
    // only states where user has created an account
    if (!MyClientSocket) {
      return;
    }
    
    if (state != 'authed_user') {
      return;
    }

    // safety timeout to prevent infinite loop
    const timeout = setTimeout(() => {
      console.log('App: previousUserID loading timeout reached');
      setLoadedPrevID(true);
      dispatch(setPreviousUserID(''));
    }, 10000);

    setLoadedPrevID(true);
    clearTimeout(timeout);
    const localStoragePreviousUserIDKey = LocalStorageKeys.previousUserID;
    const prevID = localStorage.getItem(localStoragePreviousUserIDKey) || '';
    dispatch(setPreviousUserID(prevID));

    setTimeout(() => {
      console.log('App: updating previousUserID in localStorage to current userID:', MyClientSocket?.user?.id);
      localStorage.setItem(localStoragePreviousUserIDKey, MyClientSocket?.user?.id || "");
      dispatch(setPreviousUserID(MyClientSocket?.user?.id || ""));
    }, 10000);
  }, [state, loadedPrevID]);

  // on mount, connect to server if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      connectToServer();
    }
  }, [isAuthenticated]);

  // on state change, check if user is authenticated, redirect as needed
  useEffect(() => {
    async function CheckAuthenticated() {
      // await sleep(500);
      if (state == "authed_nouser") {
        navigate("./new-user", { replace: true });
      } else if (state == "authed_user") {
        if (path == "/app" || path == "/app/new-user") {
          navigate("./home", { replace: true });
        }
      }
      if (!isAuthenticated && !isLoading) {
        navigate("/", { replace: true });
      }
    }
    CheckAuthenticated();
  }, [state, isAuthenticated, isLoading]);

  if (isLoading) {
    return <p>({isLoading}) Still Loading...</p>;
  }

  if (!isAuthenticated) {
    return <p>Not authed</p>;
  }

  console.log('state bru', state);

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

      <NotificationManager />
      <NoficiationEncourageEnable />

      <Outlet />
    </>
  );
}
