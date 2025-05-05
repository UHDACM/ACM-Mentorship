import { StartServer } from './socket/socketServer';

import dotenv from 'dotenv';
dotenv.config();


const REQUIRED_ENVS = ['FIRESTORE_APIKEY', 'SERVER_PORT', 'CLIENT_ADDRESS']
function ENV_VAR_CHECK() {
  for (let required_env of REQUIRED_ENVS) {
    if (!process.env[required_env]) {
      throw new Error('Missing env var: '+required_env);
    }
  }
}
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