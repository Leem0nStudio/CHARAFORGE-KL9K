'use server';

import type { User } from 'firebase/auth';
import type { DocumentData, Timestamp } from 'firebase/firestore';

/**
 * Represents the statistics for a user's activity.
 */
export interface UserStats {
  charactersCreated: number;
  totalLikes: number;
  collectionsCreated: number;
  installedPacks: string[];
  subscriptionTier: string;
  memberSince: Timestamp;
}

/**
 * Extends the base Firebase User with application-specific properties.
 */
export interface UserProfile extends User {
  stats?: UserStats;
  role?: 'admin' | 'moderator' | 'user';
  preferences?: DocumentData;
}
