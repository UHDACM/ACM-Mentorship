const REQUIRED_ENVS = [
  "SERVER_PORT",
  "CLIENT_ADDRESS",
  "FB_API_KEY",
  "FB_AUTH_DOMAIN",
  "FB_PROJECT_ID",
  "FB_STORAGE_BUCKET",
  "FB_MESSAGING_SENDER_ID",
  "FB_APP_ID",
  'AUTH0_AUDIENCE',
  'AUTH0_ISSUER_BASE_URL',
  'AUTH0_TOKEN_SIGNING_ALG'
];
export function ENV_VAR_CHECK() {
  for (let required_env of REQUIRED_ENVS) {
    if (!process.env[required_env]) {
      throw new Error("Missing env var: " + required_env);
    }
  }
}
