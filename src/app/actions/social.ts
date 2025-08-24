
'use server';

import { adminDb } from '@/lib/firebase/server';
import { FieldValue } from 'firebase-admin/firestore';
import { verifyAndGetUid } from '@/lib/auth/server';
import { revalidatePath } from 'next/cache';
import type { Character } from '@/types/character';

type ActionResponse = {
    success: boolean;
    message: string;
    error?: string;
};

// Subcollection approach for scalability
const getLikeRef = (characterId: string, userId: string) => adminDb.collection('characters').doc(characterId).collection('likes').doc(userId);
const getFollowRef = (userId: string, userToFollowId: string) => adminDb.collection('users').doc(userId).collection('following').doc(userToFollowId);
const getFollowerRef = (userId: string, followerId: string) => adminDb.collection('users').doc(userId).collection('followers').doc(followerId);


export async function likeCharacter(characterId: string): Promise<ActionResponse> {
    const uid = await verifyAndGetUid();
    const characterRef = adminDb.collection('characters').doc(characterId);
    
    try {
        const characterDoc = await characterRef.get();
        if (!characterDoc.exists) return { success: false, message: "Character not found." };
        
        const authorId = (characterDoc.data() as Character).meta.userId;
        const authorRef = adminDb.collection('users').doc(authorId);
        
        await adminDb.runTransaction(async (transaction) => {
            const likeDoc = await transaction.get(getLikeRef(characterId, uid));
            if (likeDoc.exists) return; // User has already liked

            transaction.set(getLikeRef(characterId, uid), { likedAt: FieldValue.serverTimestamp() });
            transaction.update(characterRef, { 'meta.likes': FieldValue.increment(1) });
            transaction.update(authorRef, { 'stats.totalLikes': FieldValue.increment(1) });
        });
        
        revalidatePath(`/showcase/${characterId}`);
        return { success: true, message: "Character liked!" };
    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: "Failed to like character.", error: message };
    }
}

export async function unlikeCharacter(characterId: string): Promise<ActionResponse> {
    const uid = await verifyAndGetUid();
    const characterRef = adminDb.collection('characters').doc(characterId);

    try {
        const characterDoc = await characterRef.get();
        if (!characterDoc.exists) return { success: false, message: "Character not found." };

        const authorId = (characterDoc.data() as Character).meta.userId;
        const authorRef = adminDb.collection('users').doc(authorId);

        await adminDb.runTransaction(async (transaction) => {
            const likeDoc = await transaction.get(getLikeRef(characterId, uid));
            if (!likeDoc.exists) return; // User hasn't liked

            transaction.delete(getLikeRef(characterId, uid));
            transaction.update(characterRef, { 'meta.likes': FieldValue.increment(-1) });
            transaction.update(authorRef, { 'stats.totalLikes': FieldValue.increment(-1) });
        });
        
        revalidatePath(`/showcase/${characterId}`);
        return { success: true, message: "Character unliked." };
    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: "Failed to unlike character.", error: message };
    }
}

export async function followUser(userIdToFollow: string): Promise<ActionResponse> {
    const currentUserId = await verifyAndGetUid();
    if (currentUserId === userIdToFollow) return { success: false, message: "You cannot follow yourself." };

    try {
        await adminDb.runTransaction(async (transaction) => {
            const followDoc = await transaction.get(getFollowRef(currentUserId, userIdToFollow));
            if (followDoc.exists) return;

            transaction.set(getFollowRef(currentUserId, userIdToFollow), { followedAt: FieldValue.serverTimestamp() });
            transaction.set(getFollowerRef(userIdToFollow, currentUserId), { followedAt: FieldValue.serverTimestamp() });

            transaction.update(adminDb.collection('users').doc(currentUserId), { 'stats.following': FieldValue.increment(1) });
            transaction.update(adminDb.collection('users').doc(userIdToFollow), { 'stats.followers': FieldValue.increment(1) });
        });
        
        revalidatePath(`/users/${userIdToFollow}`);
        return { success: true, message: "User followed." };
    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: "Failed to follow user.", error: message };
    }
}

export async function unfollowUser(userIdToUnfollow: string): Promise<ActionResponse> {
    const currentUserId = await verifyAndGetUid();
    
    try {
        await adminDb.runTransaction(async (transaction) => {
            const followDoc = await transaction.get(getFollowRef(currentUserId, userIdToUnfollow));
            if (!followDoc.exists) return;

            transaction.delete(getFollowRef(currentUserId, userIdToUnfollow));
            transaction.delete(getFollowerRef(userIdToUnfollow, currentUserId));

            transaction.update(adminDb.collection('users').doc(currentUserId), { 'stats.following': FieldValue.increment(-1) });
            transaction.update(adminDb.collection('users').doc(userIdToUnfollow), { 'stats.followers': FieldValue.increment(-1) });
        });

        revalidatePath(`/users/${userIdToUnfollow}`);
        return { success: true, message: "User unfollowed." };
    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: "Failed to unfollow user.", error: message };
    }
}

export async function checkRelationship(userId: string, otherUserId: string): Promise<{ isFollowing: boolean; isFollowedBy: boolean;}> {
     const [followingDoc, followedByDoc] = await Promise.all([
        getFollowRef(userId, otherUserId).get(),
        getFollowerRef(userId, otherUserId).get()
    ]);
    return {
        isFollowing: followingDoc.exists,
        isFollowedBy: followedByDoc.exists,
    };
}

export async function getCharacterLikeStatus(characterId: string, userId?: string | null): Promise<boolean> {
    if (!userId) return false;
    const likeDoc = await getLikeRef(characterId, userId).get();
    return likeDoc.exists;
}
