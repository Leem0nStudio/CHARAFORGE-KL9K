
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

async function seedDataPacks() {
    console.log('Starting DataPack seeding process...');

    try {
        const packFolders = await fs.readdir(DATA_PACKS_DIR);

        for (const packId of packFolders) {
            const packPath = path.join(DATA_PACKS_DIR, packId);
            const stats = await fs.stat(packPath);

            if (!stats.isDirectory()) {
                continue;
            }

            console.log(`Processing DataPack: ${packId}`);

            // The new source of truth for all pack data is datapack.json
            const dataPackJsonPath = path.join(packPath, 'datapack.json');
            const dataPackJsonExists = await fs.access(dataPackJsonPath).then(() => true).catch(() => false);

            if (!dataPackJsonExists) {
                console.warn(`- Skipping ${packId}: datapack.json not found.`);
                continue;
            }

            const dataPackContent = await fs.readFile(dataPackJsonPath, 'utf-8');
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
                    console.log('- No cover image found.');
                 }
            } catch (e) {
                console.error(`- Error uploading cover image for ${packId}:`, e);
            }
            
            // The schema is now embedded within datapack.json
            const docData = {
                ...dataPackData,
                id: packId,
                coverImageUrl: coverImageUrl,
                createdAt: FieldValue.serverTimestamp(),
            };

            // The schema is already part of docData, so no need to handle schemaUrl
            delete docData.schemaUrl;
            delete docData.schemaPath;

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
