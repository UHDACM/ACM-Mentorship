

const env = {
  VITE_AUTH0_DOMAIN: `${import.meta.env.VITE_AUTH0_DOMAIN}`,
  VITE_AUTH0_CLIENT_ID: `${import.meta.env.VITE_AUTH0_CLIENT_ID}`,
  VITE_AUTH0_REDIRECT_URI_BASE: `${import.meta.env.VITE_AUTH0_REDIRECT_URI_BASE}`,
  VITE_AUTH0_AUDIENCE: `${import.meta.env.VITE_AUTH0_AUDIENCE}`,
  VITE_AUTH0_SCOPE: `${import.meta.env.VITE_AUTH0_SCOPE}`,
  VITE_SERVER_SOCKET_URL: `${import.meta.env.VITE_SERVER_SOCKET_URL}`,
  VITE_VAPID_PUBLIC_KEY: `${import.meta.env.VITE_VAPID_PUBLIC_KEY}`,

  DEV: Boolean(import.meta.env.DEV),
  
  VITE_AI_ENDPOINT: `${import.meta.env.VITE_AI_ENDPOINT}`,
  
  OBSCURE_MODE: import.meta.env.VITE_OBSCURE_MODE == 'true' ? true : false,
  
  
  SERVER_PORT: `${import.meta.env.SERVER_PORT}`,
  SKIP_TEST_DATA_DELETION: `${import.meta.env.VITE_SKIP_TEST_DATA_DELETION}` === 'true',
};

console.log(env.OBSCURE_MODE);

const optionalEnvVars = [
  "OBSCURE_MODE",

  "SERVER_PORT",
  "SKIP_TEST_DATA_DELETION",
];
for (const [key, value] of Object.entries(env)) {
  if (optionalEnvVars.includes(key)) {
    continue; // skip check for this variable
  }

  if (value === 'undefined' || value === undefined || value === '') {
    console.error(`Environment variable ${key} is not set or is undefined.`);
  }
}

export default env;
