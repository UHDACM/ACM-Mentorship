import { StartServer } from './socket/socketServer';
import env from './env/env';

env; // ensure env is loaded

async function Start() {
  try {
    await StartServer();
  } catch {}
}

Start();