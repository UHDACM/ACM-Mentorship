import { test } from "@playwright/test";
import {
  setTestAuthToken,
  signUpUser,
} from "./testFunctions";
import dotenv from "dotenv";
import { sleep } from "../../src/scripts/tools";


// Define constants directly since imports are commented out
// TODO: could not resolve module paths
const MAX_NAME_LENGTH = 36;
const MAX_USERNAME_LENGTH = 32;
const MIN_USERNAME_LENGTH = 2;

// import * as userData from "../../../shared/data/user";
// import * as validation from "../../../shared/data/validation";
// const { MAX_NAME_LENGTH } = userData;
// const { MAX_USERNAME_LENGTH, MIN_USERNAME_LENGTH } = validation;

import { DialogAriaTable } from "../../src/features/Dialog/DialogData";

dotenv.config();

const incorrectParams = [
  // every field empty
  {
    fName: "",
    mName: "",
    lName: "",
    username: "",
  },
  // first name only
  {
    fName: "John",
    mName: "",
    lName: "",
    username: "",
  },
  // missing first name
  {
    fName: "",
    mName: "A.",
    lName: "Doe",
    username: "johndoe",
  },
  // missing last name
  {
    fName: "John",
    mName: "A.",
    lName: "",
    username: "johndoe",
  },
  // missing username
  {
    fName: "John",
    mName: "A.",
    lName: "Doe",
    username: "",
  },
  // too long first name
  {
    fName: "J".repeat(MAX_NAME_LENGTH + 1),
    mName: "A.",
    lName: "Doe",
    username: "johndoe",
  },
  // too long last name
  {
    fName: "John",
    mName: "A.",
    lName: "D".repeat(MAX_NAME_LENGTH + 1),
    username: "johndoe",
  },
  // too long username
  {
    fName: "John",
    mName: "A.",
    lName: "Doe",
    username: "u".repeat(MAX_USERNAME_LENGTH + 1),
  },
  // too short username
  {
    fName: "John",
    mName: "A.",
    lName: "Doe",
    username: "u".repeat(MIN_USERNAME_LENGTH - 1),
  },
];

const pageURL = process.env.VITE_AUTH0_REDIRECT_URI_BASE;
test("signs in successfully with unique username", async ({ page }) => {
  // Set a unique test token for each signup to avoid conflicts
  const noise = `${Date.now()}`.substring(7);
  await setTestAuthToken(page, `signup.${noise}`, pageURL!);
  const signUpData = {
    fName: "John",
    mName: "A.",
    lName: "Doe",
    username: `signup.${noise}`,
  };

  await test.step("successfully navigates to sign up section", async () => {
    await page.goto(`${pageURL}/app`);
    // expect page to be the same url in 1 second
    // if not, app kicks us back to home page because user is not signed in (which setTestAuthToken should have prevented)
    await sleep(1000); // Wait for the page animations to complete
    test.expect(page.url()).toBe(`${pageURL}/app/new-user`);
  });

  await test.step('fails to sign up with incorrect parameters', async () => {
    for (const params of incorrectParams) {
      await signUpUser(page, params);

      // expect error dialog to be visible
      const tutorialDialog = page.getByRole('heading', { name: /Error/ });
      await test.expect(tutorialDialog).toHaveCount(1);

      // close dialog
      const closeButton = page.getByRole('img', { name: DialogAriaTable.closeButton });
      await closeButton.click();
    }
  });

  await test.step('successfully signs up with correct parameters', async () => {
    await signUpUser(page, signUpData, {
      closeDialogAfterSignup: true,
    });
  });
});

