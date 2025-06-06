import { Auth0Provider } from "@auth0/auth0-react";
import { LocalStorageKeys } from "@shared/data/localStorage";

export default function AuthProvider({ children }: { children: React.ReactNode  }) {
  const testMode = localStorage.getItem(LocalStorageKeys.testMode);
  if (testMode === "true") {
    // in test mode, bypass auth0 if in dev environment
    if (import.meta.env.DEV == true) {
      return <>{children}</>;
    }
  }
  
  return (
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: import.meta.env.VITE_AUTH0_REDIRECT_URI_BASE + "/app",
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        scope: import.meta.env.VITE_AUTH0_SCOPE,
      }}
      cacheLocation="localstorage"
      useRefreshTokens={true}
    >
      {children}
    </Auth0Provider>
  );
}
