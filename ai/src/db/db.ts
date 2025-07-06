import env from "../env/env";
import admin from "firebase-admin";
import { DBObj } from "@shared/types/general";
import { collectionName } from '@shared/types/db';
import { getFirestore } from "firebase-admin/firestore";

admin.initializeApp({
  credential: admin.credential.cert(env.FB_ADMIN_JSON)
});
const db = getFirestore();

type comparisonOperator =
  | "<"
  | ">"
  | "<="
  | ">="
  | "=="
  | "!="
  | "array-contains";
type queryTuple = [
  string,
  comparisonOperator,
  string | null | number | boolean
];
type queryStyle = "or" | "and";


export async function DBGetWithID(collectionName: collectionName, id: string): Promise<DBObj | undefined> {
  return (await db.collection(collectionName).doc(id).get()).data();
}

// same as backend DBGet, minus the cache and ordering (not needed here yet)
export async function DBGet(
  collectionName: collectionName,
  queries?: queryTuple[],
  queryStyle?: queryStyle,
  limit?: number
): Promise<DBObj[]> {
  let queryRef: FirebaseFirestore.Query = db.collection(collectionName);

  if (queries && queries.length > 0) {
    if (queryStyle === "or") {
      const filters = queries.map(([field, op, val]) =>
        admin.firestore.Filter.where(field, op, val)
      );
      queryRef = queryRef.where(admin.firestore.Filter.or(...filters));
    } else {
      for (const [field, op, val] of queries) {
        queryRef = queryRef.where(field, op, val);
      }
    }
  }

  if (limit) {
    queryRef = queryRef.limit(limit);
  }

  const res = await queryRef.get();

  if (res.empty) {
    return [];
  }

  const results: DBObj[] = [];
  res.forEach((doc) => {
    results.push({ ...doc.data(), id: doc.id });
  });

  return results;
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
