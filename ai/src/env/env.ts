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

  AI_API_KEY: process.env.AI_API_KEY!,
  AI_MODEL_NAME: process.env.AI_MODEL_NAME!,
  AI_SYSTEM_PROMPT: process.env.AI_SYSTEM_PROMPT!,
  AI_LIMITS: (() => {
    const limits = process.env.AI_LIMITS ? JSON.parse(process.env.AI_LIMITS) : undefined
    if (!limits) {
      throw new Error("AI_LIMITS environment variable is not defined or invalid");
    }

    if (typeof limits.tokensUsedLastHour !== 'number' || typeof limits.requestsMadeLastHour !== 'number' || typeof limits.maxTokensPerRequest !== 'number') {
      throw new Error("AI_LIMITS environment variable is invalid");
    }



    return {
      tokensUsedLastHour: Number(limits.tokensUsedLastHour),
      requestsMadeLastHour: Number(limits.requestsMadeLastHour),
      maxTokensPerRequest: Number(limits.maxTokensPerRequest),
    };
  })(),
}

for (const [key, value] of Object.entries(env)) {
  if (value === undefined) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
}

export default env;