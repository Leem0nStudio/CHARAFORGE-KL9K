

/**
 * Represents the statistics for a user's activity.
 */
export interface UserStats {
  charactersCreated: number;
  totalLikes: number;
  followers: number; // Number of users following this user
  following: number; // Number of users this user is following
  collectionsCreated: number;
  installed_packs?: string[];
  installed_models?: string[]; // Renamed for consistency with Supabase
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
    installed_packs?: string[];
    installed_models?: string[];
}

/**
 * Defines a serializable, "plain" user object that combines Supabase Auth info
 * with our custom profile data. This is safe to use in both Server and Client Components.
 */
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: 'admin' | 'moderator' | 'user';
  stats?: UserStats;
  preferences?: UserPreferences;
  profile?: {
    bio?: string;
    socialLinks?: {
      twitter?: string;
      artstation?: string;
      website?: string;
    };
    featuredCharacters?: string[]; // Array of character IDs
  };
}
