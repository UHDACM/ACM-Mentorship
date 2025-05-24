import dotenv from 'dotenv';
import { DeleteTestData } from './src/scripts/tools';
import { beforeAll } from 'vitest';

// setups .env variable access
dotenv.config();

if (process.env.TESTING != "true") {
    throw new Error('Expected testing mode to be true, but process.env.TESTING='+process.env.TESTING);
}

beforeAll(async () => {
    await DeleteTestData();
});
