// agnostic useAuth hook (for any auth)
// is connected to redux state and client socket internally

import { useAuth0 } from "@auth0/auth0-react";
import { MyClientSocket } from "../../features/ClientSocket/ClientSocketHandler";
import { LocalStorageKeys } from "@shared/data/localStorage";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addDialog, closeDialog } from "../../features/Dialog/DialogSlice";
import env from "../../scripts/env";

export default function useAuth() {
  // check for test mode
  // allows e2e tests to set testMode in localStorage to use test auth
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const testMode = localStorage.getItem(LocalStorageKeys.testMode);

  const {
    getAccessTokenSilently: getAccessTokenSilentlyAuth0,
    logout: authLogout,
    loginWithRedirect: authLoginWithRedirect,
    isLoading,
    isAuthenticated,
  } = useAuth0();

  if (testMode === "true") {
    // in test mode, use test auth
    if (env.DEV == true) {
      return GetTestAuth();
    }
    // in non-test environment but testMode is true, fallback to real auth
  }

  function logout() {
    // perform any additional logout logic here (e.g., clear local storage, notify server, etc.)
    MyClientSocket?.logout();
    authLogout({ logoutParams: { returnTo: window.location.origin } });
  }

  function loginWithRedirect() {
    authLoginWithRedirect({'authorizationParams': { scope: 'openid profile email' }});
  }

  async function getAccessTokenSilently() {
    try {
      return await getAccessTokenSilentlyAuth0();
    } catch {
      // if error occurs (e.g., token expired), redirect to login
      navigate("/", { replace: true });
      setTimeout(() => dispatch(addDialog({
        title: "Please Log In",
        subtitle: "Your session has expired, or is invalid. Please log in again.",
        buttons: [{ text: "Okay", onClick: () => dispatch(closeDialog()) }],
      })), 500); // delay to allow navigation to complete
      return undefined;
    }
  }

  return {
    getAccessTokenSilently,
    logout,
    loginWithRedirect,
    isLoading,
    isAuthenticated,
  };
}


function GetTestAuth() {
  function getAccessTokenSilently() {
    return localStorage.getItem(LocalStorageKeys.testToken) || "";
  }

  function logout() {
    // perform any additional logout logic here (e.g., clear local storage, notify server, etc.)
    MyClientSocket?.logout();
    localStorage.removeItem(LocalStorageKeys.testToken);

    // returns to home page after logout
    window.location.href = "/";
  }

  function loginWithRedirect() {
    // goes to app page after login
    window.location.href = "/app";
  }
  

  return {
    getAccessTokenSilently,
    logout,
    loginWithRedirect,
    isLoading: false,
    isAuthenticated: localStorage.getItem(LocalStorageKeys.testToken) ? true : false,
  };
}
