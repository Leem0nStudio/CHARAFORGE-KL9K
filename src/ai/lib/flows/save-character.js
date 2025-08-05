'use server';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveCharacter = saveCharacter;
/**
 * @fileOverview A server action to save a generated character to Firestore.
 *
 * - saveCharacter - Saves character data to the 'characters' collection.
 * - SaveCharacterInput - The input type for the saveCharacter function.
 */
const zod_1 = require("zod");
const firebaseServer_1 = require("../utils/firebaseServer"); // Changed import path
const firestore_1 = require("firebase-admin/firestore");
const headers_1 = require("next/headers");
const SaveCharacterInputSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required.'),
    description: zod_1.z.string(),
    biography: zod_1.z.string(),
    imageUrl: zod_1.z.string(),
});
async function getAuthenticatedUser() {
    if (!firebaseServer_1.adminAuth || !firebaseServer_1.adminDb) {
        // This check is redundant now with the check at the start of saveCharacter,
        // but keeping it here as a fail-safe within this specific function
        // could be considered good practice if this function were called
        // independently elsewhere without the initial check. However,
        // for simplicity and to avoid repetition given the current context,
        throw new Error('Server services are not available. Please try again later.');
    }
    let idToken;
    try {
        const cookieStore = await (0, headers_1.cookies)();
        idToken = cookieStore.get('firebaseIdToken')?.value;
    }
    catch (error) {
        // This can happen in some server environments.
        console.error('Failed to read cookies on server:', error);
        throw new Error('Server could not read the user session. Please try logging out and back in.');
    }
    if (!idToken) {
        throw new Error('User session not found. Please log in again.');
    }
    try {
        const decodedToken = await firebaseServer_1.adminAuth.verifyIdToken(idToken);
        const userRecord = await firebaseServer_1.adminAuth.getUser(decodedToken.uid);
        // Fallback to a generic name if displayName isn't set
        const displayName = userRecord.displayName || 'Anonymous';
        return { uid: decodedToken.uid, name: displayName };
    }
    catch (error) {
        console.error('Error verifying auth token or fetching user record:', error);
        // This is a critical security error, indicating a potentially tampered or expired token.
        throw new Error('Invalid or expired user session. Please log in again.');
    }
}
async function saveCharacter(input) {
    // Ensure server services are available before proceeding
    if (!firebaseServer_1.adminDb || !firebaseServer_1.adminAuth) {
        throw new Error('Server services are not available. Please try again later.');
    }
    // Validate the input data using Zod
    const validation = SaveCharacterInputSchema.safeParse(input);
    if (!validation.success) {
        // This validation prevents bad data from ever reaching the database.
        throw new Error(`Invalid character data: ${validation.error.message}`);
    }
    const { name, description, biography, imageUrl } = validation.data;
    const { uid, name: userName } = await getAuthenticatedUser();
    const userId = uid;
    try {
        const characterRef = firebaseServer_1.adminDb.collection('characters').doc();
        const userRef = firebaseServer_1.adminDb.collection('users').doc(userId); // Use the validated userId
        // Use a transaction to ensure both writes succeed or fail together.
        await firebaseServer_1.adminDb.runTransaction(async (transaction) => {
            transaction.set(characterRef, {
                userId,
                userName,
                name,
                description,
                biography,
                imageUrl,
                status: 'private', // Characters are private by default
                createdAt: firestore_1.FieldValue.serverTimestamp(),
            });
            // Atomically update user stats
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists || !userDoc.data()?.stats) {
                // If stats don't exist, create them.
                transaction.set(userRef, {
                    stats: { charactersCreated: 1 }
                }, { merge: true });
            }
            else {
                // Otherwise, increment the existing counter.
                transaction.update(userRef, {
                    'stats.charactersCreated': firestore_1.FieldValue.increment(1)
                });
            }
        });
        return { success: true, characterId: characterRef.id };
    }
    catch (error) {
        // Log different types of errors differently if needed
        if (error instanceof zod_1.ZodError) {
            console.error('Input validation failed:', error.message);
        }
        else {
            console.error('Error saving character to Firestore:', error);
        }
        // Provide a user-friendly error message.
        throw new Error('Could not save character due to a server error.');
    }
}
//# sourceMappingURL=save-character.js.map