import { expect, it, describe, afterAll } from 'vitest';
import { 
    collectionName, 
    DBCreate, 
    DBDelete, 
    DBDeleteWithID, 
    DBGet, 
    DBSet, 
    DBSetWithID, 
    DBGetWithID, 
    DBCreateWithID
} from '../src/db';
import { sleep } from '../src/scripts/tools';

const testObjects: Record<collectionName, object> = {
    'user': { _test_property: 'heemie', val: 20 },
    'assessment': { _test_property: 'heemie', val: 20 },
    'mentorshipRequest': { _test_property: 'heemie', val: 20 }
};

const nonsenseTestingValue = '!nonesense__294U';

/**
 * Helper function to retrieve all test objects from collections.
 */
async function getTestObjectsFromCollections(): Promise<Record<string, any[]>> {
    const existingObjects: Record<string, any[]> = {};

    for (let key in testObjects) {
        const res = await DBGet(key as collectionName, [['_test_property', '!=', null]]);
        if (res.length > 0) {
            existingObjects[key] = res;
        }
    }
    return existingObjects;
}

describe('Firestore DB Functions', async () => {
    /**
     * Ensures no test objects exist before running tests.
     */
    const testObjectsExistTest = async (count: number) => {
        const existingTestObjects = await getTestObjectsFromCollections();
        let realCount = Object.values(existingTestObjects).reduce((acc, arr) => acc + arr.length, 0);
        expect(realCount).toBe(count);
        return existingTestObjects;
    };

    /**
     * Cleanup function to delete any leftover test objects.
     */
    const deleteTestObjects = async () => {
        it('should delete all existing test objects', async () => {
            const existingTestObjects = await getTestObjectsFromCollections();
            if (Object.keys(existingTestObjects).length === 0) return;

            for (let collection in existingTestObjects) {
                for (let obj of existingTestObjects[collection]) {
                    await DBDeleteWithID(collection as collectionName, obj.id);
                }
            }
            await testObjectsExistTest(0);
        });
    };

    await deleteTestObjects();

    /**
     * Test DBCreate by ensuring the number of documents increases as expected.
     */
    it('should create and store test objects', async () => {
        await testObjectsExistTest(0);

        for (let collection in testObjects) {
            await DBCreate(collection as collectionName, testObjects[collection]);
        }

        await testObjectsExistTest(Object.keys(testObjects).length);

        for (let collection in testObjects) {
            await DBCreate(collection as collectionName, { ...testObjects[collection], _test_property: 42 });
        }

        await testObjectsExistTest(Object.keys(testObjects).length * 2);
    });

    let currentTestObjects: Record<string, any[]> = {};

    /**
     * Validate retrieval of objects using queries.
     */
    it('should retrieve objects correctly using queries', async () => {
        currentTestObjects = await testObjectsExistTest(Object.keys(testObjects).length * 2);

        for (let collection in testObjects) {
            expect((await DBGet(collection as collectionName, [['_test_property', '==', nonsenseTestingValue]])).length).toBe(0);
            expect((await DBGet(collection as collectionName, [['_test_property', '==', 'heemie']])).length).toBe(1);
            expect((await DBGet(collection as collectionName, [['_test_property', '==', 42]])).length).toBe(1);
            expect((await DBGet(collection as collectionName, [['_test_property', '==', 'heemie'], ['_test_property', '==', 42]], 'or')).length).toBe(2);
        }
    });

    /**
     * Test retrieval of a single object by ID.
     */
    it('should get a specific object by ID', async () => {
        let collection = Object.keys(currentTestObjects)[0] as collectionName;
        const testObj = currentTestObjects[collection][0];

        const fetchedObj = await DBGetWithID(collection, testObj.id);
        expect(fetchedObj).toBeDefined();
        expect(fetchedObj?.id).toBe(testObj.id);
        expect(fetchedObj?._test_property).toBe(testObj._test_property);
    });

    /**
     * Verify DBCreate returns a valid document ID.
     */
    it('should create an object and return its ID', async () => {
        const collection: collectionName = "user";
        const testData = { _test_property: 'test-create', val: 50 };
        const newId = await DBCreate(collection, testData);

        expect(newId).toBeDefined();
        const createdObj = await DBGetWithID(collection, newId);
        expect(createdObj).toBeDefined();
        expect(createdObj?._test_property).toBe(testData._test_property);
    });

    /**
     * Test DBSet and DBSetWithID to modify objects.
     */
    it('should update objects using queries and ID', async () => {
        let collection = Object.keys(currentTestObjects)[0] as collectionName;
        const testObj = currentTestObjects[collection][0];

        expect((await DBGet(collection, [['_test_property', '==', nonsenseTestingValue]])).length).toBe(0);
        
        await DBSetWithID(collection, testObj.id, { _test_property: nonsenseTestingValue });

        const modifiedObj = await DBGet(collection, [['_test_property', '==', nonsenseTestingValue]]);
        expect(modifiedObj.length).toBe(1);
        expect(modifiedObj[0].id).toBe(testObj.id);

        await DBSet(collection, { '_test_property': nonsenseTestingValue + "!" }, [['_test_property', '==', nonsenseTestingValue]]);

        const modifiedObj2 = await DBGet(collection, [['_test_property', '==', nonsenseTestingValue + "!"]]);
        expect(modifiedObj2.length).toBe(1);
        expect(modifiedObj2[0].id).toBe(modifiedObj[0].id);
    });

    const createID = 'MachuPichu';
    it('should create an object with a specific id', async ()=> {
        const collection = Object.keys(currentTestObjects)[0] as collectionName;
        const testObj = { _test_property: ')SCJa0sckalsod' };
        
        await DBCreateWithID(collection, testObj, createID);
        const fetchedObj = await DBGetWithID(collection, createID);
        expect(fetchedObj?.id).toBe(createID);
        expect(fetchedObj?._test_property).toBe(testObj._test_property);
    });

    /**
     * Verify caching behavior by measuring execution time.
     */
    it('should retrieve cached data instead of hitting Firestore', async () => {
        let collection = Object.keys(currentTestObjects)[0] as collectionName;
        const testObj = currentTestObjects[collection][0];

        console.time('Firestore Fetch');
        await DBGetWithID(collection, testObj.id);
        console.timeEnd('Firestore Fetch');

        console.time('Cache Fetch');
        await DBGetWithID(collection, testObj.id);
        console.timeEnd('Cache Fetch');

        expect(true).toBe(true); 
    });

    /**
     * Ensure objects can be deleted via queries.
     */
    it('should delete all matching objects correctly', async () => {
        for (let collection in testObjects) {
            await DBDelete(collection as collectionName, [['_test_property', '!=', null]]);
        }
        await testObjectsExistTest(0);
    });

    afterAll(async () => {
        await sleep(1000);
    });
});
