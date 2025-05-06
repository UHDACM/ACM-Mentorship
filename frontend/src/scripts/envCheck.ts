export function checkViteEnvironmentVariables(): void {
  const requiredVariables = [
    "VITE_AUTH0_DOMAIN",
    "VITE_AUTH0_CLIENT_ID",
    "VITE_SERVER_SOCKET_URL",
    "VITE_AUTH0_REDIRECT_URI_BASE",
    "VITE_AUTH0_AUDIENCE",
    "VITE_AUTH0_SCOPE",
  ];

  const missingVariables: string[] = [];

  requiredVariables.forEach((variableName) => {
    console.log(variableName, import.meta.env[variableName]);
    if (!import.meta.env[variableName]) {
      missingVariables.push(variableName);
    }
  });

  if (missingVariables.length > 0) {
    const errorMessage = `Missing required environment variables: ${missingVariables.join(
      ", "
    )}.  Please ensure these are set in your .env file or environment.`;
    // Choose your preferred way to handle this error:
    // 1. Throw an error (stops Vite):
    throw new Error(errorMessage);

    // 2. Log a warning (Vite continues):
    // console.warn(errorMessage);

    // 3. Log an error and potentially exit the process (more forceful):
    // console.error(errorMessage);
    // process.exit(1); // Exit with a non-zero code to indicate an error
  }
}
checkViteEnvironmentVariables();