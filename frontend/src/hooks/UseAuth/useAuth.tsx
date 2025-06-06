// agnostic useAuth hook (for any auth)
// is connected to redux state and client socket internally

import { useAuth0 } from "@auth0/auth0-react";
import { MyClientSocket } from "../../features/ClientSocket/ClientSocketHandler";
import { LocalStorageKeys } from "@shared/data/localStorage";

export default function useAuth() {
  // check for test mode
  // allows e2e tests to set testMode in localStorage to use test auth
  const testMode = localStorage.getItem(LocalStorageKeys.testMode);

  const {
    getAccessTokenSilently,
    logout: authLogout,
    loginWithRedirect: authLoginWithRedirect,
    isLoading,
    isAuthenticated,
  } = useAuth0();

  if (testMode === "true") {
    // in test mode, use test auth
    if (import.meta.env.DEV == true) {
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
