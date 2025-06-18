import { LRUCache } from "lru-cache"; // for caching

import { collectionName } from '@shared/types/db';
import { DBObj } from "@shared/types/general";
import env from './env/env';

import admin from "firebase-admin";
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
type orderDirection = "asc" | "desc";
type orderTuple = [string, orderDirection];


type NonHitCacheState = 'Nonexistent';
const DBCacheMaxItems = 15000; // currently optimized for 512 mb of ram.
const DBCache = new LRUCache<string, DBObj | NonHitCacheState>({ max: DBCacheMaxItems });

export async function DBGetWithID(
  collectionName: collectionName,
  id: string
): Promise<DBObj | undefined> {
  if (!id) {
    throw new Error('DBGetWithID called with empty id');
  }
  try {
    // try fetching from cache first.
    const cacheRes = CacheGet(collectionName, id);
    if (cacheRes == 'Nonexistent') {
      return undefined;
    } else if (cacheRes) {
      return { ...cacheRes }; // avoids mutations
    }

    // if cache is empty, fetch from db
    const res = (await db.collection(collectionName).doc(id).get()).data();
    if (!res) {
      // if no db hit, then mark in cache that this item does not exist.
      CacheSet(collectionName, id, 'Nonexistent');
      return undefined;
    }
    const resComb = { ...res, id };
    // if db hit, then store data in cache.
    CacheSet(collectionName, id, resComb);
    return { ...resComb };
  } catch (error) {
    console.error(`Error in DBGetWithID(${collectionName}, ${id}): ${error}`);
    return undefined;
  }
}

export async function DBGet(
  collectionName: collectionName,
  queries?: queryTuple[],
  queryStyle?: queryStyle,
  order?: orderTuple,
  limit?: number
): Promise<DBObj[]> {
  let queryRef: FirebaseFirestore.Query = db.collection(collectionName);

  // --- Apply filters ---
  if (queries && queries.length > 0) {
    const filters = queries.map(([field, op, val]) =>
      admin.firestore.Filter.where(field, op, val)
    );

    if (queryStyle === "or") {
      // Requires firebase-admin >= v11.9
      queryRef = queryRef.where(admin.firestore.Filter.or(...filters));
    } else {
      // AND logic = chain .where()
      for (const [field, op, val] of queries) {
        queryRef = queryRef.where(field, op, val);
      }
    }
  }

  if (limit) {
    queryRef.limit(limit);
  }

  // --- Apply ordering ---
  if (order) {
    const [field, direction] = order;
    queryRef = queryRef.orderBy(field, direction);
  }

  // --- Execute query ---
  const res = await queryRef.get();

  if (res.empty) return [];

  const results: DBObj[] = [];

  res.forEach((doc) => {
    const val = { ...doc.data(), id: doc.id };
    CacheSet(collectionName, doc.id, val); // keep your caching logic
    results.push(val);
  });

  return results;
}

export async function DBSet(
  collectionName: collectionName,
  value: object,
  queries?: queryTuple[],
  queryStyle?: queryStyle,
  combine: boolean = false
) {
  const res = await DBGet(collectionName, queries, queryStyle);
  res.forEach(async (obj) => {
    let newObj: object;
    if (combine) {
      newObj = { ...obj, ...value };
    } else {
      newObj = value;
    }
    CacheSet(collectionName, obj.id, { ...newObj, id: obj.id });
    await db.collection(collectionName).doc(obj.id).set(newObj);
  });
}

export async function DBSetWithID(
  collectionName: collectionName,
  id: string,
  value: object,
  combine: boolean = false
) {
  let newObj: object;
  if (combine) {
    const obj = await DBGetWithID(collectionName, id); // needed to update cache. If item is in cache already, this fetches it from there.
    newObj = { ...obj, ...value };
  } else {
    newObj = value;
  }
  await db.collection(collectionName).doc(id).set(newObj);
  CacheSet(collectionName, id, { ...newObj, id });
}

/**
 * Create a new document with an auto-generated ID
 */
export async function DBCreate(collectionName: collectionName, value: object) {
  const docRef = await db.collection(collectionName).add(value); // add() auto-generates ID
  const resID = docRef.id;

  CacheSet(collectionName, resID, { ...value, id: resID });

  return resID;
}

/**
 * Create or overwrite a document with a specific ID
 */
export async function DBCreateWithID(
  collectionName: collectionName,
  value: object,
  id: string
) {
  await db.collection(collectionName).doc(id).set(value);

  CacheSet(collectionName, id, { ...value, id });
}

export async function DBDelete(
  collectionName: collectionName,
  queries?: queryTuple[],
  queryStyle?: "and" | "or"
) {
  // Get documents matching the query
  const docs = await DBGet(collectionName, queries, queryStyle);

  // Delete all documents in parallel
  await Promise.all(
    docs.map(async (obj) => {
      await db.collection(collectionName).doc(obj.id).delete();
      CacheDelete(collectionName, obj.id);
    })
  );
}

export async function DBDeleteWithID(collectionName: collectionName, id: string) {
  await db.collection(collectionName).doc(id).delete();
  CacheDelete(collectionName, id);
}

function CacheGet(collection: collectionName, id: string) {
  return DBCache.get(collection + id);
}

function CacheSet(collection: collectionName, id: string, val: DBObj | NonHitCacheState) {
  DBCache.set(collection + id, val);
}

function CacheDelete(collection: collectionName, id: string) {
  // this is done so subsequent get requests don't need to check DB to see item was deleted.
  DBCache.set(collection + id, 'Nonexistent');
}

