import dotenv from 'dotenv';

dotenv.config();

const env = {
  TESTING: process.env.TESTING === 'true',
  CLIENT_ADDRESS: process.env.CLIENT_ADDRESS!,
  SERVER_PORT: process.env.SERVER_PORT!,

  FB_ADMIN_JSON: JSON.parse(process.env.FB_ADMIN_JSON!),

  AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE!,
  AUTH0_ISSUER_BASE_URL: process.env.AUTH0_ISSUER_BASE_URL!,
  AUTH0_TOKEN_SIGNING_ALG: process.env.AUTH0_TOKEN_SIGNING_ALG!,

  VAPID_SUBJECT: process.env.VAPID_SUBJECT!,
  VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY!,
  VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY!
}

for (const [key, value] of Object.entries(env)) {
  if (value === undefined) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
}

export default env;