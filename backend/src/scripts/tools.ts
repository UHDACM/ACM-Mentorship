import { DocumentTestKey } from "@shared/data/db";
import { collectionNames, DBDelete, DBGet } from "src/db";

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
  // finds them by getting documents with DocumentTestKey, which is only set on test data
  await Promise.all(
      collectionNames.map(async (collectionName) => {
          await DBDelete(collectionName, [[DocumentTestKey, '!=', '']])
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