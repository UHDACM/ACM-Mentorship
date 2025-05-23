import { collectionNames, DBDelete, DBGet, DocumentTestKey } from "src/db";

/**
 * Returns a promise that resolves after `ms` milliseconds.
 * @param ms length of time in ms
 * @returns 
 */
export function sleep(ms: number) {
  return new Promise((res) => setTimeout(() => res(true), ms));
}

// deletes all test data in the database before any tests are run
export async function DeleteTestData() {
    // implement deletion of test data here
    await Promise.all(
        collectionNames.map(async (collectionName) => {
            await DBDelete(collectionName, [[DocumentTestKey, '==', true]])
        })
    );
}

// deletes all test data in the database before any tests are run
export async function CheckNoTestData() {
    // implement deletion of test data here
    const responses = await Promise.all(
        collectionNames.map(async (collectionName) => {
          return (await DBGet(collectionName, [[DocumentTestKey, '==', true]])).length != 0
        })
    );
    for (const response of responses) {
      if (response) {
        return false;
      }
    }
    return true;
}