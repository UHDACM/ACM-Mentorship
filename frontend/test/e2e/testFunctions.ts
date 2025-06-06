import { expect, Page } from "@playwright/test";
import { DialogAriaTable } from "../../src/features/Dialog/DialogData";

/**
 * In test mode, sets a dummy auth token in local storage to simulate an authenticated user.
 *
 * This is possible because in test mode, the app checks for 'testMode' in local storage
 * and uses the 'testToken' value as the auth token if present.
 *
 * effectively bypasses the normal Auth0 authentication flow for testing purposes.
 *
 * See `useAuth` hook and `AuthProvider` feature in the main app for more details.
 *
 * @param page
 * @param token
 * @param pageURL
 */
export async function setTestAuthToken(
  page: Page,
  token: string,
  pageURL: string
) {
  await page.goto(`${pageURL}`);
  await page.evaluate(
    ([token]) => {
      localStorage.setItem("testToken", token);
      localStorage.setItem("testMode", "true");
    },
    [token]
  );
}

interface SignUpUserData {
  fName: string;
  mName: string;
  lName: string;
  username: string;
}

interface SignUpUserOptions {
  closeDialogAfterSignup?: boolean;
}

/**
 * Takes a Playwright page and fills out the signup form with the provided user data.
 *
 * Can automatically close the tutorial (or any other dialog) after signup if specified in options.
 *
 * @param page
 * @param userData
 * @param options
 */
export async function signUpUser(
  page: Page,
  userData: SignUpUserData,
  options?: SignUpUserOptions
) {
  const { fName, mName, lName, username } = userData;

  const fNameInput = page.getByRole("textbox", { name: "fName" });
  // await fNameInput.waitFor({ state: 'visible', timeout: 5000 });
  const mNameInput = page.getByRole("textbox", { name: "mName" });
  const lNameInput = page.getByRole("textbox", { name: "lName" });
  const usernameInput = page.getByRole("textbox", { name: "username" });

  await expect(fNameInput).toBeVisible();
  await expect(mNameInput).toBeVisible();
  await expect(lNameInput).toBeVisible();
  await expect(usernameInput).toBeVisible();

  await fNameInput.fill(fName);
  await mNameInput.fill(mName);
  await lNameInput.fill(lName);
  await usernameInput.fill(username);

  const submitButton = page.getByRole("button", { name: "submit" });
  await expect(submitButton).toBeVisible();
  await submitButton.click();

  const { closeDialogAfterSignup } = options || {};

  if (closeDialogAfterSignup) {
    const closeTutorialButton = page.getByRole("img", {
      name: DialogAriaTable.closeButton,
    });
    await expect(closeTutorialButton).toBeVisible();
    await closeTutorialButton.click();
  }
}


// export async function getPushSubscription(
//   page: Page,
//   timeout: number = 5000
// ): Promise<PushSubscriptionJSON | undefined> {
//   return await page.evaluate(async (timeout) => {
//     let start = Date.now();
//     let registration = await navigator.serviceWorker.getRegistration();

//     const sleep = (ms: number) =>
//       new Promise((resolve) => setTimeout(resolve, ms));

//     while (!registration) {
//       if (Date.now() - start > timeout) {
//         return;
//       }
//       await sleep(100);
//       registration = await navigator.serviceWorker.getRegistration();
//     }

//     let subscription: PushSubscription | undefined = undefined;
//     while (!subscription) {
//       if (Date.now() - start > timeout) {
//         return;
//       }
//       await sleep(100);
//       if (!registration.pushManager) {
//         continue;
//       }
//       try {
//         // Try to get the subscription (it throws if not yet available)
//         subscription =
//           (await registration.pushManager.getSubscription()) || undefined;
//       } catch {}
//     }

//     console.log('got subscription:', subscription);
//     return subscription ? subscription.toJSON() : undefined;
//   }, timeout);
// }
