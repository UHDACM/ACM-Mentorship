import { beforeAll } from 'vitest';
import env from 'dotenv'

env.config();

beforeAll(async () => {
    console.log('================================');
    if (process.env.SKIP_TEST_DATA_DELETION == 'true') {
        console.log('Skipping test data deletion before tests (SKIP_TEST_DATA_DELETION is true)');
        console.log('================================');
        return;
    }
    console.log('Deleting test data before tests...');
    console.log('================================');
    try {
        const response = await fetch(`http://localhost:${process.env.SERVER_PORT}/deleteTestData`, { method: 'GET' });
        if (response.status !== 200) {
            throw new Error(`failed to delete test data before tests: ${await response.text()}`);
        }
    } catch {
        throw new Error('failed to delete test data before tests: Server is not running?');
    }
});
