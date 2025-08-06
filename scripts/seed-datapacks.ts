
require('dotenv').config({ path: './.env' });
const admin = require('firebase-admin');
const { getStorage } = require('firebase-admin/storage');
const fs = require('fs').promises;
const path = require('path');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
}


const db = admin.firestore();
const storage = getStorage();
const bucket = storage.bucket();

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
            
            // Check if metadata.json exists before proceeding
            const metadataExists = await fs.access(metadataPath).then(() => true).catch(() => false);
            if (!metadataExists) {
                console.warn(`- Skipping ${packId}: metadata.json not found.`);
                continue;
            }

            // 1. Upload cover image and get URL
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
            
            // 2. Upload schema.json and get URL
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


            // 3. Read metadata
            const metadataContent = await fs.readFile(metadataPath, 'utf-8');
            const metadata = JSON.parse(metadataContent);

            const docData = {
                ...metadata,
                id: packId,
                coverImageUrl: coverImageUrl,
                schemaUrl: schemaUrl,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            };

            // 4. Save metadata to Firestore
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
