import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { uploadToStorage } from '@/services/storage';

// Initialize Supabase Client for script usage
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL or Service Role Key is not set in environment variables.');
}
// This client is created with the service role key for admin-level access during seeding.
const supabase = createClient(supabaseUrl, supabaseKey);


const DATA_PACKS_DIR = path.join(process.cwd(), 'data', 'datapacks');

/**
 * Deletes all documents in a Supabase table in batches.
 * @param tableName The name of the table to clear.
 */
async function deleteTable(tableName: string) {
    const { error } = await supabase.from(tableName).delete().gt('created_at', '1970-01-01T00:00:00.000Z');
    if (error) throw error;
}

async function seedDataPacks() {
    console.log('🔥 Starting DataPack seeding process for Supabase...');

    try {
        // Step 1: Delete all existing datapacks from Supabase
        console.log('🗑️  Clearing existing DataPacks from Supabase...');
        await deleteTable('datapacks');
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
                    const fileContent = await fs.readFile(coverImagePath);
                    const destination = `datapacks/${packId}/cover.png`;
                    // Use the centralized uploadToStorage service, passing our admin client
                    coverImageUrl = await uploadToStorage(fileContent, destination, supabase);
                    console.log(`- Cover image uploaded to ${coverImageUrl}`);
                 } else {
                    console.log('- No cover image found for this pack.');
                 }
            } catch (e: any) {
                console.error(`- Error uploading cover image for ${packId}:`, e.message);
            }
            
            const docData = {
                id: packId,
                name: dataPackData.name,
                author: dataPackData.author,
                description: dataPackData.description,
                cover_image_url: coverImageUrl,
                type: dataPackData.type,
                price: dataPackData.price,
                tags: dataPackData.tags || [],
                schema_details: dataPackData.schema,
                is_nsfw: dataPackData.isNsfw || false,
                is_imported: dataPackData.imported || false,
            };

            const { error } = await supabase.from('datapacks').upsert(docData);
            if (error) throw error;
            console.log(`- Data for ${packId} saved to Supabase.`);
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
