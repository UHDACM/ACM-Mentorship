import { beforeAll } from 'vitest';
import env from 'dotenv'

env.config();

beforeAll(async () => {
    const response = await fetch(`http://localhost:${process.env.SERVER_PORT}/deleteTestData`, { method: 'GET' });
    if (response.status !== 200) {
        throw new Error('failed to delete test data before tests');
    }
});
