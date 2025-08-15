
require('dotenv').config({ path: './.env' });
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore, CollectionReference, Query, FieldValue } from 'firebase-admin/firestore';
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
const BATCH_SIZE = 50;


/**
 * Deletes all documents in a collection or query in batches.
 * @param query The query targeting documents to delete.
 */
async function deleteQueryBatch(query: Query) {
    const snapshot = await query.limit(BATCH_SIZE).get();
    
    if (snapshot.size === 0) {
        return; // Nothing left to delete
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();

    // Recurse on the next process tick, to avoid exploding the stack.
    await new Promise(resolve => process.nextTick(resolve));
    await deleteQueryBatch(query);
}


async function seedDataPacks() {
    console.log('🔥 Starting DataPack seeding process...');

    try {
        const localPackFolders = await fs.readdir(DATA_PACKS_DIR);
        const newPackIds = new Set(localPackFolders);

        console.log('🔎 Identifying obsolete DataPacks and associated characters...');
        const existingPacksSnapshot = await db.collection('datapacks').get();
        const obsoletePackIds = existingPacksSnapshot.docs
            .map(doc => doc.id)
            .filter(id => !newPackIds.has(id));

        if (obsoletePackIds.length > 0) {
            console.log(`🗑️  Found ${obsoletePackIds.length} obsolete DataPack(s): ${obsoletePackIds.join(', ')}`);

            // Step 1: Delete all characters associated with the obsolete datapacks
            for (const packId of obsoletePackIds) {
                console.log(`- Deleting characters created with obsolete pack: ${packId}`);
                const charactersToDeleteQuery = db.collection('characters').where('dataPackId', '==', packId);
                await deleteQueryBatch(charactersToDeleteQuery);
                console.log(`- ✅ Characters for ${packId} cleared.`);
            }

            // Step 2: Delete the obsolete datapack documents
            console.log('- Deleting obsolete DataPack documents from Firestore...');
            const batch = db.batch();
            for (const packId of obsoletePackIds) {
                batch.delete(db.collection('datapacks').doc(packId));
            }
            await batch.commit();
            console.log('- ✅ Obsolete DataPack documents cleared.');

        } else {
            console.log('👍 No obsolete DataPacks found. Proceeding to seed...');
        }
        
        // Step 3: Proceed with seeding new/updated datapacks
        for (const packId of localPackFolders) {
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
                updatedAt: FieldValue.serverTimestamp(),
            };
            
            // Use `set` with `merge: true` to create or update the document.
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
