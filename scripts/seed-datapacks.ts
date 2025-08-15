
require('dotenv').config({ path: './.env' });
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as fs from 'fs/promises';
import * as path from 'path';

// Re-initialize admin here to avoid dependency on the main server file
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!serviceAccountKey) {
  throw new Error('FATAL: FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
}

const serviceAccount = JSON.parse(serviceAccountKey);

if (!getApps().length) {
    initializeApp({
        credential: cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
}


const db = getFirestore();
const bucket = getStorage().bucket();

const DATA_PACKS_DIR = path.join(process.cwd(), 'data', 'datapacks');

/**
 * Deletes all documents in a collection in batches.
 * @param collectionRef The collection to clear.
 * @param batchSize The number of documents to delete at once.
 */
async function deleteCollection(collectionRef: FirebaseFirestore.CollectionReference, batchSize: number) {
    const query = collectionRef.orderBy('__name__').limit(batchSize);

    return new Promise<void>((resolve, reject) => {
        deleteQueryBatch(query, resolve).catch(reject);
    });
}

async function deleteQueryBatch(query: FirebaseFirestore.Query, resolve: () => void) {
    const snapshot = await query.get();

    const batchSize = snapshot.size;
    if (batchSize === 0) {
        // When there are no documents left, we are done
        resolve();
        return;
    }

    // Delete documents in a batch
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();

    // Recurse on the next process tick, to avoid
    // exploding the stack.
    process.nextTick(() => {
        deleteQueryBatch(query, resolve);
    });
}


async function seedDataPacks() {
    console.log('🔥 Starting DataPack seeding process...');

    try {
        // Step 1: Delete all existing datapacks from Firestore
        console.log('🗑️  Clearing existing DataPacks from Firestore...');
        const collectionRef = db.collection('datapacks');
        await deleteCollection(collectionRef, 50);
        console.log('✅ Existing DataPacks cleared.');
        
        // Step 2: Proceed with seeding new datapacks
        const packFolders = await fs.readdir(DATA_PACKS_DIR);

        for (const packId of packFolders) {
            const packPath = path.join(DATA_PACKS_DIR, packId);
            const stats = await fs.stat(packPath);

            if (!stats.isDirectory()) {
                continue;
            }

            console.log(`\n📦 Processing DataPack: ${packId}`);

            const dataPackJsonPath = path.join(packPath, 'datapack.json');
            let dataPackJsonExists = false;
            try {
                await fs.access(dataPackJsonPath);
                dataPackJsonExists = true;
            } catch {
                // File doesn't exist
            }

            if (!dataPackJsonExists) {
                console.warn(`- Skipping ${packId}: datapack.json not found.`);
                continue;
            }

            const dataPackContent = await fs.readFile(dataPackJsonPath, 'utf-8');
            // Check if content is empty (for deletion)
            if (dataPackContent.trim() === '') {
                console.log(`- Skipping ${packId} as its datapack.json is empty.`);
                continue;
            }
            
            const dataPackData = JSON.parse(dataPackContent);

            let coverImageUrl = null;
            const coverImagePath = path.join(packPath, 'cover.png');
            
            try {
                 const coverImageExists = await fs.access(coverImagePath).then(() => true).catch(() => false);
                 if (coverImageExists) {
                    const destination = `datapacks/${packId}/cover.png`;
                    await bucket.upload(coverImagePath, { 
                        destination,
                        public: true 
                    });
                    coverImageUrl = bucket.file(destination).publicUrl();
                    console.log(`- Cover image uploaded to ${coverImageUrl}`);
                 } else {
                    console.log('- No cover image found for this pack.');
                 }
            } catch (e) {
                console.error(`- Error uploading cover image for ${packId}:`, e);
            }
            
            const docData = {
                ...dataPackData,
                id: packId,
                coverImageUrl: coverImageUrl,
                createdAt: FieldValue.serverTimestamp(),
            };

            await db.collection('datapacks').doc(packId).set(docData, { merge: true });
            console.log(`- Data for ${packId} saved to Firestore.`);
        }
        console.log('\n✅ DataPack seeding completed successfully!');

    } catch (error) {
        console.error('❌ Error during DataPack seeding process:', error);
    }
}

seedDataPacks().then(() => {
    // Force exit after completion
    process.exit(0);
});
