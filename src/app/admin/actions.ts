'use server';

import { adminDb } from '@/lib/firebase/server';

// Define a type for the stats object for better type safety.
type DashboardStats = {
  totalUsers: number;
  totalCharacters: number;
  publicCharacters: number;
  privateCharacters: number;
};

// Return a consistent, zeroed-out object shape on initialization failure or error.
const zeroStats: DashboardStats = {
  totalUsers: 0,
  totalCharacters: 0,
  publicCharacters: 0,
  privateCharacters: 0,
};

export async function getDashboardStats(): Promise<DashboardStats> {
  if (!adminDb) {
    return zeroStats;
  }

  try {
    // Use Promise.all for concurrent data fetching.
    const [usersSnapshot, charactersSnapshot, publicCharactersSnapshot] = await Promise.all([
      adminDb.collection('users').count().get(),
      adminDb.collection('characters').count().get(),
      adminDb.collection('characters').where('status', '==', 'public').count().get()
    ]);
    
    const totalUsers = usersSnapshot.data().count;
    const totalCharacters = charactersSnapshot.data().count;
    const publicCharacters = publicCharactersSnapshot.data().count;
    const privateCharacters = totalCharacters - publicCharacters;

    return {
      totalUsers,
      totalCharacters,
      publicCharacters,
      privateCharacters,
    };
  } catch (error) {
    // Avoid logging errors in production environments for security.
    // A dedicated logging service should be used in a real-world app.
    if (process.env.NODE_ENV !== 'production') {
        console.error("Error fetching dashboard stats:", error);
    }
    // Return zeroed stats on error to prevent breaking the UI.
    return zeroStats;
  }
}
