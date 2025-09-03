

'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { DataPack, UpsertDataPack, DataPackSchema } from '@/types/datapack';
import { UpsertDataPackSchema, DataPackSchemaSchema } from '@/types/datapack';
import { verifyAndGetUid, verifyIsAdmin } from '@/lib/auth/server';
import { uploadToStorage } from '@/services/storage';
import AdmZip from 'adm-zip';
import yaml from 'js-yaml';
import path from 'path';


export type ActionResponse = {
    success: boolean;
    message: string;
    error?: string;
    packId?: string;
};

async function dataPackFromRow(row: any): Promise<DataPack> {
    return {
        id: row.id,
        name: row.name,
        author: row.author,
        description: row.description,
        coverImageUrl: row.cover_image_url,
        type: row.type,
        price: row.price,
        tags: row.tags || [],
        createdAt: new Date(row.created_at).getTime(),
        updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : null,
        schema: row.schema_details, // Assuming schema_details is the JSONB column
        isNsfw: row.is_nsfw,
        imported: row.is_imported,
        // 'extends' and 'includes' are not in the provided schema, so they are omitted.
    };
}


async function buildSchemaFromFiles(files: { name: string; content: string }[]): Promise<DataPackSchema> {
    const finalSchema: DataPackSchema = {
        promptTemplates: [],
        characterProfileSchema: {}
    };
    let allParsedData: any = {};

    for (const file of files) {
        const ext = path.extname(file.name).toLowerCase();
        let parsedContent: any;
        try {
            if (ext === '.yaml' || ext === '.yml') {
                const content = file.content.replace(/^#.*$/gm, '').trim();
                if (content) parsedContent = yaml.load(content);
            } else if (ext === '.txt') {
                const baseName = path.basename(file.name, ext);
                const lines = file.content.split(/[\r\n]+/).map(s => s.trim()).filter(Boolean);
                if (lines.length > 0) parsedContent = { [baseName]: lines };
            }
        } catch (e) {
            console.warn(`Could not parse file ${file.name}. It may be empty or malformed.`, e);
            continue;
        }
        
        if (parsedContent && typeof parsedContent === 'object') {
            allParsedData = { ...allParsedData, ...parsedContent };
        }
    }
    
    const processNode = (node: any, pathParts: string[] = []) => {
        if (typeof node !== 'object' || node === null) return;
        Object.entries(node).forEach(([key, value]) => {
            const currentPath = [...pathParts, key];
            if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
                const slotKey = currentPath.join('_');
                const containsWildcards = value.some((item: string) => item.includes('{') && item.includes('}'));
                if (containsWildcards) {
                    finalSchema.promptTemplates.push({
                        name: slotKey,
                        template: value.join('\n'),
                    });
                } else {
                    (finalSchema.characterProfileSchema as any)[slotKey] = value.map((item: string) => ({
                        label: item,
                        value: item,
                    }));
                }
            } else if (typeof value === 'object') {
                processNode(value, currentPath);
            }
        });
    };
    processNode(allParsedData);
    return finalSchema;
}


export async function createDataPackFromFiles(formData: FormData): Promise<ActionResponse> {
    const uid = await verifyAndGetUid();
    const supabase = await getSupabaseServerClient();
    if (!supabase) return { success: false, message: "Database service is not available." };

    const fileInput = formData.get('wildcardFiles') as File | null;
    const dataPackName = formData.get('name') as string;

    if (!dataPackName) return { success: false, message: "DataPack name is required." };
    if (!fileInput || fileInput.size === 0) return { success: false, message: "A file (.zip, .yaml, or .txt) is required." };
        
    try {
        const filesToProcess: { name: string; content: string }[] = [];
        let coverImageBuffer: Buffer | null = null;
        
        if (fileInput.type === 'application/zip' || fileInput.name.endsWith('.zip')) {
            const zipBuffer = Buffer.from(await fileInput.arrayBuffer());
            const zip = new AdmZip(zipBuffer);
            for (const entry of zip.getEntries()) {
                if (entry.isDirectory) continue;
                const entryNameLower = entry.entryName.toLowerCase();
                if (['cover.png', 'cover.jpg', 'cover.jpeg'].includes(entryNameLower)) {
                    coverImageBuffer = entry.getData();
                } else if (['.yaml', '.yml', '.txt'].includes(path.extname(entry.entryName).toLowerCase())) {
                     filesToProcess.push({ name: entry.entryName, content: entry.getData().toString('utf8') });
                }
            }
        } else if (['.yaml', '.yml', '.txt'].includes(path.extname(fileInput.name).toLowerCase())) {
            filesToProcess.push({ name: fileInput.name, content: await fileInput.text() });
        } else {
             return { success: false, message: "Unsupported file type." };
        }
        
        if (filesToProcess.length === 0) return { success: false, message: "No compatible files found." };

        const finalSchema = await buildSchemaFromFiles(filesToProcess);
        const schemaValidation = DataPackSchemaSchema.safeParse(finalSchema);
        if (!schemaValidation.success) throw new Error(`Schema validation failed: ${schemaValidation.error.message}`);
        
        const { data: insertedRow, error: insertError } = await supabase.from('datapacks').insert({
            name: dataPackName,
            author: 'Imported',
            description: `Imported from ${fileInput.name}`,
            user_id: uid,
            is_imported: true,
            schema_details: schemaValidation.data,
        }).select().single();

        if (insertError) throw insertError;

        let coverImageUrl = null;
        if(coverImageBuffer) {
            const destinationPath = `datapacks/${insertedRow.id}/cover.png`;
            coverImageUrl = await uploadToStorage(coverImageBuffer, destinationPath);
            const { error: updateError } = await supabase.from('datapacks').update({ cover_image_url: coverImageUrl }).eq('id', insertedRow.id);
            if(updateError) console.warn("Failed to update cover image URL for new datapack", updateError);
        }

        revalidatePath('/admin/datapacks');
        return { success: true, message: `DataPack \"${dataPackName}\" imported successfully.`, packId: insertedRow.id };

    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred during import.";
        return { success: false, message: "File import failed.", error: message };
    }
}


export async function upsertDataPack(data: UpsertDataPack, coverImage?: Buffer): Promise<ActionResponse> {
    const uid = await verifyAndGetUid();
    const supabase = await getSupabaseServerClient();
    if (!supabase) return { success: false, message: "Database service is not available." };
    
    const validation = UpsertDataPackSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, message: 'Validation failed.', error: validation.error.message };
    }
    const validatedData = validation.data;

    try {
        const packId = validatedData.id || undefined;
        let coverImageUrl: string | null = validatedData.coverImageUrl || null;

        if (coverImage && packId) {
            const destinationPath = `datapacks/${packId}/cover.png`;
            coverImageUrl = await uploadToStorage(coverImage, destinationPath);
        }

        const dataToUpsert = {
            id: packId,
            name: validatedData.name,
            author: validatedData.author,
            description: validatedData.description,
            type: validatedData.type,
            price: Number(validatedData.price),
            tags: validatedData.tags || [],
            schema_details: validatedData.schema,
            is_nsfw: validatedData.isNsfw || false,
            is_imported: validatedData.imported || false,
            cover_image_url: coverImageUrl,
            user_id: uid,
        };

        const { data: upsertedData, error } = await supabase.from('datapacks').upsert(dataToUpsert).select().single();
        if (error) throw error;
        
        revalidatePath('/admin/datapacks');
        revalidatePath(`/datapacks/${upsertedData.id}`);
        return { success: true, message: `DataPack saved successfully!`, packId: upsertedData.id };

    } catch(error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: 'Operation failed.', error: message };
    }
}


export async function deleteDataPack(packId: string): Promise<ActionResponse> {
    await verifyIsAdmin(); // Or check ownership
    const supabase = await getSupabaseServerClient();
    if (!supabase) return { success: false, message: "Database service is not available." };
    try {
        const { error } = await supabase.from('datapacks').delete().eq('id', packId);
        if (error) throw error;
        // Note: Deleting from storage would require listing and deleting files, which can be complex.
        // Usually handled with a database trigger or a cleanup job.
        revalidatePath('/admin/datapacks');
        revalidatePath('/datapacks');
        return { success: true, message: 'DataPack deleted successfully.' };
    } catch(error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: 'Failed to delete DataPack.', error: message };
    }
}


export async function getDataPacksForAdmin(): Promise<DataPack[]> {
    await verifyIsAdmin();
    const supabase = await getSupabaseServerClient();
    if (!supabase) return [];
    const { data, error } = await supabase.from('datapacks').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return Promise.all(data.map(dataPackFromRow));
}

export async function getDataPackForAdmin(packId: string): Promise<DataPack | null> {
    await verifyIsAdmin();
    const supabase = await getSupabaseServerClient();
    if (!supabase) return null;
    const { data, error } = await supabase.from('datapacks').select('*').eq('id', packId).single();
    if (error) {
        console.error("Error fetching single datapack for admin:", error);
        return null;
    }
    return data ? dataPackFromRow(data) : null;
}

export async function getPublicDataPack(packId: string): Promise<DataPack | null> {
    const supabase = await getSupabaseServerClient();
    if (!supabase) return null;
    const { data, error } = await supabase.from('datapacks').select('*').eq('id', packId).single();
    if (error) {
        console.error("Error fetching single public datapack:", error);
        return null;
    }
    return data ? dataPackFromRow(data) : null;
}

export async function getPublicDataPacks(): Promise<DataPack[]> {
    const supabase = await getSupabaseServerClient();
    if (!supabase) return [];
    const { data, error } = await supabase.from('datapacks').select('*').order('created_at', { ascending: false });
    if (error) {
        console.error("Error fetching public datapacks:", error);
        return [];
    }
    return Promise.all(data.map(dataPackFromRow));
}

export async function installDataPack(packId: string): Promise<{success: boolean, message: string}> {
    const uid = await verifyAndGetUid();
    const supabase = await getSupabaseServerClient();
    if (!supabase) return { success: false, message: "Database service is not available." };

    try {
        const { data: packData, error: packError } = await supabase.from('datapacks').select('type, name').eq('id', packId).single();
        if (packError || !packData) return { success: false, message: "This DataPack does not exist." };
        if (packData.type !== 'free') return { success: false, message: "This DataPack is not free." };

        const { data: userData, error: userError } = await supabase.from('users').select('preferences').eq('id', uid).single();
        if (userError) throw userError;

        const installedPacks = userData.preferences?.installed_packs || [];
        if (installedPacks.includes(packId)) return { success: false, message: "You have already installed this DataPack." };

        const newInstalledPacks = [...installedPacks, packId];
        const { error: updateError } = await supabase
            .from('users')
            .update({ preferences: { ...userData.preferences, installed_packs: newInstalledPacks } })
            .eq('id', uid);
        
        if(updateError) throw updateError;
        
        revalidatePath('/profile');
        revalidatePath('/datapacks');
        revalidatePath(`/datapacks/${packId}`);

        return { success: true, message: `Successfully installed \"${packData.name}\"!` };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: "Failed to install DataPack." };
    }
}

export async function getCreationsForDataPack(packId: string): Promise<any[]> {
    // This function now depends on `character-read`, which should be migrated first.
    // For now, returning an empty array to avoid breaking the build.
    return [];
}

export async function getInstalledDataPacks(): Promise<DataPack[]> {
    const uid = await verifyAndGetUid();
    const supabase = await getSupabaseServerClient();
    if (!supabase) return [];
    
    const { data: userData, error: userError } = await supabase.from('users').select('preferences').eq('id', uid).single();
    if(userError || !userData) return [];

    const installedPackIds = userData.preferences?.installed_packs || [];
    if (installedPackIds.length === 0) return [];
    
    const { data: packsData, error: packsError } = await supabase.from('datapacks').select('*').in('id', installedPackIds);
    if(packsError) return [];

    return Promise.all(packsData.map(dataPackFromRow));
}

export async function searchDataPacksByTag(tag: string): Promise<DataPack[]> {
    const supabase = await getSupabaseServerClient();
    if (!supabase || !tag) return [];

    const { data, error } = await supabase.from('datapacks')
        .select('*')
        .contains('tags', [tag.toLowerCase()])
        .order('created_at', { ascending: false });

    if (error) {
        console.error(`Error searching for datapacks with tag \"${tag}\":`, error);
        return [];
    }
    return Promise.all(data.map(dataPackFromRow));
}

export async function seedDataPacksFromAdmin(): Promise<ActionResponse> {
    // This function is highly specific to the Firebase/local file structure.
    // Migrating it would require a new strategy for seeding a Supabase DB,
    // likely using the Supabase CLI and local CSVs or SQL scripts.
    // For now, it will be disabled.
    return { success: false, message: 'Seeding from admin panel is not yet supported for Supabase.' };
}
