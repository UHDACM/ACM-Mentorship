import { useAuth0 } from "@auth0/auth0-react"
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CreateClientSocketConnection } from "../features/ClientSocket/ClientSocket";
import { Outlet, useNavigate } from "react-router-dom";
import { ReduxRootState } from "../store";

export default function App() {
  const { getAccessTokenSilently, isLoading, isAuthenticated } = useAuth0();
  
  const dispatch = useDispatch();
  const { state } = useSelector((store: ReduxRootState) => store.ClientSocket);
  const navigate = useNavigate();
  const path = window.location.pathname;
  
  useEffect(() => {
    async function getToken() {
      const userToken = await getAccessTokenSilently({ 'authorizationParams': { 'scope': 'email openid profile' } });
      console.log('accessToken', userToken);
      CreateClientSocketConnection(userToken, dispatch);
    }
    if (isAuthenticated) {
      getToken();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (state == 'authed_nouser') {
      navigate('./new-user');
    } else if (state == 'authed_user') {
      if (path == '/app' || path == '/app/new-user') {
        navigate('./home');
      }
    }
    if (!isAuthenticated && !isLoading) {
      navigate('/');
    }
  }, [state]);

  if (isLoading) {
    return <p>Still Loading...</p>
  }

  if (!isAuthenticated) {
    return <p>Not authed</p>
  }

  return <>
    <Outlet/>
  </>
}