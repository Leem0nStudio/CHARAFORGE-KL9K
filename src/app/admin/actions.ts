'use server';

import { adminDb } from '@/lib/firebase/server';

export async function getDashboardStats() {
  if (!adminDb) {
    return {
      totalUsers: 0,
      totalCharacters: 0,
      publicCharacters: 0,
      privateCharacters: 0,
    };
  }

  try {
    const usersSnapshot = await adminDb.collection('users').get();
    const charactersSnapshot = await adminDb.collection('characters').get();
    const publicCharactersSnapshot = await adminDb.collection('characters').where('status', '==', 'public').get();
    
    const totalUsers = usersSnapshot.size;
    const totalCharacters = charactersSnapshot.size;
    const publicCharacters = publicCharactersSnapshot.size;
    const privateCharacters = totalCharacters - publicCharacters;

    return {
      totalUsers,
      totalCharacters,
      publicCharacters,
      privateCharacters,
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    // Return zeroed stats on error
     return {
      totalUsers: 0,
      totalCharacters: 0,
      publicCharacters: 0,
      privateCharacters: 0,
    };
  }
}
