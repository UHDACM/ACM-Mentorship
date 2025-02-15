import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import AppRouting from "./AppRouting.tsx";
import { Auth0Provider } from "@auth0/auth0-react";

export function checkViteEnvironmentVariables(): void {
  const requiredVariables = [
    "VITE_AUTH0_DOMAIN",
    "VITE_AUTH0_CLIENT_ID",
    "VITE_SERVER_SOCKET_URL",
  ];

  const missingVariables: string[] = [];

  requiredVariables.forEach((variableName) => {
    if (!import.meta.env[variableName]) {
      missingVariables.push(variableName);
    }
  });

  if (missingVariables.length > 0) {
    const errorMessage = `Missing required environment variables: ${missingVariables.join(", ")}.  Please ensure these are set in your .env file or environment.`;
    // Choose your preferred way to handle this error:
    // 1. Throw an error (stops Vite):
    throw new Error(errorMessage);

    // 2. Log a warning (Vite continues):
    // console.warn(errorMessage);

    // 3. Log an error and potentially exit the process (more forceful):
    // console.error(errorMessage);
    // process.exit(1); // Exit with a non-zero code to indicate an error
  } else {
      console.log("All required environment variables are present.")
  }
}
checkViteEnvironmentVariables();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: 'http://localhost:5173/app',
        audience: "uhdacm",
        scope: "openid profile email"
      }}
    >
      <AppRouting />
    </Auth0Provider>
  </StrictMode>
);
