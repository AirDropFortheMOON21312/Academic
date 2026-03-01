import { openDB, DBSchema } from 'idb';

interface FileDB extends DBSchema {
  files: {
    key: string; // unitId_index
    value: {
      key: string;
      unitId: string;
      index: number;
      file: File | Blob;
      mimeType: string;
      name: string;
      createdAt: number;
      folder?: string;
      order?: number;
    };
    indexes: { 'by-unit': string };
  };
}

const DB_NAME = 'academic-grip-files';
const STORE_NAME = 'files';

const dbPromise = openDB<FileDB>(DB_NAME, 2, {
  upgrade(db, oldVersion, newVersion, transaction) {
    if (oldVersion < 1) {
      const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      store.createIndex('by-unit', 'unitId');
    }
    // Migration for version 2 if needed (adding fields doesn't strictly require migration if optional, but good practice)
    if (oldVersion < 2) {
       // No schema structure change, just data shape.
    }
  },
});

export const saveFiles = async (unitId: string, files: File[], startIndex: number = 0) => {
  const db = await dbPromise;
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const timestamp = Date.now();
  
  await Promise.all([
    ...files.map((file, i) => {
      const index = startIndex + i;
      return tx.store.put({
        key: `${unitId}_${index}`,
        unitId,
        index,
        file,
        mimeType: file.type,
        name: file.name,
        createdAt: timestamp,
        folder: 'Unsorted',
        order: index // Initialize order with index
      });
    }),
    tx.done,
  ]);
};

export const getFilesForUnit = async (unitId: string): Promise<Array<{ index: number; file: Blob; name: string; createdAt: number; folder?: string; mimeType: string; order?: number }>> => {
  const db = await dbPromise;
  const files = await db.getAllFromIndex(STORE_NAME, 'by-unit', unitId);
  return files.sort((a, b) => (a.order ?? a.index) - (b.order ?? b.index)).map(f => ({
    index: f.index,
    file: f.file,
    name: f.name,
    createdAt: f.createdAt || 0,
    folder: f.folder,
    mimeType: f.mimeType,
    order: f.order
  }));
};

export const updateFileOrder = async (unitId: string, index: number, newOrder: number) => {
    const db = await dbPromise;
    const key = `${unitId}_${index}`;
    const fileRecord = await db.get(STORE_NAME, key);
    if (fileRecord) {
        fileRecord.order = newOrder;
        await db.put(STORE_NAME, fileRecord);
    }
};

export const updateFileFolder = async (unitId: string, index: number, newFolder: string) => {
    const db = await dbPromise;
    const key = `${unitId}_${index}`;
    const fileRecord = await db.get(STORE_NAME, key);
    if (fileRecord) {
        fileRecord.folder = newFolder;
        await db.put(STORE_NAME, fileRecord);
    }
};

export const getFileByIndex = async (unitId: string, index: number): Promise<Blob | null> => {
  const db = await dbPromise;
  const result = await db.get(STORE_NAME, `${unitId}_${index}`);
  return result ? result.file : null;
};

export const deleteFile = async (unitId: string, index: number) => {
  const db = await dbPromise;
  await db.delete(STORE_NAME, `${unitId}_${index}`);
};

export const deleteUnitFiles = async (unitId: string) => {
  const db = await dbPromise;
  const tx = db.transaction(STORE_NAME, 'readwrite');
  let cursor = await tx.store.index('by-unit').openCursor(IDBKeyRange.only(unitId));

  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
};

export const clearAllFiles = async () => {
  const db = await dbPromise;
  await db.clear(STORE_NAME);
};
