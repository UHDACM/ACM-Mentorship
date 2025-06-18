import { Auth0Provider } from "@auth0/auth0-react";
import { LocalStorageKeys } from "@shared/data/localStorage";
import env from "../../scripts/env";

export default function AuthProvider({ children }: { children: React.ReactNode  }) {
  const testMode = localStorage.getItem(LocalStorageKeys.testMode);
  if (testMode === "true") {
    // in test mode, bypass auth0 if in dev environment
    if (env.DEV == true) {
      return <>{children}</>;
    }
  }
  
  return (
    <Auth0Provider
      domain={env.VITE_AUTH0_DOMAIN}
      clientId={env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: env.VITE_AUTH0_REDIRECT_URI_BASE + "/app",
        audience: env.VITE_AUTH0_AUDIENCE,
        scope: env.VITE_AUTH0_SCOPE,
      }}
      cacheLocation="localstorage"
      useRefreshTokens={true}
    >
      {children}
    </Auth0Provider>
  );
}
