import { ENV_VAR_CHECK } from './scripts/env_check';
import { StartServer } from './socket/socketServer';

import dotenv from 'dotenv';
dotenv.config();


ENV_VAR_CHECK();

async function StartApp() {
  // starts express server
  try {
      await StartServer();
  } catch {}
}

async function Start() {
  await StartApp();
}

Start();