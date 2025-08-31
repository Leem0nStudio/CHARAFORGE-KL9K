
import type { UserInfo, UserMetadata } from 'firebase/auth';

/**
 * Represents the statistics for a user's activity.
 */
export interface UserStats {
  charactersCreated: number;
  totalLikes: number;
  followers: number; // Number of users following this user
  following: number; // Number of users this user is following
  collectionsCreated: number;
  installedPacks: string[];
  installedModels: string[]; // Updated to track installed models
  subscriptionTier: string;
  memberSince: number; // Stored as milliseconds since epoch
  points?: number; // Total gamification points
  unlockedAchievements?: string[]; // Array of Achievement IDs
}

export type UserPreferences = {
    theme: 'light' | 'dark' | 'system';
    notifications: {
        email: boolean;
    };
    privacy: {
        profileVisibility: 'public' | 'private';
    };
    huggingFaceApiKey?: string;
    openRouterApiKey?: string;
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
  preferences?: UserPreferences;
  avatarUpdatedAt?: number;
  profile?: {
    bio?: string;
    socialLinks?: {
      twitter?: string;
      artstation?: string;
      website?: string;
      // Add more social links as needed
    };
    featuredCharacters?: string[]; // Array of character IDs
  };
}
