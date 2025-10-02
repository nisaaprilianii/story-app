import { openDB } from 'idb';

const DATABASE_NAME = 'story-database';
const DATABASE_VERSION = 2;
const OBJECT_STORE_NAME = 'stories';
const OBJECT_STORE_DELETED = "deletedStories";

const dbPromise = openDB(DATABASE_NAME, DATABASE_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(OBJECT_STORE_NAME)) {
      const store = db.createObjectStore(OBJECT_STORE_NAME, { keyPath: 'id' });
      store.createIndex("pending", "pending", { unique: false })
    }
    if (!db.objectStoreNames.contains(OBJECT_STORE_DELETED)) {
      db.createObjectStore(OBJECT_STORE_DELETED, { keyPath: "id" });
    }
  },
});

export const addDeletedStory = async (id) => {
  const db = await dbPromise;
  return db.put(OBJECT_STORE_DELETED, { id: id.toString() });
};

export const getDeletedStories = async () => {
  const db = await dbPromise;
  return db.getAll(OBJECT_STORE_DELETED);
};

export const getAllStories = async () => {
  const db = await dbPromise;
  return db.getAll(OBJECT_STORE_NAME);
};

export const getPendingStories = async () => {
  const db = await dbPromise
  return db.getAllFromIndex(OBJECT_STORE_NAME, "pending", true)
}

export const markStoryAsSynced = async (id) => {
  const db = await dbPromise
  const story = await db.get(OBJECT_STORE_NAME, id.toString())
  if(story) {
    story.pending = false
    await db.put(OBJECT_STORE_NAME, story)
  }
}

export const addStory = async (story) => {
  const db = await dbPromise;
  return db.put(OBJECT_STORE_NAME, { ...story, id: story.id.toString(), offline: true });
};

export const saveStories = async (stories) => {
  const db = await dbPromise
  for (const s of stories) {
    const deleted = await db.get(OBJECT_STORE_DELETED, s.id.toString())
    if(!deleted){
      await db.put(OBJECT_STORE_NAME, {
        ...s,
        id: s.id.toString(),
        offline: false
      })
    }
  }
}

export const deleteStory = async (id) => {
  const db = await dbPromise;
  await db.put(OBJECT_STORE_DELETED, {id: id.toString()});
  return db.delete(OBJECT_STORE_NAME, id.toString());
};

export const clearStories = async () => {
  const db = await dbPromise;
  return db.clear(OBJECT_STORE_NAME);
};