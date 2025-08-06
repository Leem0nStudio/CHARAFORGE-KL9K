
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

            const metadataPath = path.join(packPath, 'metadata.json');
            const schemaPath = path.join(packPath, 'schema.json');
            const coverImagePath = path.join(packPath, 'cover.png');
            
            const metadataExists = await fs.access(metadataPath).then(() => true).catch(() => false);
            if (!metadataExists) {
                console.warn(`- Skipping ${packId}: metadata.json not found.`);
                continue;
            }

            let coverImageUrl = null;
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
            
             let schemaUrl = null;
             try {
                const schemaExists = await fs.access(schemaPath).then(() => true).catch(() => false);
                 if(schemaExists) {
                    const destination = `datapacks/${packId}/schema.json`;
                    await bucket.upload(schemaPath, { 
                        destination,
                        public: true
                    });
                    schemaUrl = bucket.file(destination).publicUrl();
                    console.log(`- Schema.json uploaded to ${schemaUrl}`);
                 } else {
                    console.log('- No schema.json found.');
                 }
             } catch (e) {
                console.error(`- Error uploading schema for ${packId}:`, e);
             }


            const metadataContent = await fs.readFile(metadataPath, 'utf-8');
            const metadata = JSON.parse(metadataContent);

            const docData = {
                ...metadata,
                id: packId,
                coverImageUrl: coverImageUrl,
                schemaUrl: schemaUrl,
                createdAt: FieldValue.serverTimestamp(),
            };

            await db.collection('datapacks').doc(packId).set(docData, { merge: true });
            console.log(`- Metadata for ${packId} saved to Firestore.`);
        }
        console.log('\n✅ DataPack seeding completed successfully!');

    } catch (error) {
        console.error('❌ Error during DataPack seeding process:', error);
    }
}

seedDataPacks().then(() => {
    process.exit(0);
});
