// agnostic useAuth hook (for any auth)
// is connected to redux state and client socket internally

import { useAuth0 } from "@auth0/auth0-react";
import { MyClientSocket } from "../../features/ClientSocket/ClientSocketHandler";

export default function useAuth() {
  // implement auth logic here (e.g., check token validity, refresh tokens, etc.)
  const {
    getAccessTokenSilently,
    logout: authLogout,
    loginWithRedirect: authLoginWithRedirect,
    isLoading,
    isAuthenticated,
  } = useAuth0();

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
