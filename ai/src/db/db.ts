import env from "../env/env";
import admin from "firebase-admin";
import { DBObj } from "@shared/types/general";
import { collectionName } from '@shared/types/db';
import { getFirestore } from "firebase-admin/firestore";

admin.initializeApp({
  credential: admin.credential.cert(env.FB_ADMIN_JSON)
});
const db = getFirestore();


export async function DBGetWithID(collectionName: collectionName, id: string): Promise<DBObj | undefined> {
  return (await db.collection(collectionName).doc(id).get()).data();
}

export async function DBSetWithID(
  collectionName: collectionName,
  id: string,
  value: object,
  combine: boolean = false,
  testing: boolean = false // to mark as test data (for easy cleanup)
) {
  try {
    await db.collection(collectionName).doc(id).set({ ...value, testing }, { merge: combine });
  } catch {
    return false;
  }
  return true;
}


export async function DBDeleteWithID(collectionName: collectionName, id: string) {
  try {
    await db.collection(collectionName).doc(id).delete();
  } catch {
    return false;
  }
  return true;
}

