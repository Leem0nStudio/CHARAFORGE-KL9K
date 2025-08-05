
'use server';

import type { UserInfo, UserMetadata } from 'firebase/auth';
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
 * Defines a serializable, "plain" user object that combines Firebase Auth info
 * with our custom Firestore data. This is safe to use in both Server and Client Components.
 * It intentionally omits methods like `getIdToken`.
 */
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
  metadata: UserMetadata;
  providerData: UserInfo[];
  stats?: UserStats;
  role?: 'admin' | 'moderator' | 'user';
  preferences?: DocumentData;
}
