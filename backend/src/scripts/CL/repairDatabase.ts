import { DBGet, DBSetWithID } from "../../../src/db";

async function GetUsersAndRepair() {
  const users = await DBGet('user');

  const promises: Promise<void>[] = [];
  for (const user of users) {
    if (!user.profile) {
      if (!Object.keys(user).includes('mentorID')) {
        continue;
      }

      // old user obj had mentorID = string. new user obj has mentorIDs = string[]
      const mentorID = user.mentorID;
      const mentorIDs: string[] = [];
      if (mentorID) {
        mentorIDs.push(mentorID);
      }
      delete user.mentorID;
      user.mentorIDs = mentorIDs;
      console.log(`Repaired user with id: ${user.id}`);
      console.log(JSON.stringify(user, null, 2));
      // await DBSetWithID('user', user.id, user);
      promises.push(DBSetWithID('user', user.id, user));
    }
  }

  await(Promise.all(promises));
}

console.log('ran repair script');
