import { expect, test } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

test('ensuring dev server is running', async ({ page }) => {
  const pageURL = process.env.VITE_AUTH0_REDIRECT_URI_BASE;
  await page.goto(`${pageURL}`);
  expect(page).toBeDefined();
});

test('ensure no test data is present in database', async () => {
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
  expect(true).toBe(true);
});
