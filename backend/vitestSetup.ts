import dotenv from 'dotenv';
import { DeleteTestData } from './src/scripts/tools';
import { beforeAll } from 'vitest';
import env from './src/env/env';

// setups .env variable access
dotenv.config();

if (!env.TESTING) {
    throw new Error('Expected testing mode to be true, but env.TESTING='+env.TESTING);
}

beforeAll(async () => {
    await DeleteTestData();
});
